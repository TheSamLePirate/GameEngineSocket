import { useState } from 'react';
import { useGameSocket } from '../context/GameSocketContext';

/**
 * Helper hook for Room management.
 * Provides methods to join, create, and leave rooms, as well as the current room state and list of available rooms.
 * @returns Object with room management functions and state.
 */
export const useRoom = () => {
    const { joinRoom, createRoom, leaveRoom, currentRoom, rooms, refreshRooms } = useGameSocket();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleJoin = async (roomId: string, peerId?: string) => {
        setLoading(true);
        setError(null);
        try {
            await joinRoom(roomId, peerId);
        } catch (err: any) {
            setError(err.message || 'Failed to join room');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (roomId?: string) => {
        setLoading(true);
        setError(null);
        try {
            await createRoom(roomId);
        } catch (err: any) {
            setError(err.message || 'Failed to create room');
        } finally {
            setLoading(false);
        }
    };

    const handleLeave = async () => {
        setLoading(true);
        try {
            await leaveRoom();
        } catch (err: any) {
            setError(err.message || 'Failed to leave room');
        } finally {
            setLoading(false);
        }
    };

    return {
        joinRoom: handleJoin,
        createRoom: handleCreate,
        leaveRoom: handleLeave,
        currentRoom,
        rooms,
        refreshRooms,
        loading,
        error
    };
};
