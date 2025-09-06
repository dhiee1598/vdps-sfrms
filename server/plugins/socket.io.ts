import type { NitroApp } from 'nitropack';

import { Server as Engine } from 'engine.io';
import { defineEventHandler } from 'h3';
import { Server } from 'socket.io';

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine();
  const io = new Server();

  io.bind(engine);

  io.on('connection', (socket) => {
  // Join cashier dashboards
    socket.on('newPayment', () => {
      socket.join('newPayment');
    });

    socket.on('newStudentAssessment', () => {
      socket.join('newStudentAssessment');
    });
  });

  nitroApp.hooks.hook('request', (event) => {
    event.context.io = io;
  });

  nitroApp.router.use('/socket.io/', defineEventHandler({
    handler(event) {
      // @ts-expect-error The '_query' property does not exist on the H3 event request type,
      // but it's required by the engine.io library. This line tells TypeScript to ignore the type error.
      engine.handleRequest(event.node.req, event.node.res);
      event._handled = true;
      event.context.io = io;
    },
    websocket: {
      open(peer) {
        // @ts-expect-error private method and property
        engine.prepare(peer._internal.nodeReq);
        // @ts-expect-error private method and property
        engine.onWebSocket(peer._internal.nodeReq, peer._internal.nodeReq.socket, peer.websocket);
      },
    },
  }));
});
