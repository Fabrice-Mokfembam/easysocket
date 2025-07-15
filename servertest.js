
async function startApplication() {
  
    const { default: MyWebSocketServer } = await import('./packages/server/dist/index.js');

    const WS_PORT =  8080;
    const WS_PATH = process.env.WS_PATH || '/websocket';

    const server = new MyWebSocketServer(WS_PORT, WS_PATH);

    server.start()
        .then(() => {
            console.log(`Server is running at port ${WS_PORT} with path ${WS_PATH}.`);
        
        })
        .catch(err => {
            console.error('Failed to start server:', err);
            process.exit(1);
        });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('Received SIGINT. Shutting down server...');
        await server.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM. Shutting down server...');
        await server.stop();
        process.exit(0);
    });
}

startApplication();