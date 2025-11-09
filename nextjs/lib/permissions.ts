import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
    project: ["read", "list", "view", "create", "share", "update", "delete"],
    organization: ["read", "list", "view", "create", "update", "delete"],
    user: ["read", "list", "view", "create", "update", "delete"],
    apiKey: ["read", "list", "view", "create", "update", "delete"],
    role: ["read", "list", "view", "create", "update", "delete"],
    team: ["read", "list", "view", "create", "update", "delete", "invite", "remove"],
    file: ["read", "list", "view", "create", "update", "delete", "upload", "download"],
    settings: ["read", "update"],
} as const;

export const accessControl = createAccessControl(statement);

export const memberRole = accessControl.newRole({ 
    project: ["create"], 
}); 

export const adminRole = accessControl.newRole({ 
    project: ["create", "update"], 
}); 

export const ownerRole = accessControl.newRole({ 
    project: ["create", "update", "delete"], 
}); 

export const myCustomRole = accessControl.newRole({ 
    project: ["create", "update", "delete"], 
    organization: ["update"], 
});

// Super admin role with all permissions
export const superAdminRole = accessControl.newRole({
    project: ["read", "list", "view", "create", "share", "update", "delete"],
    organization: ["read", "list", "view", "create", "update", "delete"],
    user: ["read", "list", "view", "create", "update", "delete"],
    apiKey: ["read", "list", "view", "create", "update", "delete"],
    role: ["read", "list", "view", "create", "update", "delete"],
    team: ["read", "list", "view", "create", "update", "delete", "invite", "remove"],
    file: ["read", "list", "view", "create", "update", "delete", "upload", "download"],
    settings: ["read", "update"],
}); 