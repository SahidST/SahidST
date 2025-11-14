/**
 * WhatsApp QR Code Authentication Page
 * Handles WebSocket connection and QR code display
 */

let ws = null;
let qrCountdown = 85;
let countdownInterval = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// DOM Elements
const qrLoading = document.getElementById('qrLoading');
const qrDisplay = document.getElementById('qrDisplay');
const qrError = document.getElementById('qrError');
const connectionStatus = document.getElementById('connectionStatus');
const instructions = document.getElementById('instructions');
const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');
const statusDot = statusBadge.querySelector('.status-dot');
const qrCanvas = document.getElementById('qrCanvas');
const phoneNumber = document.getElementById('phoneNumber');
const errorMessage = document.getElementById('errorMessage');
const countdownElement = document.getElementById('countdown');

/**
 * Initialize WebSocket connection
 */
function connectWebSocket() {
    try {
        ws = new WebSocket('ws://localhost:3000');

        ws.onopen = () => {
            console.log('✅ WebSocket connected');
            reconnectAttempts = 0;
            updateStatus('Waiting for QR code...', 'connecting');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 Received:', data.type);
                handleWebSocketMessage(data);
            } catch (err) {
                console.error('Failed to parse message:', err);
            }
        };

        ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            updateStatus('Connection error', 'error');
        };

        ws.onclose = () => {
            console.log('🔌 WebSocket closed');
            updateStatus('Disconnected', 'error');

            // Attempt reconnection
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                setTimeout(() => {
                    console.log(`🔄 Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
                    connectWebSocket();
                }, 3000);
            } else {
                showError('Failed to connect to server. Please restart the application.');
            }
        };

    } catch (error) {
        console.error('WebSocket connection error:', error);
        showError('Cannot connect to server.');
    }
}

/**
 * Handle incoming WebSocket messages
 */
function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'initializing':
            updateStatus('Initializing WhatsApp...', 'connecting');
            showLoading();
            break;

        case 'loading':
            updateStatus(`Loading: ${data.message} (${data.percent}%)`, 'connecting');
            break;

        case 'qr':
            updateStatus('Scan QR code', 'qr');
            displayQRCode(data.qr);
            startCountdown();
            break;

        case 'authenticated':
            updateStatus('Authenticating...', 'connecting');
            showLoading();
            break;

        case 'ready':
            updateStatus('Connected', 'connected');
            showConnected(data.phone);
            stopCountdown();
            break;

        case 'disconnected':
            updateStatus('Disconnected', 'error');
            showError('WhatsApp disconnected. Reconnecting...');
            setTimeout(() => {
                location.reload();
            }, 3000);
            break;

        case 'error':
            updateStatus('Error', 'error');
            showError(data.message || 'An error occurred');
            break;

        default:
            console.log('Unknown message type:', data.type);
    }
}

/**
 * Display QR code
 */
function displayQRCode(qrData) {
    hideAll();
    qrDisplay.classList.remove('hidden');
    instructions.classList.remove('hidden');

    // Generate QR code on canvas
    QRCode.toCanvas(qrCanvas, qrData, {
        width: 300,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    }, (error) => {
        if (error) {
            console.error('QR code generation error:', error);
            showError('Failed to generate QR code');
        }
    });
}

/**
 * Show loading state
 */
function showLoading() {
    hideAll();
    qrLoading.classList.remove('hidden');
}

/**
 * Show error message
 */
function showError(message) {
    hideAll();
    qrError.classList.remove('hidden');
    errorMessage.textContent = message;
}

/**
 * Show connected state
 */
function showConnected(phone) {
    hideAll();
    connectionStatus.classList.remove('hidden');
    phoneNumber.textContent = phone;
}

/**
 * Hide all sections
 */
function hideAll() {
    qrLoading.classList.add('hidden');
    qrDisplay.classList.add('hidden');
    qrError.classList.add('hidden');
    connectionStatus.classList.add('hidden');
    instructions.classList.add('hidden');
}

/**
 * Update status badge
 */
function updateStatus(text, status) {
    statusText.textContent = text;
    statusDot.className = 'status-dot';

    if (status === 'connected') {
        statusDot.classList.add('connected');
    } else if (status === 'error') {
        statusDot.classList.add('error');
    }
}

/**
 * Start QR code expiration countdown
 */
function startCountdown() {
    stopCountdown();
    qrCountdown = 85;
    countdownElement.textContent = qrCountdown;

    countdownInterval = setInterval(() => {
        qrCountdown--;
        countdownElement.textContent = qrCountdown;

        if (qrCountdown <= 0) {
            stopCountdown();
            showError('QR code expired. Refreshing...');
            setTimeout(() => {
                location.reload();
            }, 2000);
        }
    }, 1000);
}

/**
 * Stop countdown
 */
function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

/**
 * Retry connection
 */
window.retryConnection = function() {
    location.reload();
};

/**
 * Start application (navigate to index.html)
 */
window.startApp = function() {
    if (window.electronAPI && window.electronAPI.navigateTo) {
        window.electronAPI.navigateTo('index')
            .catch(err => {
                console.error('Navigation error:', err);
                window.location.href = 'index.html';
            });
    } else {
        window.location.href = 'index.html';
    }
};

/**
 * Logout from WhatsApp
 */
window.logout = async function() {
    const confirmLogout = confirm('Are you sure you want to disconnect WhatsApp?');
    if (!confirmLogout) return;

    try {
        updateStatus('Disconnecting...', 'connecting');

        const response = await fetch('http://localhost:3000/api/whatsapp/logout', {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            showLoading();
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            showError(data.message || 'Failed to logout');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showError('Failed to logout');
    }
};

// Initialize WebSocket on page load
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing QR code page...');
    showLoading();
    connectWebSocket();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopCountdown();
    if (ws) {
        ws.close();
    }
});
