import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfile } from './interfaces/user.interface';
import { UsersService } from './users.service';
export declare class AuthService {
    private supabase;
    private usersService;
    private jwtService;
    private config;
    private readonly logger;
    constructor(supabase: SupabaseService, usersService: UsersService, jwtService: JwtService, config: ConfigService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        supabase_session: {
            access_token: string;
            refresh_token: string;
        } | null;
        user: {
            id: string;
            email: string;
            nombre: string;
            rol: string;
            avatar_url: string | null;
        };
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile>;
    register(dto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            nombre: string;
            rol: string;
        };
        mensaje: string;
        code: string;
    }>;
    inviteUser(params: {
        email: string;
        nombre: string;
        rol?: string;
    }): Promise<{
        userId: string;
    }>;
    provisionWorkerAccount(params: {
        email: string;
        nombre: string;
        rol?: string;
    }): Promise<{
        userId: string;
        invitationSent: boolean;
        createdNewAuthUser: boolean;
    }>;
    rollbackNewAuthUser(userId: string): Promise<void>;
    resendInvitation(email: string): Promise<void>;
    getProfile(userId: string): Promise<UserProfile>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        mensaje: string;
        code: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        mensaje: string;
        code: string;
    }>;
    private createAuthUserForWorker;
    private trySendWorkerInvitationEmail;
    private assertAuthUserExists;
    private isAuthUserAlreadyRegistered;
    private findAuthUserIdByEmail;
    private mapInviteError;
    private mapRegisterError;
    private mapResetError;
    private mapAuthError;
}
