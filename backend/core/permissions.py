"""Permission checking utilities for API keys."""

from typing import Dict, Any, Optional
from core.constants import PermissionResources, PermissionActions


def check_api_key_permission(
    api_key_data: Dict[str, Any],
    resource: str,
    action: str
) -> bool:
    """
    Check if an API key has a specific permission.
    
    Args:
        api_key_data: API key data from request.state.api_key_data
                     Must contain 'permissions' key with dict format:
                     {resource: [action1, action2, ...]}
        resource: Permission resource (e.g., PermissionResources.PROJECT)
        action: Permission action (e.g., PermissionActions.READ)
        
    Returns:
        True if API key has the permission, False otherwise
    """
    if not api_key_data:
        return False
    
    permissions = api_key_data.get("permissions")
    if not permissions or not isinstance(permissions, dict):
        return False
    
    resource_actions = permissions.get(resource, [])
    if not isinstance(resource_actions, list):
        return False
    
    return action in resource_actions


def has_permission(
    api_key_data: Optional[Dict[str, Any]],
    resource: str,
    action: str
) -> bool:
    """
    Boolean check if API key has a specific permission.
    
    This is a convenience wrapper around check_api_key_permission that handles None.
    
    Args:
        api_key_data: API key data from request.state.api_key_data (can be None)
        resource: Permission resource (e.g., PermissionResources.PROJECT)
        action: Permission action (e.g., PermissionActions.READ)
        
    Returns:
        True if API key has the permission, False otherwise
    """
    if api_key_data is None:
        return False
    
    return check_api_key_permission(api_key_data, resource, action)


def get_api_key_permissions(api_key_data: Optional[Dict[str, Any]]) -> Dict[str, list[str]]:
    """
    Get all permissions for an API key.
    
    Args:
        api_key_data: API key data from request.state.api_key_data (can be None)
        
    Returns:
        Dictionary of permissions in format {resource: [action1, action2, ...]}
        Returns empty dict if no permissions or invalid data
    """
    if not api_key_data:
        return {}
    
    permissions = api_key_data.get("permissions")
    if not permissions or not isinstance(permissions, dict):
        return {}
    
    return permissions

