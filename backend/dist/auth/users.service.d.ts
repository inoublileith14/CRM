import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { UserProfile } from './interfaces/user.interface';
export declare class UsersService implements OnModuleInit {
    private supabase;
    private config;
    private readonly logger;
    private avatarColumnAvailable;
    constructor(supabase: SupabaseService, config: ConfigService);
    onModuleInit(): Promise<void>;
    findById(id: string): Promise<UserProfile | null>;
    updateProfile(id: string, data: Partial<Pick<UserProfile, 'nombre' | 'rol' | 'avatar_url'>>): Promise<UserProfile | null>;
    createProfile(profile: UserProfile): Promise<void>;
    findByEmail(email: string): Promise<UserProfile | null>;
    private isMissingAvatarColumn;
    private hasAvatarColumn;
    private mapProfile;
    private seedAdmin;
}
