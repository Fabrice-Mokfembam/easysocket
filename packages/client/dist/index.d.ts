export interface WebSocketMessage {
    type: string;
    timestamp?: number;
    originalTimestamp?: number;
    content?: string;
    [key: string]: any;
}
/**
 * Connects to the WebSocket server.
 * @param {string} url - The WebSocket server URL (ws:// or wss://)
 */
export declare function connect(url: string): void;
/**
 * Sends a structured message to the WebSocket server.
 * Messages are automatically JSON.stringify'd.
 * @param {WebSocketMessage} messageData - The data object to send. Must have a 'type' property.
 */
export declare function send(messageData: WebSocketMessage): void;
/**
 * Disconnects from the WebSocket server.
 */
export declare function disconnect(): void;
/**
 * Checks if the WebSocket is currently connected.
 * @returns {boolean} True if connected, false otherwise.
 */
export declare function isConnected(): boolean;
/**
 * Subscribes a callback to a specific WebSocket event.
 * Events: 'connected', 'disconnected', 'reconnecting', 'error', 'message', 'pong',
 * and any custom message.type from the server (e.g., 'chatMessage').
 * @param {string} eventName - The name of the event to subscribe to.
 * @param {Function} callback - The callback function to execute when the event fires.
 */
export declare function on(eventName: string, callback: Function): void;
/**
 * Unsubscribes a callback from a specific WebSocket event.
 * @param {string} eventName - The name of the event to unsubscribe from.
 * @param {Function} callback - The callback function to remove.
 */
export declare function off(eventName: string, callback: Function): void;
