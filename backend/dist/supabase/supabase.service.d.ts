import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
export declare class SupabaseService implements OnModuleInit {
    private config;
    private readonly logger;
    private readonly adminClient;
    private readonly anonClient;
    constructor(config: ConfigService);
    onModuleInit(): void;
    getAdmin(): SupabaseClient;
    getAnon(): SupabaseClient;
    private static normalizeUrl;
    private static decodeJwtRole;
}
