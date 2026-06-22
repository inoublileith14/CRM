export declare function createOAuthState(userId: string, secret: string): string;
export declare function verifyOAuthState(state: string, secret: string, userId: string): boolean;
