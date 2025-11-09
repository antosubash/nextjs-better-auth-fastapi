import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
    project: ["read", "list", "view", "create", "share", "update", "delete"],
    organization: ["read", "list", "view", "create", "update", "delete"],
    user: ["read", "list", "view", "create", "update", "delete", "ban", "unban", "set-role"],
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
    project: ["read", "list", "view", "create", "share", "update", "delete"],
    organization: ["read", "list", "view", "create", "update", "delete"],
    user: ["read", "list", "view", "create", "update", "delete", "ban", "unban", "set-role"],
    apiKey: ["read", "list", "view", "create", "update", "delete"],
    role: ["read", "list", "view", "create", "update", "delete"],
    team: ["read", "list", "view", "create", "update", "delete", "invite", "remove"],
    file: ["read", "list", "view", "create", "update", "delete", "upload", "download"],
    settings: ["read", "update"],
}); 

export const ownerRole = accessControl.newRole({ 
    project: ["create", "update", "delete"],
    role: ["read"],
}); 

export const myCustomRole = accessControl.newRole({ 
    project: ["create", "update", "delete"], 
    organization: ["update"], 
});

export const moderatorRole = accessControl.newRole({
    project: ["read", "list", "view", "update", "delete"],
    organization: ["read", "list", "view", "update"],
    user: ["read", "list", "view", "update"],
    team: ["read", "list", "view", "update", "remove"],
    file: ["read", "list", "view", "update", "delete", "download"],
    settings: ["read"],
});

export const editorRole = accessControl.newRole({
    project: ["read", "list", "view", "create", "share", "update"],
    organization: ["read", "list", "view", "update"],
    team: ["read", "list", "view", "create", "update", "invite"],
    file: ["read", "list", "view", "create", "update", "upload", "download"],
    settings: ["read"],
});

export const viewerRole = accessControl.newRole({
    project: ["read", "list", "view"],
    organization: ["read", "list", "view"],
    user: ["read", "list", "view"],
    team: ["read", "list", "view"],
    file: ["read", "list", "view", "download"],
    settings: ["read"],
});

export const supportRole = accessControl.newRole({
    user: ["read", "list", "view", "update"],
    organization: ["read", "list", "view", "update"],
    team: ["read", "list", "view"],
    settings: ["read", "update"],
}); 