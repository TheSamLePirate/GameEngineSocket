export const lerp = (start: number, end: number, t: number) => {
    return start * (1 - t) + end * t;
};

// A simple state interpolator for 2D/3D positions
// This assumes state has x, y, (z)
export const interpolateState = <T extends Record<string, any>>(currentState: T, targetState: T, t: number): T => {
    const result: any = { ...currentState };

    for (const key in targetState) {
        if (typeof targetState[key] === 'number' && typeof currentState[key] === 'number') {
            result[key] = lerp(currentState[key], targetState[key], t);
        } else {
            // For non-numeric values, snap to target
            result[key] = targetState[key];
        }
    }
    return result;
};
