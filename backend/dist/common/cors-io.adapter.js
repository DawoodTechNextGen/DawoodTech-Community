import { IoAdapter } from '@nestjs/platform-socket.io';
export class CorsIoAdapter extends IoAdapter {
    origins;
    constructor(app, origins) {
        super(app);
        this.origins = origins;
    }
    createIOServer(port, options) {
        return super.createIOServer(port, {
            ...options,
            cors: { origin: this.origins, credentials: true },
        });
    }
}
//# sourceMappingURL=cors-io.adapter.js.map