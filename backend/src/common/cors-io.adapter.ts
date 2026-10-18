import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions } from 'socket.io';

/** Socket.IO with the same CORS origins as the REST API (CORS_ORIGINS). */
export class CorsIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly origins: string[],
  ) {
    super(app);
  }

  override createIOServer(port: number, options?: Partial<ServerOptions>): Server {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.origins, credentials: true },
    } as ServerOptions) as Server;
  }
}
