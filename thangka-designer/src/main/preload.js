const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose safe IPC methods to renderer process
 * This creates a secure bridge between main and renderer processes
 */
contextBridge.exposeInMainWorld('electronAPI', {
    /**
     * Navigate to a different page
     * @param {string} pageName - Name of the page (without .html)
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    navigateTo: (pageName) => ipcRenderer.invoke('navigate-to', pageName),

    /**
     * Open Facebook sharing window
     * @param {string} imageDataUrl - Base64 data URL of the image
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    openFacebookShare: (imageDataUrl) => ipcRenderer.invoke('open-facebook-share', imageDataUrl),

    /**
     * Get application paths
     * @returns {Promise<{userData: string, temp: string, app: string}>}
     */
    getPaths: () => ipcRenderer.invoke('get-paths'),

    /**
     * Exit kiosk mode (for maintenance)
     */
    exitKiosk: () => ipcRenderer.send('exit-kiosk'),

    /**
     * Restart the application
     */
    restartApp: () => ipcRenderer.send('restart-app'),

    /**
     * Listen for Facebook share completion
     * @param {function} callback - Called when sharing is complete
     */
    onFacebookShareComplete: (callback) => {
        ipcRenderer.on('facebook-share-complete', (event, data) => callback(data));
    }
});

// Log that preload script has loaded
console.log('🔐 Preload script loaded - Electron API exposed');
