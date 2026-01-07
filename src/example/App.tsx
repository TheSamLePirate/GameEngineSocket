import React, { useState } from 'react';
import { GameConnection, ChatBox, NetworkTransform2D, useGameSocket, useRoom } from '../index';

export const DemoApp: React.FC = () => {
    const { isConnected, me } = useGameSocket();
    const { joinRoom, createRoom, currentRoom, rooms, refreshRooms } = useRoom();
    const [roomIdInput, setRoomIdInput] = useState('lobby');

    // Local control for our player
    const [myPos, setMyPos] = useState({ x: 100, y: 100, rotation: 0 });

    const handleMove = (dx: number, dy: number) => {
        setMyPos(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    };

    return (
        <div className="container mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-bold">GameEngineSocket Demo</h1>

            <GameConnection />

            {isConnected && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="border p-4 bg-white rounded">
                        <h2 className="text-xl font-bold mb-2">Room Management</h2>
                        <div className="flex gap-2 mb-2">
                            <input
                                className="border p-1"
                                value={roomIdInput}
                                onChange={e => setRoomIdInput(e.target.value)}
                            />
                            <button
                                className="bg-green-500 text-white px-3 py-1 rounded"
                                onClick={() => joinRoom(roomIdInput)}
                            >
                                Join
                            </button>
                            <button
                                className="bg-purple-500 text-white px-3 py-1 rounded"
                                onClick={() => createRoom(roomIdInput)}
                            >
                                Create
                            </button>
                        </div>
                        <div className="mt-2">
                            <h3 className="text-sm font-bold">Available Rooms</h3>
                            <div className="flex gap-2 mb-2">
                                <button className="text-xs bg-gray-200 px-2 py-1 rounded" onClick={refreshRooms}>Refresh</button>
                            </div>
                            <ul className="text-sm space-y-1">
                                {rooms.map(r => (
                                    <li key={r.roomId} className="flex justify-between items-center bg-gray-50 p-1 rounded">
                                        <span>{r.roomId} ({r.members?.length || 0})</span>
                                        <button
                                            className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-700"
                                            onClick={() => { setRoomIdInput(r.roomId); joinRoom(r.roomId); }}
                                        >
                                            Join
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {currentRoom && (
                            <div className="text-sm mt-4 border-t pt-2">
                                <p>Current Room: <b>{currentRoom.roomId}</b></p>
                                <p>Members: {currentRoom.members?.length}</p>
                            </div>
                        )}
                    </div>

                    <div className="border p-4 bg-white rounded">
                        <h2 className="text-xl font-bold mb-2">Chat</h2>
                        <ChatBox />
                    </div>
                </div>
            )}

            {isConnected && currentRoom && (
                <div className="relative h-96 border bg-gray-100 overflow-hidden rounded">
                    <div className="absolute top-2 left-2 z-10 bg-white/80 p-2 rounded">
                        <p>Use buttons to move (simulated input)</p>
                        <div className="flex gap-1 mt-1">
                            <button onClick={() => handleMove(0, -10)} className="bg-gray-300 p-1">U</button>
                            <button onClick={() => handleMove(0, 10)} className="bg-gray-300 p-1">D</button>
                            <button onClick={() => handleMove(-10, 0)} className="bg-gray-300 p-1">L</button>
                            <button onClick={() => handleMove(10, 0)} className="bg-gray-300 p-1">R</button>
                        </div>
                    </div>

                    {/* My Player (Owner) */}
                    <NetworkTransform2D
                        entityId={`player-${me?.userId}`}
                        initialPos={myPos}
                        x={myPos.x}
                        y={myPos.y}
                        rotation={myPos.rotation}
                        isOwner={true}
                        className="w-10 h-10 bg-blue-500 rounded-full border-2 border-white shadow flex items-center justify-center"
                    >
                        <span className="text-xs text-white">Me</span>
                    </NetworkTransform2D>

                    {/* Other players */}
                    {currentRoom.members?.map(m => {
                        if (m.userId === me?.userId) return null; // Skip self
                        // We need a way to know their position.
                        // NetworkTransform2D automatically listens for updates from 'entityId'.
                        // We assume their entityId is `player-${m.userId}` or similar.
                        // Logic must match what the owner broadcasts.
                        // In this demo, owner uses `player-${socketId}`. 
                        // But wait, the `members` list has `socketId` (if assuming admin/fetched correctly) or `userId`.
                        // Our `me` has `userId`. 
                        // The socketId in member list might be empty if we joined via REST and it's not populated, 
                        // BUT `client.join` returns success. 
                        // Actually, `socketId` IS in the socket handshake. 
                        // Let's assume for this demo we use `userId` as the stable ID if possible, BUT 
                        // `socketId` is what changed on reconnect.
                        // The demo uses `player-${socketId}` for MY ID.
                        // We should shift to `player-${userId}` for stability if userId is stable.
                        // GameConnection sets a random userId.
                        // Let's use `player-${m.userId}` everywhere.

                        return (
                            <NetworkTransform2D
                                key={m.userId}
                                entityId={`player-${m.userId}`}
                                initialPos={{ x: 50, y: 50, rotation: 0 }} // Default spawn
                                isOwner={false}
                                className="w-10 h-10 bg-red-500 rounded-full border-2 border-white shadow flex items-center justify-center"
                            >
                                <span className="text-xs text-white">{m.userId.slice(0, 4)}</span>
                            </NetworkTransform2D>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
