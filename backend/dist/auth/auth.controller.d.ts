import { Request } from 'express';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfile } from './interfaces/user.interface';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            nombre: string;
            rol: string;
            avatar_url: string | null;
        };
    }>;
    register(_dto: RegisterDto): void;
    logout(): {
        mensaje: string;
    };
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        mensaje: string;
        code: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        mensaje: string;
        code: string;
    }>;
    me(req: Request & {
        user: UserProfile;
    }): Express.User & UserProfile;
    updateProfile(req: Request & {
        user: UserProfile;
    }, dto: UpdateProfileDto): Promise<UserProfile>;
}
