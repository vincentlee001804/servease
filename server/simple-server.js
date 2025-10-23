console.log('Starting simple server...');

const express = require('express');
console.log('Express loaded');

const app = express();
console.log('Express app created');

const PORT = 8000;
console.log('Port set to:', PORT);

app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'OK', message: 'Simple server is running!' });
});

console.log('About to start server on port', PORT);
app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/health`);
});
