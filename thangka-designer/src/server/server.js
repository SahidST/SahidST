const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ═══════════════════════════════════════════════════════════
//  MIDDLEWARE CONFIGURATION
// ═══════════════════════════════════════════════════════════
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../renderer')));

// CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// ═══════════════════════════════════════════════════════════
//  FILE UPLOAD CONFIGURATION
// ═══════════════════════════════════════════════════════════
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'thangka-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG and PNG allowed.'));
        }
    }
});

// ═══════════════════════════════════════════════════════════
//  WHATSAPP CLIENT INITIALIZATION
// ═══════════════════════════════════════════════════════════
const authPath = path.join(__dirname, '../../.wwebjs_auth');

const whatsappClient = new Client({
    authStrategy: new LocalAuth({
        clientId: 'thangka-designer',
        dataPath: authPath
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-features=IsolateOrigins,site-per-process'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

// WhatsApp state management
let whatsappState = {
    isReady: false,
    isInitializing: false,
    connectedPhone: null,
    qrCode: null,
    lastQrTime: null,
    error: null
};

// ═══════════════════════════════════════════════════════════
//  WHATSAPP EVENT HANDLERS
// ═══════════════════════════════════════════════════════════

whatsappClient.on('qr', (qr) => {
    console.log('📱 WhatsApp QR Code Generated');

    whatsappState.qrCode = qr;
    whatsappState.lastQrTime = Date.now();
    whatsappState.error = null;

    // Broadcast QR to all connected WebSocket clients
    broadcastToClients({ type: 'qr', qr: qr });
});

whatsappClient.on('loading_screen', (percent, message) => {
    console.log(`⏳ Loading WhatsApp: ${percent}% - ${message}`);
    broadcastToClients({ type: 'loading', percent: percent, message: message });
});

whatsappClient.on('authenticated', () => {
    console.log('🔐 WhatsApp Authenticated');
    broadcastToClients({ type: 'authenticated' });
});

whatsappClient.on('ready', async () => {
    console.log('✅ WhatsApp Client Ready');

    whatsappState.isReady = true;
    whatsappState.isInitializing = false;
    whatsappState.qrCode = null;

    try {
        const info = whatsappClient.info;
        whatsappState.connectedPhone = info.wid.user;

        console.log(`📞 Connected as: +${whatsappState.connectedPhone}`);

        broadcastToClients({
            type: 'ready',
            phone: `+${whatsappState.connectedPhone}`
        });
    } catch (err) {
        console.error('Error getting phone number:', err);
    }
});

whatsappClient.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp Authentication Failed:', msg);

    whatsappState.isReady = false;
    whatsappState.error = 'Authentication failed';

    broadcastToClients({
        type: 'error',
        message: 'Authentication failed. Please try again.'
    });
});

whatsappClient.on('disconnected', (reason) => {
    console.log('🔌 WhatsApp Disconnected:', reason);

    whatsappState.isReady = false;
    whatsappState.connectedPhone = null;
    whatsappState.qrCode = null;

    broadcastToClients({
        type: 'disconnected',
        reason: reason
    });

    // Auto-reconnect after 5 seconds if not manual disconnect
    if (reason !== 'LOGOUT' && reason !== 'NAVIGATION') {
        setTimeout(() => {
            console.log('🔄 Attempting to reconnect WhatsApp...');
            initializeWhatsApp();
        }, 5000);
    }
});

whatsappClient.on('message', async (msg) => {
    // Log incoming messages (optional - for debugging)
    console.log(`📨 Message from ${msg.from}: ${msg.body.substring(0, 50)}...`);
});

// ═══════════════════════════════════════════════════════════
//  WHATSAPP INITIALIZATION
// ═══════════════════════════════════════════════════════════

function initializeWhatsApp() {
    if (whatsappState.isInitializing || whatsappState.isReady) {
        console.log('⚠️  WhatsApp already initializing or ready');
        return;
    }

    whatsappState.isInitializing = true;
    console.log('🚀 Initializing WhatsApp Client...');

    whatsappClient.initialize().catch(err => {
        console.error('Failed to initialize WhatsApp:', err);
        whatsappState.isInitializing = false;
        whatsappState.error = err.message;
    });
}

// Start WhatsApp client
initializeWhatsApp();

// ═══════════════════════════════════════════════════════════
//  WEBSOCKET HANDLER
// ═══════════════════════════════════════════════════════════

function broadcastToClients(data) {
    const message = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

wss.on('connection', (ws) => {
    console.log('🔗 WebSocket client connected');

    // Send current state immediately
    if (whatsappState.isReady && whatsappState.connectedPhone) {
        ws.send(JSON.stringify({
            type: 'ready',
            phone: `+${whatsappState.connectedPhone}`
        }));
    } else if (whatsappState.qrCode) {
        ws.send(JSON.stringify({
            type: 'qr',
            qr: whatsappState.qrCode
        }));
    } else if (whatsappState.error) {
        ws.send(JSON.stringify({
            type: 'error',
            message: whatsappState.error
        }));
    } else {
        ws.send(JSON.stringify({
            type: 'initializing'
        }));
    }

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received WebSocket message:', data);

            // Handle client commands
            if (data.command === 'getStatus') {
                ws.send(JSON.stringify({
                    type: 'status',
                    isReady: whatsappState.isReady,
                    phone: whatsappState.connectedPhone ? `+${whatsappState.connectedPhone}` : null
                }));
            }
        } catch (err) {
            console.error('WebSocket message error:', err);
        }
    });

    ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// ═══════════════════════════════════════════════════════════
//  REST API ENDPOINTS
// ═══════════════════════════════════════════════════════════

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        whatsapp: {
            ready: whatsappState.isReady,
            phone: whatsappState.connectedPhone ? `+${whatsappState.connectedPhone}` : null
        }
    });
});

// Get WhatsApp status
app.get('/api/whatsapp/status', (req, res) => {
    res.json({
        connected: whatsappState.isReady,
        phone: whatsappState.connectedPhone ? `+${whatsappState.connectedPhone}` : null,
        error: whatsappState.error
    });
});

// Check if a phone number is registered on WhatsApp
app.post('/api/whatsapp/check', async (req, res) => {
    try {
        if (!whatsappState.isReady) {
            return res.status(503).json({
                success: false,
                message: 'WhatsApp is not connected'
            });
        }

        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Format phone number
        const cleanPhone = phone.replace(/\D/g, '');

        // Validate length
        if (cleanPhone.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number'
            });
        }

        // Format for WhatsApp
        const whatsappNumber = `${cleanPhone}@c.us`;

        // Check if registered
        const isRegistered = await whatsappClient.isRegisteredUser(whatsappNumber);

        res.json({
            success: true,
            exists: isRegistered,
            formattedNumber: cleanPhone
        });

    } catch (error) {
        console.error('WhatsApp check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check number: ' + error.message
        });
    }
});

// Send image via WhatsApp
app.post('/api/whatsapp/send', async (req, res) => {
    try {
        if (!whatsappState.isReady) {
            return res.status(503).json({
                success: false,
                message: 'WhatsApp is not connected'
            });
        }

        const { phone, imageData } = req.body;

        if (!phone || !imageData) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and image data are required'
            });
        }

        // Format phone number
        const cleanPhone = phone.replace(/\D/g, '');
        const whatsappNumber = `${cleanPhone}@c.us`;

        // Convert base64 to buffer
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Save temporarily
        const tempPath = path.join(uploadDir, `temp-${Date.now()}.png`);
        fs.writeFileSync(tempPath, buffer);

        // Add watermark
        const watermarkedPath = await addWatermark(tempPath);

        // Create MessageMedia object
        const media = MessageMedia.fromFilePath(watermarkedPath);

        // Send message
        await whatsappClient.sendMessage(whatsappNumber, media, {
            caption: '🎨 My Thangka Design\nCreated at Interactive Thangka Designer\n\n#ThangkaArt #DigitalArt #IKnowHow'
        });

        // Clean up
        fs.unlinkSync(tempPath);
        fs.unlinkSync(watermarkedPath);

        console.log(`✅ Image sent to ${cleanPhone}`);

        res.json({
            success: true,
            message: 'Image sent successfully!'
        });

    } catch (error) {
        console.error('WhatsApp send error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send image: ' + error.message
        });
    }
});

// Logout from WhatsApp
app.post('/api/whatsapp/logout', async (req, res) => {
    try {
        if (whatsappState.isReady) {
            await whatsappClient.logout();
            whatsappState.isReady = false;
            whatsappState.connectedPhone = null;

            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } else {
            res.json({
                success: false,
                message: 'Not connected'
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Facebook image preparation
app.post('/api/facebook/prepare', async (req, res) => {
    try {
        const { imageData } = req.body;

        if (!imageData) {
            return res.status(400).json({
                success: false,
                message: 'Image data is required'
            });
        }

        // Convert base64 to buffer
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Save temporarily
        const tempPath = path.join(uploadDir, `fb-temp-${Date.now()}.png`);
        fs.writeFileSync(tempPath, buffer);

        // Add watermark
        const watermarkedPath = await addWatermark(tempPath);

        // Clean up temp file
        fs.unlinkSync(tempPath);

        res.json({
            success: true,
            imagePath: watermarkedPath,
            message: 'Image prepared for Facebook sharing'
        });

    } catch (error) {
        console.error('Facebook prepare error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to prepare image: ' + error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════
//  IMAGE PROCESSING - Watermark
// ═══════════════════════════════════════════════════════════

// Try to load canvas, but make it optional
let canvasModule = null;
try {
    canvasModule = require('canvas');
    console.log('✅ Canvas module loaded - watermarking enabled');
} catch (err) {
    console.warn('⚠️  Canvas module not available - watermarking disabled');
    console.warn('   Images will be sent without watermark');
    console.warn('   To enable: install system dependencies and run: npm install canvas');
}

async function addWatermark(imagePath) {
    // If canvas is not available, return original image path
    if (!canvasModule) {
        console.warn('Skipping watermark - canvas not available');
        return imagePath;
    }

    try {
        const { createCanvas, loadImage } = canvasModule;

        const image = await loadImage(imagePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        // Draw original image
        ctx.drawImage(image, 0, 0);

        // Configure watermark style
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 3;

        const text = 'IKnowHow';
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;

        // Position watermark at bottom right
        const x = image.width - textWidth - 30;
        const y = image.height - 40;

        // Draw text with outline
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);

        // Add secondary text (optional)
        ctx.font = 'normal 20px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;

        const subText = 'Thangka Designer';
        const subTextMetrics = ctx.measureText(subText);
        const subX = image.width - subTextMetrics.width - 30;
        const subY = image.height - 10;

        ctx.strokeText(subText, subX, subY);
        ctx.fillText(subText, subX, subY);

        // Save watermarked image
        const outputPath = imagePath.replace(/(\.\w+)$/, '-watermarked$1');
        const buffer = canvas.toBuffer('image/png', { compressionLevel: 6 });
        fs.writeFileSync(outputPath, buffer);

        return outputPath;
    } catch (error) {
        console.error('Watermark error:', error);
        // If watermarking fails, return original image
        console.warn('Falling back to original image without watermark');
        return imagePath;
    }
}

// ═══════════════════════════════════════════════════════════
//  START SERVER
// ═══════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log(`🚀 Thangka Designer Server running on port ${PORT}`);
    console.log(`📱 WhatsApp status: ${whatsappState.isReady ? 'Connected' : 'Initializing...'}`);
    console.log('═══════════════════════════════════════════════════════');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');

    try {
        if (whatsappState.isReady) {
            await whatsappClient.destroy();
        }
    } catch (err) {
        console.error('Error destroying WhatsApp client:', err);
    }

    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
        console.error('⚠️  Forced shutdown');
        process.exit(1);
    }, 10000);
});

process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received');
    process.emit('SIGINT');
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
