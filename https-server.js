const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend', 'public');

// Self-signed certificate configuration
const options = {
  key: fs.readFileSync(path.join(ROOT_DIR, 'key.pem')),
  cert: fs.readFileSync(path.join(ROOT_DIR, 'cert.pem'))
};

function resolveFilePath(urlPath) {
  const cleanPath = (urlPath || '/').split('?')[0].split('#')[0];

  // Serve new marketing/login frontend by default
  if (cleanPath === '/' || cleanPath === '') {
    return path.join(FRONTEND_DIR, 'index.html');
  }

  // Legacy demo route
  if (cleanPath === '/demo' || cleanPath === '/demo.html') {
    return path.join(ROOT_DIR, 'index.html');
  }

  // Legacy static assets for old demo
  if (cleanPath === '/script.js' || cleanPath === '/styles.css') {
    return path.join(ROOT_DIR, cleanPath.substring(1));
  }

  // Serve everything else from frontend/public
  const normalizedPath = path.normalize(cleanPath).replace(/^(\.\.[/\\])+/, '');
  let relativePath = normalizedPath.replace(/^[/\\]+/, '');

  if (!path.extname(relativePath)) {
    relativePath = relativePath === '' ? 'index.html' : `${relativePath}.html`;
  }

  const candidatePath = path.join(FRONTEND_DIR, relativePath);

  if (!candidatePath.startsWith(FRONTEND_DIR)) {
    return null;
  }

  return candidatePath;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.js':
      return 'application/javascript';
    case '.css':
      return 'text/css';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    case '.webp':
      return 'image/webp';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    default:
      return 'text/html';
  }
}

const server = https.createServer(options, (req, res) => {
  const filePath = resolveFilePath(req.url);

  if (!filePath) {
    res.writeHead(404);
    res.end('File not found');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(data);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`HTTPS Server running on https://localhost:${PORT}`);
  console.log('Note: You will see a security warning. Click "Advanced" and "Proceed to localhost"');
});
