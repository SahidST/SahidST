/**
 * Splash Screen Logic
 * Simulates loading and transitions to QR code page
 */

const loadingProgress = document.getElementById('loadingProgress');
const loadingText = document.getElementById('loadingText');
const loadingPercent = document.getElementById('loadingPercent');

const loadingSteps = [
    { percent: 20, text: 'Loading Assets...' },
    { percent: 40, text: 'Initializing Canvas Engine...' },
    { percent: 60, text: 'Connecting to Services...' },
    { percent: 80, text: 'Preparing Interface...' },
    { percent: 100, text: 'Ready!' }
];

let currentStep = 0;
let currentPercent = 0;

function updateProgress() {
    if (currentStep < loadingSteps.length) {
        const targetPercent = loadingSteps[currentStep].percent;
        const text = loadingSteps[currentStep].text;

        // Animate progress
        const interval = setInterval(() => {
            if (currentPercent >= targetPercent) {
                clearInterval(interval);
                loadingText.textContent = text;
                currentStep++;

                // Continue to next step after delay
                setTimeout(updateProgress, 400);
            } else {
                currentPercent += 2;
                loadingProgress.style.width = currentPercent + '%';
                loadingPercent.textContent = currentPercent + '%';
            }
        }, 30);
    } else {
        // Loading complete - navigate to QR code page
        setTimeout(() => {
            navigateToQRPage();
        }, 500);
    }
}

function navigateToQRPage() {
    // Use Electron API if available
    if (window.electronAPI && window.electronAPI.navigateTo) {
        window.electronAPI.navigateTo('qr-code')
            .catch(err => {
                console.error('Navigation error:', err);
                // Fallback
                window.location.href = 'qr-code.html';
            });
    } else {
        // Fallback for testing in browser
        window.location.href = 'qr-code.html';
    }
}

// Start loading animation
setTimeout(() => {
    updateProgress();
}, 500);
