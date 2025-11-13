console.log('═══════════════════════════════════════');
console.log('🚀 STARTING MINIMAL SERVER');
console.log('═══════════════════════════════════════');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Arch:', process.arch);
console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('PORT env var:', process.env.PORT);
console.log('');

console.log('Loading express...');
const express = require('express');
console.log('✅ Express loaded');

console.log('Loading path...');
const path = require('path');
console.log('✅ Path loaded');

console.log('Loading fs...');
const fs = require('fs');
console.log('✅ FS loaded');

const app = express();
const PORT = process.env.PORT || 10000;
console.log('Using PORT:', PORT);

console.log('');
console.log('Setting up middleware...');
app.use(express.json());
console.log('✅ JSON parser');

const frontendPath = path.join(__dirname, '../frontend');
console.log('Frontend path:', frontendPath);

// Check frontend directory
if (fs.existsSync(frontendPath)) {
    console.log('✅ Frontend directory EXISTS');
    const files = fs.readdirSync(frontendPath);
    console.log('Frontend files:', files.slice(0, 10).join(', '));

    // Check for index.html
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        console.log('✅ index.html EXISTS');
    } else {
        console.error('❌ index.html NOT FOUND');
    }
} else {
    console.error('❌ Frontend directory NOT FOUND:', frontendPath);
}

app.use(express.static(frontendPath));
console.log('✅ Static file middleware');

console.log('');
console.log('Setting up routes...');

// Health check for Render
app.get('/health', (req, res) => {
    console.log('Health check hit');
    res.json({ ok: true });
});

app.get('/api', (req, res) => {
    console.log('API route hit');
    res.json({ status: 'running', timestamp: new Date().toISOString() });
});

// Serve frontend
app.get('*', (req, res) => {
    console.log('Catch-all for:', req.url);
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        console.error('❌ index.html not found');
        res.status(404).send('Not found');
    }
});

console.log('✅ Routes configured');
console.log('');

// Error handlers
process.on('uncaughtException', (err) => {
    console.error('');
    console.error('❌❌❌ UNCAUGHT EXCEPTION ❌❌❌');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('');
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('');
    console.error('❌❌❌ UNHANDLED REJECTION ❌❌❌');
    console.error('Error:', err);
    console.error('');
    process.exit(1);
});

// Start server
console.log('═══════════════════════════════════════');
console.log('🔥 ATTEMPTING TO START SERVER');
console.log('Binding to: 0.0.0.0:' + PORT);
console.log('═══════════════════════════════════════');
console.log('');

try {
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('✅✅✅ SERVER IS RUNNING ✅✅✅');
        console.log('═══════════════════════════════════════');
        console.log('Port:', PORT);
        console.log('Host: 0.0.0.0');
        console.log('PID:', process.pid);
        console.log('═══════════════════════════════════════');
        console.log('');
    });

    server.on('error', (err) => {
        console.error('');
        console.error('❌❌❌ SERVER ERROR ❌❌❌');
        console.error('Code:', err.code);
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);
        console.error('');
        process.exit(1);
    });

    console.log('✅ Listen call completed');

} catch (err) {
    console.error('');
    console.error('❌❌❌ STARTUP FAILED ❌❌❌');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('');
    process.exit(1);
}
