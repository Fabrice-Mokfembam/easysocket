
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';


interface WebSocketMessage {
    type: string;
    timestamp?: number;
    originalTimestamp?: number;
    content?: string;
    user?: string;
    [key: string]: any;
}

class MyWebSocketServer {
    private wss: WebSocketServer | null = null;
    private connectedClients: Set<WebSocket>;
    private port: number;
    private path: string;

    constructor(port: number = 8080, path: string = '/websocket') {
        this.port = port;
        this.path = path;
        this.connectedClients = new Set();
    }

    /**
     * Starts the WebSocket server.
     * @returns {Promise<void>} 
     */

    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.wss = new WebSocketServer({ port: this.port, path: this.path });

            this.wss.on('listening', () => {
                console.log(`WebSocketServer: Server started on ws://localhost:${this.port}${this.path}`);
                resolve();
            });

            this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
                console.log('WebSocketServer: Client connected from:', request.socket.remoteAddress);
                this.connectedClients.add(ws);

                
                ws.on('message', (message: Buffer) => { 
                    this.handleIncomingMessage(ws, message.toString());
                });

                ws.on('close', (code: number, reason: Buffer) => {
                    console.log(`WebSocketServer: Client disconnected. Code: ${code}, Reason: ${reason.toString()}`);
                    this.connectedClients.delete(ws);
                });

                ws.on('error', (error: Error) => {
                    console.error('WebSocketServer: Client error:', error);
                    this.connectedClients.delete(ws); 
                });

                
                this.sendMessage(ws, { type: 'serverInfo', content: 'Welcome to the server!' });
            });

            this.wss.on('error', (error: Error) => {
                console.error('WebSocketServer: Server error:', error);
                reject(error);
            });
        });
    }

    /**
     * Stops the WebSocket server.
     * @returns {Promise<void>} A promise that resolves when the server is closed.
     */


    stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.wss) {
                this.wss.close((err) => {
                    if (err) {
                        console.error('WebSocketServer: Error closing server:', err);
                        reject(err);
                    } else {
                        console.log('WebSocketServer: Server stopped.');
                        this.connectedClients.clear(); 
                        this.wss = null;
                        resolve();
                    }
                });
            } else {
                console.warn("WebSocketServer: Server not running.");
                resolve(); 
            }
        });
    }

    
    private handleIncomingMessage(ws: WebSocket, message: string): void {
        try {
            const parsedMessage: WebSocketMessage = JSON.parse(message);

            switch (parsedMessage.type) {
                case 'ping':
                    this.sendMessage(ws, {
                        type: 'pong',
                        originalTimestamp: parsedMessage.timestamp,
                        serverTimestamp: Date.now()
                    });
                    break;
                case 'chatMessage':
                    console.log(`WebSocketServer: Chat message from client (${parsedMessage.user || 'Unknown'}): ${parsedMessage.content}`);
                
                    this.broadcastMessage({
                        type: 'chatMessage',
                        content: `${parsedMessage.user || 'Guest'}: ${parsedMessage.content}`
                    });
                    break;
                default:
                    console.log('WebSocketServer: Received unknown message type:', parsedMessage.type, parsedMessage);
                    this.sendMessage(ws, { type: 'error', content: 'Unknown message type' });
            }
        } catch (e) {
            console.error('WebSocketServer: Failed to parse message or invalid format:', message, e);
            this.sendMessage(ws, { type: 'error', content: 'Invalid message format (must be JSON)' });
        }
    }

    /**
     * Sends a structured message to a specific client.
     * @param {WebSocket} ws 
     * @param {WebSocketMessage} message 
     */

    sendMessage(ws: WebSocket, message: WebSocketMessage): void {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        } else {
            console.warn('WebSocketServer: Cannot send message, client not open.');
        }
    }

    /**
     * Broadcasts a structured message to all currently connected clients.
     * @param {WebSocketMessage} message 
     */

    broadcastMessage(message: WebSocketMessage): void {
        const messageString = JSON.stringify(message);
        this.connectedClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageString);
            }
        });
    }

    /**
     * Get the number of currently connected clients.
     * @returns {number} The count of connected clients.
     */

    getConnectedClientCount(): number {
        return this.connectedClients.size;
    }
}

export default MyWebSocketServer;