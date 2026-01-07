# Game Engine Socket Client
A robust, modular React library for real-time multiplayer game development. Simplifies connecting to a custom game server using **Socket.IO** (with automatic REST fallback) and **WebRTC (PeerJS)** for peer-to-peer data.

## Features
- **Socket Client**: Singleton managing connection, authentication, and event handling.
- **State Synchronization**: `useNetworkEntity` hook with built-in interpolation for smooth movement.
- **Room Management**: Join, create, list, and sync members in rooms.
- **React Components**: Ready-to-use components for Chat to verify connection.
- **2D & 3D Support**: Components to easily sync `div` (2D) or R3F `group` (3D) transforms.

## Installation
```bash
npm install game-engine-socket
```

## Quick Start

### 1. Setup Provider
Wrap your application with the `GameSocketProvider`.
```tsx
import { GameSocketProvider } from 'game-engine-socket';

const App = () => (
  <GameSocketProvider>
    <MyGame />
  </GameSocketProvider>
);
```

### 2. Connect & Join
Connect to your server and join a room.
```tsx
import { useGameSocket, useRoom } from 'game-engine-socket';

const Lobby = () => {
  const { connect, isConnected } = useGameSocket();
  const { joinRoom } = useRoom();

  const handleConnect = () => {
    connect('http://localhost:3000', { 
        apiKey: 'YOUR_API_KEY', 
        userId: 'unique-user-id' 
    });
  };

  return (
    <div>
        {!isConnected ? (
            <button onClick={handleConnect}>Connect</button>
        ) : (
            <button onClick={() => joinRoom('lobby')}>Join Lobby</button>
        )}
    </div>
  );
};
```

### 3. Synchronize Entities
Use `NetworkTransform2D` (for DOM elements) or `NetworkTransform3D` (for React Three Fiber) to automatically sync position and rotation.

**Owner (Your Player):**
```tsx
<NetworkTransform2D
    entityId="my-player-id"
    isOwner={true}
    x={myX}
    y={myY}
    rotation={myRotation}
>
    <div className="player-sprite" />
</NetworkTransform2D>
```

**Remote (Other Players):**
```tsx
// Iterate over room members
{currentRoom.members.map(member => (
    member.userId !== myId && (
        <NetworkTransform2D
            key={member.userId}
            entityId={`player-${member.userId}`}
            isOwner={false}
        >
            <div className="other-player-sprite" />
        </NetworkTransform2D>
    )
))}
```

## API Reference

### useGameSocket
- `client`: The underlying SocketClient instance.
- `connect(url, auth)`: Connect to game server.
- `disconnect()`: Disconnect.
- `isConnected`: Boolean status.
- `socketId`: Current socket ID.

### useRoom
- `joinRoom(roomId)`: Join a room.
- `createRoom(roomId?)`: Create new room.
- `leaveRoom()`: Leave current room.
- `currentRoom`: Current room object (id, members, etc).
- `rooms`: List of available rooms.
- `refreshRooms()`: Refresh the list.

### useNetworkEntity(options)
Low-level hook for custom sync logic.
- `state`: The interpolated current state.
- `setNetworkState`: Function to update state (broadcasts if `isOwner` is true).
