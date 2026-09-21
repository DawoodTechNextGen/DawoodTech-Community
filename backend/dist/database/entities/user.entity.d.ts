export declare enum UserRole {
    INTERN = "intern",
    SUPERVISOR = "supervisor",
    ADMIN = "admin"
}
export declare enum UserStatus {
    ACTIVE = "active",
    DISABLED = "disabled"
}
export declare class User {
    id: number;
    email: string;
    username: string;
    passwordHash: string;
    fullName: string;
    bio: string | null;
    avatarUrl: string | null;
    role: UserRole;
    status: UserStatus;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
