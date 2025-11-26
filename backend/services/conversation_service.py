"""Conversation service for managing chat conversations."""

from datetime import UTC, datetime
import logging
from typing import TypedDict
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import ErrorMessages
from core.exceptions import AppException
from models.chat import ChatConversation, ChatMessage

logger = logging.getLogger(__name__)


class MessageData(TypedDict):
    """Message data for creating a message."""

    role: str
    content: str
    model: str | None


class ConversationService:
    """Service for conversation operations."""

    async def create_conversation(
        self, session: AsyncSession, user_id: str, title: str
    ) -> ChatConversation:
        """
        Create a new conversation.

        Args:
            session: Database session
            user_id: User ID who owns the conversation
            title: Conversation title

        Returns:
            Created conversation

        Raises:
            AppException: If conversation creation fails
        """
        try:
            conversation = ChatConversation(
                user_id=user_id,
                title=title,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC),
            )
            session.add(conversation)
            await session.commit()
            await session.refresh(conversation)
            logger.info(f"Created conversation {conversation.id} for user {user_id}")
        except Exception as e:
            await session.rollback()
            logger.error(f"Failed to create conversation: {e!s}", exc_info=True)
            raise AppException(
                status_code=500,
                detail=ErrorMessages.CONVERSATION_CREATE_ERROR,
            ) from e
        else:
            return conversation

    async def get_conversation(
        self, session: AsyncSession, conversation_id: UUID, user_id: str
    ) -> ChatConversation | None:
        """
        Get a conversation by ID.

        Args:
            session: Database session
            conversation_id: Conversation ID
            user_id: User ID for access control

        Returns:
            Conversation if found and accessible, None otherwise
        """
        query = select(ChatConversation).where(
            ChatConversation.id == conversation_id,
            ChatConversation.user_id == user_id,
        )
        result = await session.execute(query)
        return result.scalar_one_or_none()

    async def get_conversation_for_update(
        self, session: AsyncSession, conversation_id: UUID, user_id: str
    ) -> ChatConversation | None:
        """
        Get a conversation by ID with row locking.

        Args:
            session: Database session
            conversation_id: Conversation ID
            user_id: User ID for access control

        Returns:
            Conversation if found and accessible, None otherwise
        """
        query = (
            select(ChatConversation)
            .where(
                ChatConversation.id == conversation_id,
                ChatConversation.user_id == user_id,
            )
            .with_for_update()
        )
        result = await session.execute(query)
        return result.scalar_one_or_none()

    async def get_conversation_messages(
        self, session: AsyncSession, conversation_id: UUID, user_id: str
    ) -> list[ChatMessage]:
        """
        Get all messages for a conversation.

        Args:
            session: Database session
            conversation_id: Conversation ID
            user_id: User ID for access control

        Returns:
            List of messages ordered by created_at

        Raises:
            AppException: If conversation not found
        """
        # Verify conversation exists and belongs to user
        conversation = await self.get_conversation(session, conversation_id, user_id)
        if not conversation:
            raise AppException(
                status_code=404,
                detail=ErrorMessages.CONVERSATION_NOT_FOUND,
            )

        query = (
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .order_by(ChatMessage.created_at.asc())
        )
        result = await session.execute(query)
        messages = result.scalars().all()
        return list(messages)

    async def list_conversations(
        self, session: AsyncSession, user_id: str, limit: int = 100, offset: int = 0
    ) -> tuple[list[ChatConversation], int]:
        """
        List conversations for a user.

        Args:
            session: Database session
            user_id: User ID
            limit: Maximum number of conversations to return
            offset: Number of conversations to skip

        Returns:
            Tuple of (conversations list, total count)
        """
        # Get total count
        count_query = select(ChatConversation).where(ChatConversation.user_id == user_id)
        count_result = await session.execute(count_query)
        total = len(count_result.scalars().all())

        # Get conversations ordered by updated_at descending
        query = (
            select(ChatConversation)
            .where(ChatConversation.user_id == user_id)
            .order_by(ChatConversation.updated_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await session.execute(query)
        conversations = result.scalars().all()
        return list(conversations), total

    async def update_conversation(
        self, session: AsyncSession, conversation_id: UUID, user_id: str, title: str
    ) -> ChatConversation:
        """
        Update a conversation.

        Args:
            session: Database session
            conversation_id: Conversation ID
            user_id: User ID for access control
            title: New title

        Returns:
            Updated conversation

        Raises:
            AppException: If conversation not found or update fails
        """
        conversation = await self.get_conversation(session, conversation_id, user_id)
        if not conversation:
            raise AppException(
                status_code=404,
                detail=ErrorMessages.CONVERSATION_NOT_FOUND,
            )

        try:
            conversation.title = title
            conversation.updated_at = datetime.now(UTC)
            await session.commit()
            await session.refresh(conversation)
            logger.info(f"Updated conversation {conversation_id}")
        except Exception as e:
            await session.rollback()
            logger.error(f"Failed to update conversation: {e!s}", exc_info=True)
            raise AppException(
                status_code=500,
                detail=ErrorMessages.CONVERSATION_UPDATE_ERROR,
            ) from e
        else:
            return conversation

    async def delete_conversation(
        self, session: AsyncSession, conversation_id: UUID, user_id: str
    ) -> None:
        """
        Delete a conversation and all its messages.

        Args:
            session: Database session
            conversation_id: Conversation ID
            user_id: User ID for access control

        Raises:
            AppException: If conversation not found or delete fails
        """
        conversation = await self.get_conversation(session, conversation_id, user_id)
        if not conversation:
            raise AppException(
                status_code=404,
                detail=ErrorMessages.CONVERSATION_NOT_FOUND,
            )

        try:
            # Delete all messages first using bulk delete
            # (CASCADE will handle this automatically once migration is applied)
            delete_messages_stmt = delete(ChatMessage).where(
                ChatMessage.conversation_id == conversation_id
            )
            await session.execute(delete_messages_stmt)

            # Delete the conversation
            await session.delete(conversation)
            await session.commit()
            logger.info(f"Deleted conversation {conversation_id}")
        except Exception as e:
            await session.rollback()
            logger.error(f"Failed to delete conversation: {e!s}", exc_info=True)
            raise AppException(
                status_code=500,
                detail=ErrorMessages.CONVERSATION_DELETE_ERROR,
            ) from e

    async def add_message(
        self,
        session: AsyncSession,
        conversation_id: UUID,
        user_id: str,
        message_data: MessageData,
    ) -> ChatMessage:
        """
        Add a message to a conversation.

        Args:
            session: Database session
            conversation_id: Conversation ID
            user_id: User ID for access control
            message_data: Message data containing role, content, and optional model

        Returns:
            Created message

        Raises:
            AppException: If conversation not found or message creation fails
        """
        conversation = await self.get_conversation(session, conversation_id, user_id)
        if not conversation:
            raise AppException(
                status_code=404,
                detail=ErrorMessages.CONVERSATION_NOT_FOUND,
            )

        try:
            message = ChatMessage(
                conversation_id=conversation_id,
                role=message_data["role"],
                content=message_data["content"],
                model=message_data.get("model"),
                created_at=datetime.now(UTC),
            )
            session.add(message)
            # Update conversation's updated_at timestamp
            conversation.updated_at = datetime.now(UTC)
            await session.commit()
            await session.refresh(message)
            logger.info(f"Added message {message.id} to conversation {conversation_id}")
        except Exception as e:
            await session.rollback()
            logger.error(f"Failed to add message: {e!s}", exc_info=True)
            raise AppException(
                status_code=500,
                detail="Failed to add message",
            ) from e
        else:
            return message

    async def delete_message(self, session: AsyncSession, message_id: UUID, user_id: str) -> None:
        """
        Delete a message.

        Args:
            session: Database session
            message_id: Message ID
            user_id: User ID for access control

        Raises:
            AppException: If message not found or delete fails
        """
        # Get message and verify it belongs to user's conversation
        message_query = (
            select(ChatMessage)
            .join(ChatConversation)
            .where(
                ChatMessage.id == message_id,
                ChatConversation.user_id == user_id,
            )
        )
        result = await session.execute(message_query)
        message = result.scalar_one_or_none()

        if not message:
            raise AppException(
                status_code=404,
                detail=ErrorMessages.MESSAGE_NOT_FOUND,
            )

        try:
            await session.delete(message)
            # Update conversation's updated_at timestamp
            conversation_query = select(ChatConversation).where(
                ChatConversation.id == message.conversation_id
            )
            conversation_result = await session.execute(conversation_query)
            conversation = conversation_result.scalar_one()
            conversation.updated_at = datetime.now(UTC)
            await session.commit()
            logger.info(f"Deleted message {message_id}")
        except Exception as e:
            await session.rollback()
            logger.error(f"Failed to delete message: {e!s}", exc_info=True)
            raise AppException(
                status_code=500,
                detail=ErrorMessages.MESSAGE_DELETE_ERROR,
            ) from e

    def generate_conversation_title(self, first_message: str) -> str:
        """
        Generate a conversation title from the first message.

        Args:
            first_message: First message content

        Returns:
            Generated title (truncated to 255 characters)
        """
        # Remove leading/trailing whitespace
        title = first_message.strip()
        # Truncate to 50 characters for title, or 255 max
        if len(title) > 50:
            title = title[:47] + "..."
        # Ensure it's not empty
        if not title:
            title = "New Conversation"
        # Ensure max length
        if len(title) > 255:
            title = title[:252] + "..."
        return title
