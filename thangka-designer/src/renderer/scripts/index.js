/**
 * Shape and Color Selection Page
 * Handles user input for canvas configuration
 */

let selectedShape = null;
let selectedColor = null;

// Color palettes for each shape
const colorPalettes = {
    'square': [
        { name: 'Golden Silk', color: '#cbb483' },
        { name: 'Deep Blue', color: '#2b4874' },
        { name: 'Crimson', color: '#913335' },
        { name: 'Emerald', color: '#2d7a5c' }
    ],
    'circle': [
        { name: 'Turquoise', color: '#40E0D0' },
        { name: 'Royal Purple', color: '#7851A9' },
        { name: 'Coral', color: '#FF7F50' },
        { name: 'Mint', color: '#98FF98' }
    ],
    'rectangle-h': [
        { name: 'Sunset Orange', color: '#FF6B35' },
        { name: 'Ocean Blue', color: '#004E89' },
        { name: 'Forest Green', color: '#355E3B' },
        { name: 'Rose Gold', color: '#B76E79' }
    ],
    'rectangle-v': [
        { name: 'Lavender', color: '#B57EDC' },
        { name: 'Navy', color: '#1F2937' },
        { name: 'Burgundy', color: '#800020' },
        { name: 'Sage', color: '#87AE73' }
    ]
};

// DOM Elements
const shapeCards = document.querySelectorAll('.shape-card');
const colorSection = document.getElementById('colorSection');
const colorGrid = document.getElementById('colorGrid');
const startButtonContainer = document.getElementById('startButtonContainer');
const startButton = document.getElementById('startButton');

/**
 * Initialize event listeners
 */
function init() {
    // Shape selection
    shapeCards.forEach(card => {
        card.addEventListener('click', () => {
            selectShape(card);
        });
    });

    // Start button
    startButton.addEventListener('click', startDesigning);

    // Check if returning from game page with existing selection
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('shape') && urlParams.has('color')) {
        const shape = urlParams.get('shape');
        const color = decodeURIComponent(urlParams.get('color'));

        // Pre-select
        const shapeCard = document.querySelector(`[data-shape="${shape}"]`);
        if (shapeCard) {
            selectShape(shapeCard, false);
            selectedColor = color;
            renderColorOptions(shape);

            // Pre-select color
            setTimeout(() => {
                const colorOption = Array.from(document.querySelectorAll('.color-option'))
                    .find(opt => opt.dataset.color === color);
                if (colorOption) {
                    colorOption.classList.add('selected');
                    showStartButton();
                }
            }, 100);
        }
    }
}

/**
 * Handle shape selection
 */
function selectShape(card, animate = true) {
    // Remove previous selection
    shapeCards.forEach(c => c.classList.remove('selected'));

    // Select current
    card.classList.add('selected');
    selectedShape = card.dataset.shape;
    selectedColor = null; // Reset color selection

    // Show color section
    renderColorOptions(selectedShape);

    if (animate) {
        colorSection.classList.add('hidden');
        setTimeout(() => {
            colorSection.classList.remove('hidden');
        }, 100);
    }

    // Hide start button until color is selected
    startButtonContainer.classList.add('hidden');
}

/**
 * Render color options based on selected shape
 */
function renderColorOptions(shape) {
    const colors = colorPalettes[shape];

    colorGrid.innerHTML = '';

    colors.forEach(({ name, color }) => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.background = color;
        colorOption.dataset.color = color;

        const colorName = document.createElement('span');
        colorName.className = 'color-name';
        colorName.textContent = name;
        colorOption.appendChild(colorName);

        colorOption.addEventListener('click', () => {
            selectColor(colorOption);
        });

        colorGrid.appendChild(colorOption);
    });

    colorSection.classList.remove('hidden');
}

/**
 * Handle color selection
 */
function selectColor(colorOption) {
    // Remove previous selection
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
    });

    // Select current
    colorOption.classList.add('selected');
    selectedColor = colorOption.dataset.color;

    // Show start button
    showStartButton();
}

/**
 * Show start button with animation
 */
function showStartButton() {
    startButtonContainer.classList.remove('hidden');
}

/**
 * Navigate to canvas page
 */
function startDesigning() {
    if (!selectedShape || !selectedColor) {
        alert('Please select both a shape and a color');
        return;
    }

    // Navigate to game.html with parameters
    const url = `game.html?shape=${selectedShape}&color=${encodeURIComponent(selectedColor)}`;

    if (window.electronAPI && window.electronAPI.navigateTo) {
        // Using Electron navigation is tricky with params, use standard navigation
        window.location.href = url;
    } else {
        window.location.href = url;
    }
}

/**
 * Go back to QR code page
 */
window.goBack = function() {
    if (window.electronAPI && window.electronAPI.navigateTo) {
        window.electronAPI.navigateTo('qr-code')
            .catch(err => {
                console.error('Navigation error:', err);
                window.location.href = 'qr-code.html';
            });
    } else {
        window.location.href = 'qr-code.html';
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', init);
