'use strict';

// packages/client/src/index.ts
// Internal state and variables
let ws = null;
let currentUrl;
let pingInterval; // Use NodeJS.Timeout for clarity with setInterval
const eventListeners = {}; // Simple custom event system
// --- Internal Helper Functions ---
function _dispatchEvent(eventName, detail) {
    if (eventListeners[eventName]) {
        eventListeners[eventName].forEach(callback => callback(detail));
    }
}
function _handleIncomingMessage(message) {
    try {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.type === 'pong') {
            const latency = Date.now() - (parsedMessage.originalTimestamp || 0);
            _dispatchEvent('pong', { latency, ...parsedMessage });
        }
        else {
            _dispatchEvent('message', parsedMessage); // Generic message event
            _dispatchEvent(parsedMessage.type, parsedMessage); // Specific type event
        }
    }
    catch (e) {
        console.error("WebSocketClient: Failed to parse incoming message:", message, e);
        _dispatchEvent('error', new Error(`Failed to parse message: ${message}`));
    }
}
function _sendRaw(message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
    }
    else {
        console.warn("WebSocketClient: WebSocket not open, cannot send raw message.");
        _dispatchEvent('error', new Error('WebSocket not open'));
    }
}
function _sendPing() {
    _sendRaw(JSON.stringify({ type: "ping", timestamp: Date.now() }));
}
function _startPingInterval() {
    if (pingInterval)
        clearInterval(pingInterval);
    pingInterval = setInterval(_sendPing, 5000); // Ping every 5 seconds
}
function _stopPingInterval() {
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = 0;
    }
}
function _reconnect() {
    if (currentUrl) {
        console.log(`WebSocketClient: Attempting to reconnect to ${currentUrl}...`);
        _dispatchEvent('reconnecting', { url: currentUrl });
        setTimeout(() => connect(currentUrl), 3000); // Try again in 3 seconds
    }
}
// --- Public API Functions ---
/**
 * Connects to the WebSocket server.
 * @param {string} url - The WebSocket server URL (ws:// or wss://)
 */
function connect(url) {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        console.log("WebSocketClient: WebSocket already connected or connecting.");
        return;
    }
    currentUrl = url;
    ws = new WebSocket(url);
    ws.onopen = () => {
        console.log("WebSocketClient: Connection opened.");
        _startPingInterval();
        _dispatchEvent('connected', { url });
    };
    ws.onmessage = (event) => {
        _handleIncomingMessage(event.data.toString());
    };
    ws.onclose = (event) => {
        console.log("WebSocketClient: Connection closed.", event);
        _stopPingInterval();
        _dispatchEvent('disconnected', { code: event.code, reason: event.reason });
        _reconnect();
    };
    ws.onerror = (event) => {
        console.error("WebSocketClient: Error:", event);
        _dispatchEvent('error', event);
        if (ws && ws.readyState === WebSocket.CLOSED) {
            _reconnect(); // Attempt reconnect on error if already closed
        }
    };
}
/**
 * Sends a structured message to the WebSocket server.
 * Messages are automatically JSON.stringify'd.
 * @param {WebSocketMessage} messageData - The data object to send. Must have a 'type' property.
 */
function send(messageData) {
    if (typeof messageData !== 'object' || messageData === null || typeof messageData.type === 'undefined') {
        console.error("WebSocketClient: Message must be an object with a 'type' property.");
        _dispatchEvent('error', new Error('Invalid message format for send'));
        return;
    }
    _sendRaw(JSON.stringify(messageData));
}
/**
 * Disconnects from the WebSocket server.
 */
function disconnect() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Client explicitly disconnected');
        console.log('WebSocketClient: Explicitly closing connection.');
        _stopPingInterval();
        ws = null;
        currentUrl = "";
        _dispatchEvent('disconnected', { code: 1000, reason: 'Explicitly disconnected' });
    }
    else {
        console.warn("WebSocketClient: WebSocket is not open to disconnect.");
    }
}
/**
 * Checks if the WebSocket is currently connected.
 * @returns {boolean} True if connected, false otherwise.
 */
function isConnected() {
    return ws !== null && ws.readyState === WebSocket.OPEN;
}
/**
 * Subscribes a callback to a specific WebSocket event.
 * Events: 'connected', 'disconnected', 'reconnecting', 'error', 'message', 'pong',
 * and any custom message.type from the server (e.g., 'chatMessage').
 * @param {string} eventName - The name of the event to subscribe to.
 * @param {Function} callback - The callback function to execute when the event fires.
 */
function on(eventName, callback) {
    if (!eventListeners[eventName]) {
        eventListeners[eventName] = [];
    }
    eventListeners[eventName].push(callback);
}
/**
 * Unsubscribes a callback from a specific WebSocket event.
 * @param {string} eventName - The name of the event to unsubscribe from.
 * @param {Function} callback - The callback function to remove.
 */
function off(eventName, callback) {
    if (eventListeners[eventName]) {
        eventListeners[eventName] = eventListeners[eventName].filter(cb => cb !== callback);
    }
}

exports.connect = connect;
exports.disconnect = disconnect;
exports.isConnected = isConnected;
exports.off = off;
exports.on = on;
exports.send = send;
//# sourceMappingURL=index.js.map
