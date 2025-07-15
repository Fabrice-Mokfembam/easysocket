// packages/server/src/index.ts
import { WebSocketServer, WebSocket } from 'ws';
class MyWebSocketServer {
    constructor(port = 8080, path = '/websocket') {
        this.wss = null;
        this.port = port;
        this.path = path;
        this.connectedClients = new Set();
    }
    /**
     * Starts the WebSocket server.
     * @returns {Promise<void>}
     */
    start() {
        return new Promise((resolve, reject) => {
            this.wss = new WebSocketServer({ port: this.port, path: this.path });
            this.wss.on('listening', () => {
                console.log(`WebSocketServer: Server started on ws://localhost:${this.port}${this.path}`);
                resolve();
            });
            this.wss.on('connection', (ws, request) => {
                console.log('WebSocketServer: Client connected from:', request.socket.remoteAddress);
                this.connectedClients.add(ws);
                // Attach event listeners for this specific client
                ws.on('message', (message) => {
                    this.handleIncomingMessage(ws, message.toString());
                });
                ws.on('close', (code, reason) => {
                    console.log(`WebSocketServer: Client disconnected. Code: ${code}, Reason: ${reason.toString()}`);
                    this.connectedClients.delete(ws);
                });
                ws.on('error', (error) => {
                    console.error('WebSocketServer: Client error:', error);
                    this.connectedClients.delete(ws); // Ensure cleanup on error
                });
                // Send a welcome message to the newly connected client
                this.sendMessage(ws, { type: 'serverInfo', content: 'Welcome to the server!' });
            });
            this.wss.on('error', (error) => {
                console.error('WebSocketServer: Server error:', error);
                reject(error);
            });
        });
    }
    /**
     * Stops the WebSocket server.
     * @returns {Promise<void>} A promise that resolves when the server is closed.
     */
    stop() {
        return new Promise((resolve, reject) => {
            if (this.wss) {
                this.wss.close((err) => {
                    if (err) {
                        console.error('WebSocketServer: Error closing server:', err);
                        reject(err);
                    }
                    else {
                        console.log('WebSocketServer: Server stopped.');
                        this.connectedClients.clear(); // Clear all clients
                        this.wss = null;
                        resolve();
                    }
                });
            }
            else {
                console.warn("WebSocketServer: Server not running.");
                resolve(); // No server to stop
            }
        });
    }
    // Handle incoming messages based on your protocol
    handleIncomingMessage(ws, message) {
        try {
            const parsedMessage = JSON.parse(message);
            switch (parsedMessage.type) {
                case 'ping':
                    // Respond with a pong
                    this.sendMessage(ws, {
                        type: 'pong',
                        originalTimestamp: parsedMessage.timestamp,
                        serverTimestamp: Date.now()
                    });
                    break;
                case 'chatMessage':
                    console.log(`WebSocketServer: Chat message from client (${parsedMessage.user || 'Unknown'}): ${parsedMessage.content}`);
                    // Broadcast chat message to all connected clients
                    this.broadcastMessage({
                        type: 'chatMessage',
                        content: `${parsedMessage.user || 'Guest'}: ${parsedMessage.content}`
                    });
                    break;
                // Add more cases for other message types you define
                default:
                    console.log('WebSocketServer: Received unknown message type:', parsedMessage.type, parsedMessage);
                    this.sendMessage(ws, { type: 'error', content: 'Unknown message type' });
            }
        }
        catch (e) {
            console.error('WebSocketServer: Failed to parse message or invalid format:', message, e);
            this.sendMessage(ws, { type: 'error', content: 'Invalid message format (must be JSON)' });
        }
    }
    /**
     * Sends a structured message to a specific client.
     * @param {WebSocket} ws - The WebSocket instance of the client.
     * @param {WebSocketMessage} message - The message object to send.
     */
    sendMessage(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
        else {
            console.warn('WebSocketServer: Cannot send message, client not open.');
        }
    }
    /**
     * Broadcasts a structured message to all currently connected clients.
     * @param {WebSocketMessage} message - The message object to broadcast.
     */
    broadcastMessage(message) {
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
    getConnectedClientCount() {
        return this.connectedClients.size;
    }
}
export default MyWebSocketServer;
//# sourceMappingURL=index.js.map