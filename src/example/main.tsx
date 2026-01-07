import React from 'react';
import ReactDOM from 'react-dom/client';
import { GameSocketProvider } from '../context/GameSocketContext';
import { DemoApp } from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <GameSocketProvider>
            <DemoApp />
        </GameSocketProvider>
    </React.StrictMode>
);
