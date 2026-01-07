import { io, Socket } from 'socket.io-client';
import { AuthData, Room, CustomEvent, PresenceEvent } from '../types';

type EventCallback<T = any> = (data: T) => void;

export class SocketClient {
    private static instance: SocketClient;
    public socket: Socket | null = null;
    private auth: AuthData | null = null;
    private url: string = 'http://localhost:3000';

    // Event listeners map
    private listeners: Map<string, Set<EventCallback>> = new Map();

    private constructor() { }

    public static getInstance(): SocketClient {
        if (!SocketClient.instance) {
            SocketClient.instance = new SocketClient();
        }
        return SocketClient.instance;
    }

    public connect(url: string, auth: AuthData): Socket {
        if (this.socket?.connected) {
            if (this.url === url && this.auth?.apiKey === auth.apiKey && this.auth?.userId === auth.userId) {
                console.log('Socket already connected with same config');
                return this.socket;
            }
            this.socket.disconnect();
        }

        this.url = url;
        this.auth = auth;

        this.socket = io(url, {
            auth: {
                apiKey: auth.apiKey,
                userId: auth.userId,
            },
            transports: ['polling', 'websocket'], // Allow polling fallback
            reconnection: true,
        });

        this.setupBaseListeners();
        return this.socket;
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    private setupBaseListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Socket Connected:', this.socket?.id);
            this.notifyListeners('connect', { connected: true, socketId: this.socket?.id });

            // Re-attach all custom listeners being tracked
            this.listeners.forEach((_, event) => {
                if (event !== 'connect' && event !== 'disconnect' && event !== 'connect_error' && event !== 'room:presence' && event !== 'room:emit') {
                    if (!this.socket?.hasListeners(event)) {
                        this.socket?.on(event, (data) => this.notifyListeners(event, data));
                    }
                }
            });
        });

        this.socket.on('disconnect', () => {
            console.log('Socket Disconnected');
            this.notifyListeners('disconnect', { connected: false });
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket Connection Error:', err);
            this.notifyListeners('error', err);
        });

        this.socket.on('room:presence', (data: PresenceEvent) => {
            this.notifyListeners('room:presence', data);
        });

        this.socket.on('room:emit', (data: CustomEvent) => {
            // General listener for all custom events
            this.notifyListeners('room:emit', data);

            // Specific listener for the custom event name
            if (data.event) {
                this.notifyListeners(data.event, data);
            }
        });
    }

    // Room Management
    public createRoom(roomId?: string): Promise<Room> {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject('No socket connection');
            this.socket.emit('room:create', { roomId }, (response: any) => {
                if (response && response.roomId) resolve(response as Room); // Ideally response is the Room object
                // Per spec, 'room:create' ack returns { roomId: "..." }. 
                // But let's assume valid room creation. 
                // Wait, the spec says Ack: { "roomId": "..." }
                // It might be better to fetch room info after? Or maybe we just resolve with partial?
                // Let's resolve with what we get.
                else resolve(response);
            });
        });
    }

    public joinRoom(roomId: string, peerId?: string): Promise<{ ok: boolean, role: string }> {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject('No socket connection');
            this.socket.emit('room:join', { roomId, peerId }, (response: any) => {
                if (response && response.ok) resolve(response);
                else reject(response);
            });
        });
    }

    public leaveRoom(roomId: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject('No socket connection');
            this.socket.emit('room:leave', { roomId }, (response: any) => {
                if (response && response.ok) resolve(true);
                else reject(false);
            });
        });
    }

    // Messaging
    public emitToRoom(roomId: string, event: string, payload: any): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject('No socket connection');
            this.socket.emit('room:emit', { roomId, event, payload }, (response: any) => {
                if (response && response.ok) resolve(true);
                else reject(false);
            });
        });
    }

    // Subscription System
    public on(event: string, callback: EventCallback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());

            // If connected, subscribe on the real socket too
            if (this.socket) {
                this.socket.on(event, (data: any) => {
                    this.notifyListeners(event, data);
                });
            }
        }
        this.listeners.get(event)?.add(callback);
    }

    public off(event: string, callback: EventCallback) {
        this.listeners.get(event)?.delete(callback);
    }

    private notifyListeners(event: string, data: any) {
        this.listeners.get(event)?.forEach(cb => cb(data));
    }
}
