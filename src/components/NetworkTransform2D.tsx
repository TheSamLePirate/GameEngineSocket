import React, { useEffect } from 'react';
import { useNetworkEntity } from '../hooks/useNetworkEntity';

interface NetworkTransform2DProps {
    entityId: string;
    initialPos?: { x: number, y: number, rotation: number };
    x?: number;
    y?: number;
    rotation?: number;
    isOwner?: boolean;
    className?: string;
    children?: React.ReactNode;
    style?: React.CSSProperties;
}

/**
 * Component to synchronize the 2D position and rotation of a DOM element.
 * 
 * @param props 
 * @param props.entityId Unique ID for the entity.
 * @param props.isOwner Whether this client controls the entity.
 * @param props.x Current X position (if isOwner).
 * @param props.y Current Y position (if isOwner).
 * @param props.rotation Current rotation in degrees (if isOwner).
 * @param props.className Optional CSS class.
 * @param props.style Optional inline styles.
 */
export const NetworkTransform2D: React.FC<NetworkTransform2DProps> = ({
    entityId,
    initialPos = { x: 0, y: 0, rotation: 0 },
    x,
    y,
    rotation,
    isOwner = false,
    className,
    children,
    style
}) => {
    const [state, setNetworkState] = useNetworkEntity({
        entityId,
        initialState: initialPos,
        isOwner,
        broadcastRate: 50 // 20Hz update
    });

    // Sync props to network state if owner
    useEffect(() => {
        if (isOwner) {
            setNetworkState(prev => ({
                x: x ?? prev.x,
                y: y ?? prev.y,
                rotation: rotation ?? prev.rotation
            }));
        }
    }, [x, y, rotation, isOwner, setNetworkState]);

    return (
        <div
            className={className}
            style={{
                position: 'absolute',
                left: state.x,
                top: state.y,
                transform: `rotate(${state.rotation}deg)`,
                pointerEvents: isOwner ? 'auto' : 'none',
                transition: isOwner ? 'none' : 'transform 0.1s linear, left 0.1s linear, top 0.1s linear', // CSS transition for extra smoothness
                // Note: CSS transition might conflict with JS interpolation loop if not careful.
                // If JS loop updates running at 60fps, CSS transition is moot or jerky.
                // If JS loop updates at broadcaste rate, CSS handles in-between? 
                // Best: JS loop drives the style directly at 60fps.
                // Since useNetworkEntity causes re-renders on every JS loop tick (via setState),
                // we get smooth updates.
                ...style
            }}
        >
            {children}
        </div>
    );
};
