import { WebSocketServer, WebSocket } from 'ws';
import { TimelinePoint } from '../types/ApiTypes.js';
import { Server } from 'http';

const clients = new Set<WebSocket>();

export function setupWebSocket(server: Server) {
    const wss = new WebSocketServer({ server, path: '/ws/timeline' });

    wss.on('connection', (ws) => {
        clients.add(ws);
        console.log('Client connected to WebSocket');

        const interval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            }
        }, 30000);

        ws.on('close', () => {
            clients.delete(ws);
            clearInterval(interval);
            console.log('Client disconnected');
        });

        ws.on('error', (err) => {
            console.warn('WebSocket error:', err);
        });
    });
}

export function broadcastTimelinePoint(point: TimelinePoint) {
    const message = JSON.stringify({ type: 'timeline_point', data: point });

    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(message);
            } catch (err) {
                console.error("WebSocket send error:", err);
                clients.delete(client);
            }
        }
    }
}
