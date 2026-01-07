import React, { useState, useEffect, useRef } from 'react';
import { useGameSocket } from '../context/GameSocketContext';

interface ChatMessage {
    id: string;
    sender: string; // userId
    text: string;
    ts: number;
}

/**
 * A simple chat component that users Socket.IO to send/receive messages in the current room.
 */
export const ChatBox: React.FC = () => {
    const { client, isConnected, me, currentRoom } = useGameSocket();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!client) return;

        const onMessage = (data: any) => {
            // Expecting { roomId, from, event: 'chat', payload: { text }, ts }
            // Or just data if the server sends payload directly?
            // Based on logs: {"roomId":..., "event":"chat", "payload":...}
            // data is the whole object.
            setMessages(prev => [...prev, {
                id: Math.random().toString(36),
                sender: data.from,
                text: data.payload?.text || data.text, // Handle potential variations
                ts: data.ts || Date.now()
            }]);
        };

        client.on('chat', onMessage);

        return () => {
            client.off('chat', onMessage);
        };
    }, [client]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const send = () => {
        if (!input.trim() || !isConnected || !currentRoom) return;

        // Broadcast
        client.emitToRoom(currentRoom.roomId, 'chat', { text: input });

        // Optimistic add (optional, but good for UX)
        // Actually the server might echo it back? 
        // Usually socket server echoes to everyone including sender, or excludes sender.
        // If excluding sender, we add manually. If broadcast to all, we wait.
        // Let's assume broadcast to all (easier) or just add it here.
        // If we add it here and server echoes, we might duplicate.
        // Let's assume we wait for server echo for consistency or handle dupes.
        // For responsiveness, let's add it.

        /* 
        setMessages(prev => [...prev, {
            id: Math.random().toString(),
            sender: me?.userId || 'Me',
            text: input,
            ts: Date.now()
        }]);
        */

        setInput('');
    };

    if (!isConnected || !currentRoom) return <div className="text-gray-500">Connect to a room to chat.</div>;

    return (
        <div className="flex flex-col h-64 border rounded bg-white shadow-sm">
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {messages.map(msg => {
                    const isMe = msg.sender === me?.userId;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs px-2 py-1 rounded ${isMe ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <div className="text-xs opacity-75 mb-0.5">{msg.sender}</div>
                                <div>{msg.text}</div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-2 border-t flex gap-2">
                <input
                    className="flex-1 border rounded px-2 py-1"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Type a message..."
                />
                <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={send}>Send</button>
            </div>
        </div>
    );
};
