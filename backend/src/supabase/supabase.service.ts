import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly adminClient: SupabaseClient;
  private readonly anonClient: SupabaseClient;

  constructor(private config: ConfigService) {
    const url = SupabaseService.normalizeUrl(
      this.config.getOrThrow<string>('SUPABASE_URL'),
    );
    const serviceKey = this.config.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    const anonKey = this.config.getOrThrow<string>('SUPABASE_ANON_KEY');

    this.adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    this.anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (serviceKey === anonKey) {
      this.logger.error(
        'SUPABASE_SERVICE_ROLE_KEY es igual a SUPABASE_ANON_KEY. ' +
          'Copia la clave "service_role" (secreta) en Supabase → Settings → API.',
      );
    } else if (SupabaseService.decodeJwtRole(serviceKey) !== 'service_role') {
      this.logger.error(
        'SUPABASE_SERVICE_ROLE_KEY no es una clave service_role válida. ' +
          'Usa la clave "service_role" de Supabase → Settings → API.',
      );
    }
  }

  onModuleInit() {
    const serviceKey = this.config.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    if (SupabaseService.decodeJwtRole(serviceKey) === 'service_role') {
      this.logger.log('Clave service_role de Supabase configurada correctamente');
    }
  }

  getAdmin(): SupabaseClient {
    return this.adminClient;
  }

  getAnon(): SupabaseClient {
    return this.anonClient;
  }

  /** Supabase client expects the project root URL, not /rest/v1 */
  private static normalizeUrl(raw: string): string {
    return raw.replace(/\/+$/, '').replace(/\/rest\/v1\/?$/, '');
  }

  private static decodeJwtRole(token: string): string | null {
    try {
      const payload = token.split('.')[1];
      const json = Buffer.from(payload, 'base64url').toString('utf8');
      return (JSON.parse(json) as { role?: string }).role ?? null;
    } catch {
      return null;
    }
  }
}
