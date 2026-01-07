/**
 * Authentication data required to connect to the game server.
 */
export interface AuthData {
    apiKey: string;
    userId: string;
    token?: string; // Optional JWT or similar
}

/**
 * Represents a game room.
 */
export interface Room {
    roomId: string;
    createdAt: number;
    createdBy: string;
    members: Member[];
    maxMembers?: number;
    isPrivate?: boolean;
    password?: string;
    bannedUserIds: string[];
    // meta?: any; // Custom room metadata
    admins: string[];
}

/**
 * Represents a user/member in a room.
 */
export interface Member {
    userId: string;
    socketId: string;
    isAdmin: boolean;
    joinedAt: number;
    peerId?: string; // WebRTC Peer ID
}

/**
 * Connection status of the socket.
 */
export interface ConnectionStatus {
    connected: boolean;
    socketId?: string;
    error?: any;
}

// Server -> Client Events
/**
 * Event payload for room presence changes (join/leave).
 */
export interface PresenceEvent {
    roomId: string;
    userId: string;
    event: 'join' | 'leave';
    peerId?: string;
    isAdmin: boolean;
    ts: number;
}

/**
 * Standard structure for events emitted by the server.
 */
export interface CustomEvent<T = any> {
    roomId: string;
    from: string; // userId of sender (or 'server')
    event: string;
    payload: T;
    ts: number;
}
