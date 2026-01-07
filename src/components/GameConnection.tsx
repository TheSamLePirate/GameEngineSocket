import React, { useState } from 'react';
import { useGameSocket } from '../context/GameSocketContext';

/**
 * A UI component that provides a simple form to connect to the game server.
 * Useful for debugging or quick prototyping.
 */
export const GameConnection: React.FC = () => {
    const { isConnected, connect, disconnect, socketId } = useGameSocket();
    const [url, setUrl] = useState('http://localhost:3000');
    const [apiKey, setApiKey] = useState('dev-secret-key-123');
    const [userId, setUserId] = useState('agent-' + Math.floor(Math.random() * 1000));

    if (isConnected) {
        return (
            <div className="p-4 border rounded bg-green-50">
                <h3 className="text-lg font-bold text-green-700">Connected</h3>
                <p>Socket ID: {socketId}</p>
                <button
                    onClick={disconnect}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 border rounded bg-gray-50">
            <h3 className="text-lg font-bold mb-4">Connect to Game Server</h3>
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium">Server URL</label>
                    <input
                        type="text"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">API Key</label>
                    <input
                        type="text"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">User ID</label>
                    <input
                        type="text"
                        value={userId}
                        onChange={e => setUserId(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <button
                    onClick={() => connect(url, { apiKey, userId })}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Connect
                </button>
            </div>
        </div>
    );
};
