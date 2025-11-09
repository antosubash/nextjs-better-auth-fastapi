import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
    project: ["create", "share", "update", "delete"],
    organization: ["create", "update", "delete"],
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