import { Server } from 'socket.io';
import { RoomManager } from '../games/RoomManager';

export const roomManager = new RoomManager();

let ioInstance: Server | null = null;

export function setSocketIO(io: Server): void {
  ioInstance = io;
  roomManager.attachIO(io);
}

export function getSocketIO(): Server | null {
  return ioInstance;
}
