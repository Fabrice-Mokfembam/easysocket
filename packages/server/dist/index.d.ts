import { WebSocket } from 'ws';
interface WebSocketMessage {
    type: string;
    timestamp?: number;
    originalTimestamp?: number;
    content?: string;
    user?: string;
    [key: string]: any;
}
declare class MyWebSocketServer {
    private wss;
    private connectedClients;
    private port;
    private path;
    constructor(port?: number, path?: string);
    /**
     * Starts the WebSocket server.
     * @returns {Promise<void>}
     */
    start(): Promise<void>;
    /**
     * Stops the WebSocket server.
     * @returns {Promise<void>} A promise that resolves when the server is closed.
     */
    stop(): Promise<void>;
    private handleIncomingMessage;
    /**
     * Sends a structured message to a specific client.
     * @param {WebSocket} ws - The WebSocket instance of the client.
     * @param {WebSocketMessage} message - The message object to send.
     */
    sendMessage(ws: WebSocket, message: WebSocketMessage): void;
    /**
     * Broadcasts a structured message to all currently connected clients.
     * @param {WebSocketMessage} message - The message object to broadcast.
     */
    broadcastMessage(message: WebSocketMessage): void;
    /**
     * Get the number of currently connected clients.
     * @returns {number} The count of connected clients.
     */
    getConnectedClientCount(): number;
}
export default MyWebSocketServer;
