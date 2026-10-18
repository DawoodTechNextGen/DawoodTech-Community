import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions } from 'socket.io';
export declare class CorsIoAdapter extends IoAdapter {
    private readonly origins;
    constructor(app: INestApplicationContext, origins: string[]);
    createIOServer(port: number, options?: Partial<ServerOptions>): Server;
}
