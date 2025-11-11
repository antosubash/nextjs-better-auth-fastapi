"""File operations service."""

import aiofiles
from datetime import datetime
from pathlib import Path
from typing import Optional
import logging
from core.config import OUTPUT_FILE_PATH
from core.constants import ErrorMessages, SuccessMessages
from core.exceptions import FileOperationError

logger = logging.getLogger(__name__)


class FileService:
    """Service for file operations."""
    
    def __init__(self, file_path: Optional[str] = None):
        """
        Initialize file service.
        
        Args:
            file_path: Path to the output file. If None, uses config value.
        """
        self.file_path = Path(file_path or OUTPUT_FILE_PATH)
    
    async def write_data(self, content: str) -> str:
        """
        Write data to file asynchronously.
        
        Args:
            content: Content to write
            
        Returns:
            Success message
            
        Raises:
            FileOperationError: If write operation fails
        """
        try:
            now = datetime.now()
            formatted_date = now.strftime("%B %d, %Y at %I:%M %p")
            line = f"{formatted_date}: {content}\n"
            
            async with aiofiles.open(self.file_path, "a") as f:
                await f.write(line)
            
            logger.info(f"Data written to {self.file_path}: {content}")
            return SuccessMessages.DATA_WRITTEN
        except Exception as e:
            logger.error(f"Failed to write to file {self.file_path}: {str(e)}", exc_info=True)
            raise FileOperationError(
                f"{ErrorMessages.FILE_WRITE_ERROR}: {str(e)}"
            )
    
    async def read_data(self) -> str:
        """
        Read data from file asynchronously.
        
        Returns:
            File contents
            
        Raises:
            FileOperationError: If read operation fails
        """
        try:
            if not self.file_path.exists():
                return ""
            
            async with aiofiles.open(self.file_path, "r") as f:
                content = await f.read()
            
            return content
        except Exception as e:
            logger.error(f"Failed to read from file {self.file_path}: {str(e)}", exc_info=True)
            raise FileOperationError(
                f"{ErrorMessages.FILE_READ_ERROR}: {str(e)}"
            )

