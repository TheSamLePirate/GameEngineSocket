import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameSocket } from '../context/GameSocketContext';
import { CustomEvent } from '../types';
import { interpolateState } from '../logic/interpolation';

interface UseNetworkEntityOptions<T> {
    entityId: string;
    initialState: T;
    isOwner?: boolean; // If true, we broadcast updates. If false, we listen.
    broadcastRate?: number; // ms, default 100ms (10 ticks/sec)
    enableInterpolation?: boolean;
}

/**
 * Hook to synchronize an entity's state across the network.
 * 
 * @param options Configuration options
 * @param options.entityId Unique identifier for this entity.
 * @param options.initialState Initial state object.
 * @param options.isOwner If true, this client broadcasts updates for this entity. If false, it receives updates.
 * @param options.broadcastRate Interval in ms to broadcast updates (if isOwner). Default 100ms.
 * @param options.enableInterpolation If true, remote updates are interpolated for smooth movement. Default true.
 * @returns A tuple [state, setNetworkState]. `setNetworkState` works like standard React setState.
 */
export const useNetworkEntity = <T extends Record<string, any>>({
    entityId,
    initialState,
    isOwner = false,
    broadcastRate = 100, // 10Hz
    enableInterpolation = true,
}: UseNetworkEntityOptions<T>) => {
    const { client, currentRoom, isConnected } = useGameSocket();
    const [state, setState] = useState<T>(initialState);

    // Use refs for the "latest" known state to interpolate towards
    const targetStateRef = useRef<T>(initialState);
    const lastStateRef = useRef<T>(initialState);
    const lastUpdateTsRef = useRef<number>(Date.now());

    // Ref to track if we have pending updates to send
    const pendingUpdateRef = useRef<T | null>(null);

    // Buffer for interpolation
    // Simplification: We just interp from current->target over time? 
    // Or improved: Store snapshots. 
    // Let's keep it simple: "Snap to latest" or "Lerp to latest"


    useEffect(() => {
        if (!client || !currentRoom) return;

        const onEntityUpdate = (data: CustomEvent<{ entityId: string; state: T }>) => {
            if (data.event === 'entity:update' && data.payload.entityId === entityId) {
                if (!isOwner) {
                    // Received update from network
                    if (enableInterpolation) {
                        lastStateRef.current = state; // Current visual state
                        targetStateRef.current = data.payload.state;
                        lastUpdateTsRef.current = Date.now();
                        // We'll let the animation loop handle the setting
                    } else {
                        setState(data.payload.state);
                    }
                }
            }
        };

        client.on('entity:update', onEntityUpdate);
        return () => {
            client.off('entity:update', onEntityUpdate);
        };
    }, [client, currentRoom, entityId, isOwner, state, enableInterpolation]);

    // Broadcasting loop
    useEffect(() => {
        if (!isOwner || !isConnected || !currentRoom) return;

        const interval = setInterval(() => {
            if (pendingUpdateRef.current) {
                client.emitToRoom(currentRoom.roomId, 'entity:update', {
                    entityId,
                    state: pendingUpdateRef.current
                });
                // pendingUpdateRef.current = null; // Should we clear? 
                // If we clear, we stop sending if no change. 
                // But sometimes heartbeats are good.
                // Let's clear to save bandwidth if static.
                pendingUpdateRef.current = null;
            }
        }, broadcastRate);

        return () => clearInterval(interval);
    }, [isOwner, isConnected, currentRoom, entityId, broadcastRate, client]);

    // Interpolation Loop
    useEffect(() => {
        if (isOwner || !enableInterpolation) return;

        let animationFrameId: number;

        const animate = () => {
            const now = Date.now();
            const timeSinceUpdate = now - lastUpdateTsRef.current;
            // Assume broadcastRate is the interval between updates, so we interp over that time
            // We add a buffer factor (e.g. 1.5x) to smooth out jitter
            const buffer = broadcastRate * 1.5;
            let t = timeSinceUpdate / buffer;
            if (t > 1) t = 1;

            // Ideally we lerp from lastRenderedState to targetState
            // But here we'll just use the state from setState as "current" which might be updated by React
            // This hooks approach for animation is tricky due to closures.
            // A ref-based approach for 'currentState' would be better for high-freq updates.

            // For simplicity in this `useState` version:
            // Actually, we need to know the state "visually" where it was when we started interpolating.

            // Let's simplify: Direct lerp is complex in general React state.
            // We'll calculate the new state and set it.

            // If t < 1, we Interpolate
            if (t < 1) {
                const newState = interpolateState(lastStateRef.current, targetStateRef.current, t);
                setState(newState);
                animationFrameId = requestAnimationFrame(animate);
            } else {
                // We arrived (or overshoot protection)
                setState(targetStateRef.current);
                // check again next frame if new target arrives
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isOwner, enableInterpolation, broadcastRate]);
    // Note: Dependencies for the interpolation loop are tricky. 
    // Strictly, `targetStateRef` changes don't trigger re-run, which is good.
    // But we need the loop to keep running.

    const setNetworkState = useCallback((newState: T | ((prev: T) => T)) => {
        setState((prev) => {
            const resolved = typeof newState === 'function' ? (newState as any)(prev) : newState;
            if (isOwner) {
                pendingUpdateRef.current = resolved;
            }
            return resolved;
        });
    }, [isOwner]);

    return [state, setNetworkState] as const;
};
