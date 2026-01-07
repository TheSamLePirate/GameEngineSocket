import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SocketClient } from '../client/SocketClient';
import { PeerClient } from '../client/PeerClient';
import { RestApiClient } from '../client/RestApiClient';
import { AuthData, Room, PresenceEvent, ConnectionStatus } from '../types';

interface GameSocketContextType {
    client: SocketClient;
    isConnected: boolean;
    socketId?: string;
    currentRoom: Room | null;
    me: { userId: string } | null;
    connect: (url: string, auth: AuthData) => void;
    disconnect: () => void;
    joinRoom: (roomId: string, peerId?: string) => Promise<{ ok: boolean, role: string }>;
    createRoom: (roomId?: string) => Promise<Room>;
    leaveRoom: () => Promise<boolean>;
    rooms: Room[];
    refreshRooms: () => Promise<void>;
}

const GameSocketContext = createContext<GameSocketContextType | undefined>(undefined);

/**
 * Context Provider for Game Engine Socket.
 * Manages the singleton SocketClient, RestApiClient, and PeerClient.
 * Handles global connection state, room state tracking, and presence updates.
 */
export const GameSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [client] = useState(SocketClient.getInstance());
    const [peerClient] = useState(PeerClient.getInstance());
    const [restClient] = useState(new RestApiClient('http://localhost:3000', '')); // Default URL
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ connected: false });
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [me, setMe] = useState<{ userId: string } | null>(null);

    useEffect(() => {
        const handleConnect = (data: { connected: boolean; socketId: string }) => {
            setConnectionStatus({ connected: true, socketId: data.socketId });
        };

        const handleDisconnect = () => {
            setConnectionStatus({ connected: false, socketId: undefined });
            setCurrentRoom(null);
        };

        const handlePresence = (data: PresenceEvent) => {
            console.log('Presence update:', data);

            // Update currentRoom members
            setCurrentRoom(prev => {
                if (!prev || prev.roomId !== data.roomId) return prev;

                const newMembers = [...(prev.members || [])];
                if (data.event === 'join') {
                    // Check if already exists
                    if (!newMembers.find(m => m.userId === data.userId)) {
                        newMembers.push({
                            userId: data.userId,
                            socketId: '', // We don't know socketId from presence event usually, unless provided
                            isAdmin: data.isAdmin,
                            joinedAt: Date.now(),
                            peerId: data.peerId
                        });
                    }
                } else if (data.event === 'leave') {
                    const idx = newMembers.findIndex(m => m.userId === data.userId);
                    if (idx !== -1) newMembers.splice(idx, 1);
                }

                return { ...prev, members: newMembers };
            });

            if (data.event === 'join' && data.peerId && data.peerId !== peerClient.myPeerId) {
                peerClient.connectToPeer(data.peerId);
            }
        };

        client.on('connect', handleConnect);
        client.on('disconnect', handleDisconnect);
        client.on('room:presence', handlePresence);

        return () => {
            client.off('connect', handleConnect);
            client.off('disconnect', handleDisconnect);
            client.off('room:presence', handlePresence);
        };
    }, [client, peerClient]); // Added peerClient to dependencies

    const connect = (url: string, auth: AuthData) => {
        setMe({ userId: auth.userId });

        // Update REST client config
        restClient.updateConfig(url, auth.apiKey);

        client.connect(url, auth);
    };

    const disconnect = () => {
        client.disconnect();
        setMe(null);
    };

    const joinRoom = async (roomId: string, peerId?: string) => {
        try {
            // If peerId is not provided, try to initialize peer client?
            // Or just pass what is given.
            // The user spec says: Connect Peer, then send ID to socket.
            // So let's try to get ID if not passed.
            let myPeerId = peerId;
            if (!myPeerId && peerClient) {
                // Try to init? We need host/port configs.
                // Let's assume defaults for now or pass config in connect().
                // If we are already connected?
                myPeerId = peerClient.myPeerId || undefined;
            }

            const res = await client.joinRoom(roomId, myPeerId);

            // Fetch full room details to get members
            try {
                const roomList = await restClient.listRooms();
                const room = roomList.find(r => r.roomId === roomId);
                if (room) {
                    setCurrentRoom(room);
                } else {
                    // Fallback if not found in list (maybe private? or delays)
                    setCurrentRoom({
                        roomId,
                        createdAt: Date.now(),
                        createdBy: 'unknown',
                        admins: [],
                        members: [{ userId: me?.userId || 'unknown', socketId: '', isAdmin: false, joinedAt: Date.now(), peerId: myPeerId }],
                        bannedUserIds: []
                    });
                }
            } catch (err) {
                console.warn('Failed to fetch room details via REST:', err);
                // Fallback
                setCurrentRoom({
                    roomId,
                    createdAt: Date.now(),
                    createdBy: 'unknown',
                    admins: [],
                    members: [{ userId: me?.userId || 'unknown', socketId: '', isAdmin: false, joinedAt: Date.now(), peerId: myPeerId }],
                    bannedUserIds: []
                });
            }
            return res;
        } catch (e) {
            throw e;
        }
    };

    const createRoom = async (roomId?: string) => {
        try {
            const room = await client.createRoom(roomId);
            setCurrentRoom(room); // If we auto-join created rooms? Spec doesn't say.
            return room;
        } catch (e) {
            throw e;
        }
    };

    const leaveRoom = async () => {
        if (!currentRoom) return false;
        try {
            await client.leaveRoom(currentRoom.roomId);
            setCurrentRoom(null);
            return true;
        } catch (e) {
            throw e;
        }
    };

    const refreshRooms = async () => {
        try {
            const list = await restClient.listRooms();
            setRooms(list);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <GameSocketContext.Provider
            value={{
                client,
                isConnected: connectionStatus.connected,
                socketId: connectionStatus.socketId,
                currentRoom,
                me,
                connect,
                disconnect,
                joinRoom,
                createRoom,
                leaveRoom,
                rooms,
                refreshRooms
            }}
        >
            {children}
        </GameSocketContext.Provider>
    );
};


/**
 * Hook to access the GameSocket context.
 * @returns {GameSocketContextType} The context object containing client, connection status, and room methods.
 * @throws Will throw an error if used outside of a GameSocketProvider.
 */
export const useGameSocket = () => {
    const context = useContext(GameSocketContext);
    if (context === undefined) {
        throw new Error('useGameSocket must be used within a GameSocketProvider');
    }
    return context;
};
