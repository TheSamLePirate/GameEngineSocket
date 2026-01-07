import React, { useEffect } from 'react';
import { useNetworkEntity } from '../hooks/useNetworkEntity';

interface NetworkTransform3DProps {
    entityId: string;
    initialPos?: { x: number, y: number, z: number, rx: number, ry: number, rz: number };
    position?: [number, number, number];
    rotation?: [number, number, number];
    isOwner?: boolean;
    children?: React.ReactNode;
    // Pass-through props for R3F group
    [key: string]: any;
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            group: any;
        }
    }
}


// A component that renders a group (for use inside a Canvas)
// This must be used inside a R3F Canvas context generally, 
// OR it can strictly return the data if used as a hook.

/**
 * Component to synchronize 3D position/rotation (for React Three Fiber).
 * Renders a <group> element with the synchronized transform.
 * 
 * @param props
 * @param props.entityId Unique ID for the entity.
 * @param props.isOwner Whether this client controls the entity.
 * @param props.position [x, y, z] array (if isOwner).
 * @param props.rotation [x, y, z] array (Euler angles) (if isOwner).
 */
export const NetworkTransform3D: React.FC<NetworkTransform3DProps> = ({
    entityId,
    initialPos = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
    position,
    rotation,
    isOwner = false,
    children,
    ...groupProps
}) => {
    const [state, setNetworkState] = useNetworkEntity({
        entityId,
        initialState: initialPos,
        isOwner,
        broadcastRate: 50
    });

    useEffect(() => {
        if (isOwner && position && rotation) {
            setNetworkState(prev => ({
                ...prev,
                x: position[0],
                y: position[1],
                z: position[2],
                rx: rotation[0],
                ry: rotation[1],
                rz: rotation[2]
            }));
        }
    }, [position, rotation, isOwner, setNetworkState]);

    // We return a group. If this is used outside R3F, it will fail or just render a div?
    // User asked for "stub for Three.js". 
    // Ideally this library separates view from logic.
    // But let's assume this component is intended for R3F.
    // We'll render a 'group' element which is standard in R3F.
    // NOTE: If 'react-three-fiber' is not installed, 'group' is just an intrinsic element in JSX 
    // checking against react-dom types. In React Native or R3F it works.
    // To be safe in a generic library, we might need to cast or just assume the user uses it right.

    return React.createElement('group', {
        position: [state.x, state.y, state.z],
        rotation: [state.rx, state.ry, state.rz],
        ...groupProps
    }, children);
};
