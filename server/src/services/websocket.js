const setupWebSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('subscribe', (data) => {
      console.log('Client subscribed:', data);
      // TODO: Store subscription
    });

    socket.on('unsubscribe', (data) => {
      console.log('Client unsubscribed:', data);
      // TODO: Remove subscription
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};

module.exports = {
  setupWebSocket
};
