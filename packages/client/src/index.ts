
export interface WebSocketMessage {
    type: string;
    timestamp?: number;
    originalTimestamp?: number;
    content?: string;
    user?: string;
    [key: string]: any; 
}


let ws: WebSocket | null = null;
let currentUrl: string | null = null;
let pingInterval: number | null = null; 
const eventListeners: { [key: string]: Function[] } = {}; 

function _dispatchEvent(eventName: string, detail?: any): void {
    if (eventListeners[eventName]) {
        eventListeners[eventName].forEach(callback => callback(detail));
    }
}

function _handleIncomingMessage(message: string): void {
    try {
        const parsedMessage: WebSocketMessage = JSON.parse(message);
        if (parsedMessage.type === 'pong') {
            const latency = Date.now() - (parsedMessage.originalTimestamp || 0);
            _dispatchEvent('pong', { latency, ...parsedMessage });
        } else {
            _dispatchEvent('message', parsedMessage); 
            _dispatchEvent(parsedMessage.type, parsedMessage); 
        }
    } catch (e) {
        console.error("WebSocketClient: Failed to parse incoming message:", message, e);
        _dispatchEvent('error', new Error(`Failed to parse message: ${message}`));
    }
}

function _sendRaw(message: string): void {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
    } else {
        console.warn("WebSocketClient: WebSocket not open, cannot send raw message.");
        _dispatchEvent('error', new Error('WebSocket not open'));
    }
}

function _sendPing(): void {
    _sendRaw(JSON.stringify({ type: "ping", timestamp: Date.now() }));
}

function _startPingInterval(): void {
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = setInterval(_sendPing, 5000);
}

function _stopPingInterval(): void {
    if (pingInterval !== null) {
        clearInterval(pingInterval);
        pingInterval = null;
    }
}

function _reconnect(): void {
    if (currentUrl) {
        console.log(`WebSocketClient: Attempting to reconnect to ${currentUrl}...`);
        _dispatchEvent('reconnecting', { url: currentUrl });
        setTimeout(() => connect(currentUrl as string), 3000); 
    }
}


/**
 * Connects to the WebSocket server.
 * @param {string} url 
 */

export function connect(url: string): void {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        console.log("WebSocketClient: WebSocket already connected or connecting.");
        return;
    }

    currentUrl = url;
    ws = new WebSocket(url);

    ws.onopen = () => {
        console.log("WebSocketClient: Connection opened");
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
            _reconnect(); 
        }
    };
}

/**
 * Sends a structured message to the WebSocket server.
 * Messages are automatically JSON.stringify'd.
 * @param {WebSocketMessage} messageData
 */

export function send(messageData: WebSocketMessage): void {
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

export function disconnect(): void {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Client explicitly disconnected');
        console.log('WebSocketClient: Explicitly closing connection.');
        _stopPingInterval();
        ws = null;
        currentUrl = null;
        _dispatchEvent('disconnected', { code: 1000, reason: 'Explicitly disconnected' });
    } else {
        console.warn("WebSocketClient: WebSocket is not open to disconnect.");
    }
}

/**
 * Checks if the WebSocket is currently connected.
 * @returns {boolean} True if connected, false otherwise.
 */

export function isConnected(): boolean {
    return ws !== null && ws.readyState === WebSocket.OPEN;
}

/**
 * Subscribes a callback to a specific WebSocket event.
 * @param {string} eventName 
 * @param {Function} callback 
 */
export function on(eventName: string, callback: Function): void {
    if (!eventListeners[eventName]) {
        eventListeners[eventName] = [];
    }
    eventListeners[eventName].push(callback);
}

/**
 * @param {string} eventName 
 * @param {Function} callback 
 */

export function off(eventName: string, callback: Function): void {
    if (eventListeners[eventName]) {
        eventListeners[eventName] = eventListeners[eventName].filter(cb => cb !== callback);
    }
}