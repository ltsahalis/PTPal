const https = require('https');
const fs = require('fs');
const path = require('path');

// Self-signed certificate configuration
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const server = https.createServer(options, (req, res) => {
  // Remove leading slash from URL path
  let filePath = req.url.substring(1);
  
  // If no path is specified, serve index.html
  if (filePath === '' || filePath === '/') {
    filePath = 'index.html';
  }
  
  // Read file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    // Set appropriate Content-Type based on file extension
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (ext) {
      case '.js':
        contentType = 'application/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`HTTPS Server running on https://localhost:${PORT}`);
  console.log('Note: You will see a security warning. Click "Advanced" and "Proceed to localhost"');
});

