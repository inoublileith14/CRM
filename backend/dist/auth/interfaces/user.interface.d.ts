export interface UserProfile {
    id: string;
    email: string;
    nombre: string;
    rol: string;
    avatar_url?: string | null;
}
export interface JwtPayload {
    sub: string;
    email: string;
    rol: string;
}
