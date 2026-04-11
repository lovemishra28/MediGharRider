import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, getSocketUrl } from '../config/api';

let socket: Socket | null = null;

// ─── Connection ──────────────────────────────────────────

export const connectSocket = async (token: string): Promise<Socket | null> => {
  if (socket?.connected) {
    return socket;
  }

  const url = await getSocketUrl();

  socket = io(url, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.error('🔌 Socket connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;

// ─── Rider Actions ───────────────────────────────────────

export const goOnline = (lat: number, lng: number) => {
  socket?.emit('rider:go-online', { lat, lng });
};

export const goOffline = () => {
  socket?.emit('rider:go-offline');
};

export const updateLocation = (lat: number, lng: number) => {
  socket?.emit('rider:location:update', { lat, lng });
};

// ─── Listeners ───────────────────────────────────────────

export const onNewOrder = (callback: (data: any) => void): (() => void) => {
  socket?.on('order:new', callback);
  return () => {
    socket?.off('order:new', callback);
  };
};

export const onOrderAccepted = (callback: (data: any) => void): (() => void) => {
  socket?.on('order:accepted', callback);
  return () => {
    socket?.off('order:accepted', callback);
  };
};

export const onStatusUpdate = (callback: (data: any) => void): (() => void) => {
  socket?.on('order:status-update', callback);
  return () => {
    socket?.off('order:status-update', callback);
  };
};

export const onRiderStatusChanged = (callback: (data: any) => void): (() => void) => {
  socket?.on('rider:status-changed', callback);
  return () => {
    socket?.off('rider:status-changed', callback);
  };
};
