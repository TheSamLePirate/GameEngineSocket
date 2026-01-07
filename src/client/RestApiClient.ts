import axios, { AxiosInstance } from 'axios';
import { Room } from '../types';

export class RestApiClient {
    private api: AxiosInstance;


    constructor(baseURL: string, apiKey: string) {
        this.api = axios.create({
            baseURL,
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
        });
    }

    public updateConfig(baseURL: string, apiKey: string) {
        this.api.defaults.baseURL = baseURL;
        this.api.defaults.headers['x-api-key'] = apiKey;
    }

    // A. Health Check
    public async checkHealth(): Promise<boolean> {
        try {
            const res = await this.api.get('/healthz');
            return res.data?.ok === true;
        } catch (e) {
            return false;
        }
    }

    // B. Admin: Create Room
    public async createRoom(createdBy: string, roomId?: string): Promise<Room> {
        const res = await this.api.post('/v1/rooms', { roomId, createdBy });
        return res.data;
    }

    // C. Admin: List Rooms
    public async listRooms(): Promise<Room[]> {
        const res = await this.api.get('/v1/rooms');
        return res.data;
    }

    // D. Emit to Socket Room via HTTP
    public async emitToSocket(roomId: string, event: string, payload: any): Promise<{ success: boolean; event: string; roomId: string }> {
        const res = await this.api.post(`/toSocket/${event}`, { roomId, payload });
        return res.data;
    }

    // E. In-Memory Store
    public async getMemory<T = any>(key: string): Promise<T | null> {
        try {
            const res = await this.api.get(`/memory/${key}`);
            return res.data;
        } catch (e: any) {
            if (e.response?.status === 404) return null;
            throw e;
        }
    }

    public async setMemory(key: string, data: any): Promise<{ success: boolean; key: string }> {
        const res = await this.api.post(`/memory/${key}`, data);
        return res.data;
    }
}
