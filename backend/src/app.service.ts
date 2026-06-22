import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      servicio: 'Cocount API',
      mensaje: 'API funcionando correctamente',
    };
  }
}
