import type { Server as SocketIOServer } from 'socket.io';

import 'h3';

declare module 'h3' {
  type H3EventContext = {
    io: SocketIOServer;
  };
}
