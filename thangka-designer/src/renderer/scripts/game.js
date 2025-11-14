/**
 * Thangka Canvas Game Logic
 * Initializes canvas, handles UI, integrates with multitouch manager
 */

// Global variables
let stage, layer, backgroundShape;
let multiTouchManager;
let history = [];
let historyStep = -1;
const MAX_HISTORY = 20;

// Configuration from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const selectedShape = urlParams.get('shape') || 'square';
const selectedColor = urlParams.get('color') || '#cbb483';

// Draggable item images (sample set - expand as needed)
const draggableItems = [
    'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=Lotus',
    'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=Buddha',
    'https://via.placeholder.com/150/45B7D1/FFFFFF?text=Mandala',
    'https://via.placeholder.com/150/FFA07A/FFFFFF?text=Dragon',
    'https://via.placeholder.com/150/98D8C8/FFFFFF?text=Wheel',
    'https://via.placeholder.com/150/F7DC6F/FFFFFF?text=Cloud',
    'https://via.placeholder.com/150/BB8FCE/FFFFFF?text=Bird',
    'https://via.placeholder.com/150/85C1E2/FFFFFF?text=Flower'
];

/**
 * Initialize application
 */
function init() {
    console.log('🎨 Initializing Canvas Application...');
    console.log('Shape:', selectedShape);
    console.log('Color:', selectedColor);

    // Setup canvas
    setupCanvas();

    // Load draggable items in side panel
    loadDraggableItems();

    // Initialize multitouch manager
    multiTouchManager = new MultiTouchManager(stage, layer);

    // Initial state save
    saveState();

    console.log('✅ Application initialized');
}

/**
 * Setup Konva canvas
 */
function setupCanvas() {
    const container = document.getElementById('container');
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    // Create stage
    stage = new Konva.Stage({
        container: 'container',
        width: width,
        height: height
    });

    // Create layer
    layer = new Konva.Layer();
    stage.add(layer);

    // Create background shape
    createBackgroundShape();

    // Handle window resize
    window.addEventListener('resize', () => {
        const newWidth = container.offsetWidth;
        const newHeight = container.offsetHeight;

        stage.width(newWidth);
        stage.height(newHeight);

        // Reposition background shape
        positionBackgroundShape();
        layer.batchDraw();
    });
}

/**
 * Create background shape based on selection
 */
function createBackgroundShape() {
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    const centerX = stageWidth / 2;
    const centerY = stageHeight / 2;

    const shapeSize = Math.min(stageWidth, stageHeight) * 0.7;

    switch (selectedShape) {
        case 'square':
            backgroundShape = new Konva.Rect({
                x: centerX - shapeSize / 2,
                y: centerY - shapeSize / 2,
                width: shapeSize,
                height: shapeSize,
                fill: selectedColor,
                stroke: '#D4AF37',
                strokeWidth: 5,
                shadowBlur: 20,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
                shadowOffset: { x: 0, y: 10 },
                name: 'background-shape'
            });
            break;

        case 'circle':
            backgroundShape = new Konva.Circle({
                x: centerX,
                y: centerY,
                radius: shapeSize / 2,
                fill: selectedColor,
                stroke: '#D4AF37',
                strokeWidth: 5,
                shadowBlur: 20,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
                shadowOffset: { x: 0, y: 10 },
                name: 'background-shape'
            });
            break;

        case 'rectangle-h':
            backgroundShape = new Konva.Rect({
                x: centerX - (shapeSize * 0.75),
                y: centerY - (shapeSize * 0.4),
                width: shapeSize * 1.5,
                height: shapeSize * 0.8,
                fill: selectedColor,
                stroke: '#D4AF37',
                strokeWidth: 5,
                shadowBlur: 20,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
                shadowOffset: { x: 0, y: 10 },
                name: 'background-shape'
            });
            break;

        case 'rectangle-v':
            backgroundShape = new Konva.Rect({
                x: centerX - (shapeSize * 0.4),
                y: centerY - (shapeSize * 0.75),
                width: shapeSize * 0.8,
                height: shapeSize * 1.5,
                fill: selectedColor,
                stroke: '#D4AF37',
                strokeWidth: 5,
                shadowBlur: 20,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
                shadowOffset: { x: 0, y: 10 },
                name: 'background-shape'
            });
            break;

        default:
            backgroundShape = new Konva.Rect({
                x: centerX - shapeSize / 2,
                y: centerY - shapeSize / 2,
                width: shapeSize,
                height: shapeSize,
                fill: selectedColor,
                stroke: '#D4AF37',
                strokeWidth: 5,
                name: 'background-shape'
            });
    }

    layer.add(backgroundShape);
    backgroundShape.moveToBottom();
    layer.batchDraw();
}

/**
 * Reposition background shape on resize
 */
function positionBackgroundShape() {
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    const centerX = stageWidth / 2;
    const centerY = stageHeight / 2;

    const shapeSize = Math.min(stageWidth, stageHeight) * 0.7;

    switch (selectedShape) {
        case 'square':
            backgroundShape.position({
                x: centerX - shapeSize / 2,
                y: centerY - shapeSize / 2
            });
            backgroundShape.size({ width: shapeSize, height: shapeSize });
            break;

        case 'circle':
            backgroundShape.position({ x: centerX, y: centerY });
            backgroundShape.radius(shapeSize / 2);
            break;

        case 'rectangle-h':
            backgroundShape.position({
                x: centerX - (shapeSize * 0.75),
                y: centerY - (shapeSize * 0.4)
            });
            backgroundShape.size({ width: shapeSize * 1.5, height: shapeSize * 0.8 });
            break;

        case 'rectangle-v':
            backgroundShape.position({
                x: centerX - (shapeSize * 0.4),
                y: centerY - (shapeSize * 0.75)
            });
            backgroundShape.size({ width: shapeSize * 0.8, height: shapeSize * 1.5 });
            break;
    }
}

/**
 * Load draggable items into side panel
 */
function loadDraggableItems() {
    const itemsContainer = document.getElementById('itemsContainer');
    itemsContainer.innerHTML = '';

    draggableItems.forEach((imageSrc, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.dataset.index = index;

        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = `Item ${index + 1}`;

        itemDiv.appendChild(img);
        itemsContainer.appendChild(itemDiv);
    });
}

/**
 * History Management
 */
function saveState() {
    const json = stage.toJSON();

    // Remove future history if we're in the middle
    if (historyStep < history.length - 1) {
        history = history.slice(0, historyStep + 1);
    }

    // Add new state
    history.push(json);

    // Limit history size
    if (history.length > MAX_HISTORY) {
        history.shift();
    } else {
        historyStep++;
    }

    updateUndoRedoButtons();
}

function undo() {
    if (historyStep > 0) {
        historyStep--;
        restoreState(history[historyStep]);
        updateUndoRedoButtons();
    }
}

function redo() {
    if (historyStep < history.length - 1) {
        historyStep++;
        restoreState(history[historyStep]);
        updateUndoRedoButtons();
    }
}

function restoreState(json) {
    const parsedStage = Konva.Node.create(json, 'container');
    stage.destroy();
    stage = parsedStage;
    layer = stage.find('Layer')[0];

    // Reinitialize multitouch manager
    if (multiTouchManager) {
        multiTouchManager.destroy();
    }
    multiTouchManager = new MultiTouchManager(stage, layer);

    updateObjectCount();
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    if (undoBtn) undoBtn.disabled = historyStep <= 0;
    if (redoBtn) redoBtn.disabled = historyStep >= history.length - 1;
}

/**
 * UI Functions
 */
function togglePanel() {
    const panel = document.getElementById('sidePanel');
    panel.classList.toggle('collapsed');
}

function goHome() {
    if (confirm('Return to home? Your design will be lost.')) {
        window.location.href = 'index.html';
    }
}

function clearCanvas() {
    if (confirm('Clear all objects from canvas?')) {
        // Remove all draggable images
        const images = layer.find('.draggable-image');
        images.forEach(img => img.destroy());
        layer.batchDraw();

        saveState();
        updateObjectCount();
    }
}

function updateObjectCount() {
    const objects = layer.find('.draggable-image');
    const countElement = document.getElementById('objectCount');
    if (countElement) {
        countElement.textContent = objects.length;
    }
}

/**
 * Share Functions
 */
function openShareModal() {
    const modal = document.getElementById('shareModal');
    const preview = document.getElementById('sharePreview');

    // Generate preview
    const dataURL = stage.toDataURL({ pixelRatio: 1.5 });
    preview.innerHTML = `<img src="${dataURL}" alt="Canvas Preview" style="max-width: 100%; border-radius: 10px;">`;

    modal.classList.remove('hidden');
}

function closeShareModal() {
    const modal = document.getElementById('shareModal');
    const whatsappForm = document.getElementById('whatsappForm');

    modal.classList.add('hidden');
    whatsappForm.classList.add('hidden');

    // Reset form
    document.getElementById('phoneInput').value = '';
    document.getElementById('phoneStatus').innerHTML = '';
    document.getElementById('sendWhatsAppBtn').disabled = true;
}

function shareWhatsApp() {
    const whatsappForm = document.getElementById('whatsappForm');
    whatsappForm.classList.remove('hidden');
}

async function validatePhone() {
    const phoneInput = document.getElementById('phoneInput');
    const phoneStatus = document.getElementById('phoneStatus');
    const sendBtn = document.getElementById('sendWhatsAppBtn');

    const phone = phoneInput.value.trim();

    if (!phone) {
        phoneStatus.innerHTML = 'Please enter a phone number';
        phoneStatus.className = 'phone-status invalid';
        return;
    }

    phoneStatus.innerHTML = 'Checking...';
    phoneStatus.className = 'phone-status';

    try {
        const response = await fetch('http://localhost:3000/api/whatsapp/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone })
        });

        const data = await response.json();

        if (data.success && data.exists) {
            phoneStatus.innerHTML = '✓ Valid WhatsApp number';
            phoneStatus.className = 'phone-status valid';
            sendBtn.disabled = false;
        } else {
            phoneStatus.innerHTML = '✗ Not a valid WhatsApp number';
            phoneStatus.className = 'phone-status invalid';
            sendBtn.disabled = true;
        }
    } catch (error) {
        console.error('Validation error:', error);
        phoneStatus.innerHTML = '✗ Error checking number';
        phoneStatus.className = 'phone-status invalid';
        sendBtn.disabled = true;
    }
}

async function sendWhatsApp() {
    const phoneInput = document.getElementById('phoneInput');
    const phone = phoneInput.value.trim();

    if (!phone) {
        alert('Please enter a phone number');
        return;
    }

    showLoading('Sending to WhatsApp...');

    try {
        const imageData = stage.toDataURL({ pixelRatio: 2 });

        const response = await fetch('http://localhost:3000/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: phone,
                imageData: imageData
            })
        });

        const data = await response.json();

        hideLoading();

        if (data.success) {
            alert('✅ Image sent successfully to WhatsApp!');
            closeShareModal();
        } else {
            alert('❌ Failed to send: ' + data.message);
        }
    } catch (error) {
        hideLoading();
        console.error('Send error:', error);
        alert('❌ Error sending image');
    }
}

async function shareFacebook() {
    showLoading('Preparing for Facebook...');

    try {
        const imageData = stage.toDataURL({ pixelRatio: 2 });

        if (window.electronAPI && window.electronAPI.openFacebookShare) {
            const result = await window.electronAPI.openFacebookShare(imageData);

            if (result.success) {
                // Facebook window opened
                hideLoading();
                closeShareModal();

                // Listen for completion
                if (window.electronAPI.onFacebookShareComplete) {
                    window.electronAPI.onFacebookShareComplete((data) => {
                        if (data.success) {
                            alert('✅ Posted to Facebook successfully!');
                        }
                    });
                }
            } else {
                hideLoading();
                alert('❌ Failed to open Facebook: ' + result.error);
            }
        } else {
            hideLoading();
            alert('Facebook sharing is only available in desktop app');
        }
    } catch (error) {
        hideLoading();
        console.error('Facebook share error:', error);
        alert('❌ Error sharing to Facebook');
    }
}

function downloadImage() {
    const dataURL = stage.toDataURL({ pixelRatio: 3 });

    const link = document.createElement('a');
    link.download = `thangka-design-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    alert('✅ Image downloaded successfully!');
}

/**
 * Loading Overlay
 */
function showLoading(text = 'Processing...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');

    loadingText.textContent = text;
    overlay.classList.remove('hidden');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('hidden');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (multiTouchManager) {
        multiTouchManager.destroy();
    }
});
