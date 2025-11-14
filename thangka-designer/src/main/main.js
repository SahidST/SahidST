const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

/**
 * Start Express server as a child process
 */
function startServer() {
    const serverPath = path.join(__dirname, '../server/server.js');

    console.log('🚀 Starting Express server...');

    serverProcess = spawn('node', [serverPath], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' }
    });

    serverProcess.on('error', (err) => {
        console.error('❌ Failed to start server:', err);
    });

    serverProcess.on('exit', (code) => {
        if (code !== 0) {
            console.error(`⚠️  Server process exited with code ${code}`);
        }
    });
}

/**
 * Create the main application window
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        fullscreen: true,
        frame: false,
        resizable: false,
        backgroundColor: '#1a1a1a',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
            webSecurity: true
        }
    });

    // Enable touch events
    app.commandLine.appendSwitch('touch-events', 'enabled');

    // Load splash screen
    const splashPath = path.join(__dirname, '../renderer/pages/splash.html');
    mainWindow.loadFile(splashPath);

    // Disable default menu
    mainWindow.setMenuBarVisibility(false);

    // Open DevTools in development mode
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }

    // Prevent window from closing accidentally
    mainWindow.on('close', (e) => {
        if (!app.isQuitting) {
            e.preventDefault();
            // Could add confirmation dialog here
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Disable right-click context menu
    mainWindow.webContents.on('context-menu', (e) => {
        e.preventDefault();
    });
}

/**
 * Register global keyboard shortcuts
 */
function registerShortcuts() {
    // Alt+F5: Reload page
    globalShortcut.register('Alt+F5', () => {
        if (mainWindow) {
            mainWindow.reload();
        }
    });

    // Alt+F12: Toggle DevTools
    globalShortcut.register('Alt+F12', () => {
        if (mainWindow) {
            mainWindow.webContents.toggleDevTools();
        }
    });

    // Ctrl+W: Navigate to QR code page
    globalShortcut.register('Ctrl+W', () => {
        if (mainWindow) {
            const qrPath = path.join(__dirname, '../renderer/pages/qr-code.html');
            mainWindow.loadFile(qrPath);
        }
    });

    // Ctrl+Q: Navigate to home page
    globalShortcut.register('Ctrl+Q', () => {
        if (mainWindow) {
            const homePath = path.join(__dirname, '../renderer/pages/index.html');
            mainWindow.loadFile(homePath);
        }
    });

    // F11: Toggle fullscreen
    globalShortcut.register('F11', () => {
        if (mainWindow) {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
    });

    // Alt+Q: Quit application (hidden exit for kiosk mode)
    globalShortcut.register('Alt+Shift+Q', () => {
        app.isQuitting = true;
        app.quit();
    });
}

/**
 * Application lifecycle events
 */
app.whenReady().then(() => {
    // Start Express server first
    startServer();

    // Wait for server to initialize before creating window
    setTimeout(() => {
        createWindow();
        registerShortcuts();
    }, 3000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    app.isQuitting = true;

    // Unregister all shortcuts
    globalShortcut.unregisterAll();

    // Kill server process
    if (serverProcess) {
        console.log('🛑 Stopping Express server...');
        serverProcess.kill();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// ═══════════════════════════════════════════════════════════
//  IPC HANDLERS
// ═══════════════════════════════════════════════════════════

/**
 * Navigate to a specific page
 */
ipcMain.handle('navigate-to', async (event, pageName) => {
    if (!mainWindow) return { success: false, error: 'Window not available' };

    try {
        const pagePath = path.join(__dirname, `../renderer/pages/${pageName}.html`);
        await mainWindow.loadFile(pagePath);
        return { success: true };
    } catch (error) {
        console.error('Navigation error:', error);
        return { success: false, error: error.message };
    }
});

/**
 * Open Facebook sharing window
 */
ipcMain.handle('open-facebook-share', async (event, imageDataUrl) => {
    try {
        const fbWindow = new BrowserWindow({
            width: 1000,
            height: 700,
            parent: mainWindow,
            modal: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                javascript: true
            }
        });

        // Load Facebook
        await fbWindow.loadURL('https://www.facebook.com/');

        // Monitor navigation for successful post
        fbWindow.webContents.on('did-navigate', async (e, url) => {
            console.log('Facebook navigation:', url);

            // Detect if user is on main feed (likely logged in)
            if (url === 'https://www.facebook.com/' && !url.includes('login')) {
                // User is logged in, can proceed with post
                console.log('Facebook logged in detected');
            }

            // Detect successful post (URL patterns vary)
            if (url.includes('/photo/') || url.includes('/posts/') || url.includes('story_fbid')) {
                console.log('✅ Facebook post detected');

                // Wait a moment, then logout
                setTimeout(async () => {
                    try {
                        await fbWindow.webContents.executeJavaScript(`
                            // Try to logout
                            const logoutLink = document.querySelector('a[href*="logout"]');
                            if (logoutLink) {
                                logoutLink.click();
                            }
                        `);

                        setTimeout(() => {
                            fbWindow.close();
                            if (mainWindow) {
                                mainWindow.webContents.send('facebook-share-complete', { success: true });
                            }
                        }, 2000);
                    } catch (err) {
                        console.error('Logout error:', err);
                        fbWindow.close();
                    }
                }, 3000);
            }
        });

        // Handle window close
        fbWindow.on('closed', () => {
            console.log('Facebook window closed');
        });

        return { success: true };

    } catch (error) {
        console.error('Facebook share error:', error);
        return { success: false, error: error.message };
    }
});

/**
 * Get application paths
 */
ipcMain.handle('get-paths', () => {
    return {
        userData: app.getPath('userData'),
        temp: app.getPath('temp'),
        app: app.getAppPath()
    };
});

/**
 * Exit fullscreen/kiosk mode (for maintenance)
 */
ipcMain.on('exit-kiosk', () => {
    if (mainWindow) {
        mainWindow.setFullScreen(false);
    }
});

/**
 * Restart application
 */
ipcMain.on('restart-app', () => {
    app.relaunch();
    app.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
