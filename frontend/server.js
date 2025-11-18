const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/exercises', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'exercises.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

app.get('/auth.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

app.get('/account', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

app.get('/account.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

app.get('/session', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'session.html'));
});

app.get('/session.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'session.html'));
});

// Serve the original PTPal Demo page (old frontend with camera)
app.get('/demo', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'index.html'));
});

app.get('/demo.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'index.html'));
});

// Serve old demo static files (script.js, styles.css)
app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'script.js'));
});

app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'styles.css'));
});

// Start server
app.listen(PORT, () => {
    console.log(`PT Pal Frontend server running on http://localhost:${PORT}`);
});


