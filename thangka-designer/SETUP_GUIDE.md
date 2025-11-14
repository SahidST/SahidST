# Thangka Designer - Complete Setup Guide

This guide will walk you through setting up the Thangka Designer application from scratch, whether you're a developer or an end user.

## Table of Contents
- [For End Users](#for-end-users)
- [For Developers](#for-developers)
- [Common Issues](#common-issues)
- [Advanced Configuration](#advanced-configuration)

---

## For End Users

### Prerequisites
- Windows 10 or Windows 11 (64-bit)
- Administrator access for installation
- Internet connection
- WhatsApp account (for sharing features)

### Installation Steps

1. **Download the Installer**
   - Download `Thangka Designer Setup.exe` from the releases page
   - File size: ~200MB (includes all dependencies)

2. **Run the Installer**
   - Double-click the installer file
   - Windows SmartScreen may show a warning (click "More info" → "Run anyway")
   - Choose installation location (default: `C:\Program Files\Thangka Designer`)
   - Select "Create Desktop Shortcut" if desired
   - Click "Install"

3. **First Launch**
   - Launch from Desktop shortcut or Start Menu
   - Application will show splash screen for 2-3 seconds
   - **WhatsApp Setup** (first time only):
     - QR code will appear after initialization (10-15 seconds)
     - Open WhatsApp on your phone
     - Go to: Menu → Linked Devices → Link a Device
     - Scan the QR code displayed on screen
     - Wait for "Connected as +[your number]" message
     - Click "Start Application"

4. **Using the Application**
   - Select canvas shape (Square/Circle/Rectangle)
   - Choose color palette
   - Click "Start Designing"
   - Drag items from side panel to canvas
   - Use touch or mouse to manipulate objects
   - Click "Share" when done to export your design

### System Configuration for Touch Screens

**Windows 10/11 Touch Settings**:
1. Open Settings → Devices → Touchscreen
2. Ensure touch screen is enabled
3. Calibrate if needed: Settings → System → Display → Advanced display settings → Calibration

**Display Settings**:
- Recommended resolution: 1920x1080 or higher
- Scale: 100% (no DPI scaling for best performance)
- Orientation: Landscape

---

## For Developers

### Prerequisites
- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v8.0.0 or higher (comes with Node.js)
- **Git**: For version control ([Download](https://git-scm.com/))
- **Code Editor**: VS Code recommended ([Download](https://code.visualstudio.com/))
- **Windows Build Tools**: `npm install -g windows-build-tools` (if on Windows)

### Development Setup

1. **Clone Repository**
```bash
git clone https://github.com/yourusername/thangka-designer.git
cd thangka-designer
```

2. **Install Dependencies**
```bash
npm install
```

This will install:
- Electron (desktop framework)
- Express (web server)
- whatsapp-web.js (WhatsApp integration)
- Konva.js (canvas library)
- All other required packages

**Note**: First install may take 5-10 minutes as it downloads Chromium for Puppeteer/WhatsApp.

3. **Verify Installation**
```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show v8.x.x or higher
```

4. **Start Development Server**
```bash
npm run dev
```

This will:
- Start Express server on port 3000
- Launch Electron window in dev mode
- Enable DevTools
- Enable hot reload (restart app to see changes)

5. **Project Structure**
```
thangka-designer/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # Frontend (HTML/CSS/JS)
│   └── server/         # Express backend
├── scripts/            # Utility scripts
├── build/              # Build resources (icons, etc.)
└── package.json        # Dependencies & scripts
```

### Development Workflow

**Making Changes**:
1. Edit files in `src/` directory
2. Restart application to see changes (Alt+F5 in app)
3. Check console for errors (Alt+F12 to toggle DevTools)

**Testing**:
```bash
# Test in dev mode
npm run dev

# Test production build
npm run build
# Run installer from dist/ folder
```

**Debugging**:
- **Main Process**: Check terminal output
- **Renderer Process**: Open DevTools (Alt+F12)
- **Server**: Check server logs in terminal

### Building for Production

1. **Prepare Build**
```bash
# Ensure all changes are committed
git status

# Update version in package.json
# Edit: "version": "1.0.0" → "1.0.1"
```

2. **Build Windows Installer**
```bash
npm run build
```

This will:
- Bundle application with dependencies
- Create installer in `dist/` folder
- Output: `Thangka Designer Setup 1.0.0.exe`

Build takes 5-10 minutes on first run.

3. **Test the Installer**
- Uninstall any previous version
- Run the installer from `dist/` folder
- Test all features:
  - WhatsApp QR code
  - Canvas manipulation
  - Share features
  - Undo/Redo
  - Save/Load

### Customization Guide

**1. Adding New Draggable Items**

Edit `src/renderer/scripts/game.js`:
```javascript
const draggableItems = [
    '/path/to/your/item1.png',
    '/path/to/your/item2.png',
    // Add more...
];
```

**2. Changing Color Palettes**

Edit `src/renderer/scripts/index.js`:
```javascript
const colorPalettes = {
    'square': [
        { name: 'Your Color', color: '#HEXCODE' },
        // Add more...
    ],
    // Other shapes...
};
```

**3. Modifying Touch Sensitivity**

Edit `src/renderer/scripts/multitouch-manager.js`:
```javascript
this.config = {
    MIN_SCALE: 0.3,         // Minimum zoom
    MAX_SCALE: 3.0,         // Maximum zoom
    PINCH_THRESHOLD: 10,    // Adjust this
    ROTATE_THRESHOLD: 5,    // And this
    DRAG_THRESHOLD: 3       // And this
};
```

**4. Customizing Watermark**

Edit `src/server/server.js`, function `addWatermark()`:
```javascript
const text = 'Your Brand';  // Change this
// Adjust font, size, position as needed
```

### Environment Variables

Create `.env` file in root (optional):
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# WhatsApp Configuration
PUPPETEER_EXECUTABLE_PATH=/path/to/chrome

# Facebook (if using OAuth)
FB_APP_ID=your_app_id
FB_APP_SECRET=your_app_secret
```

---

## Common Issues

### Installation Issues

**Error: "Node version too old"**
- Solution: Install Node.js 18 or higher from nodejs.org
```bash
node --version  # Check version
```

**Error: "npm install fails with gyp errors"**
- Solution (Windows):
```bash
npm install -g windows-build-tools
npm install -g node-gyp
npm install
```

**Error: "Puppeteer download fails"**
- Solution: Use manual Chromium path
```bash
# Linux/Mac
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Windows (PowerShell)
$env:PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
```

### Runtime Issues

**WhatsApp QR Not Appearing**
1. Check internet connection
2. Wait 20 seconds
3. Restart application
4. Clear session: `npm run clear-session`
5. Check firewall isn't blocking port 3000

**Canvas Touch Not Working**
1. Enable touch in Windows settings
2. Calibrate touch screen
3. Check browser/Electron touch support:
```javascript
// In DevTools console:
console.log('Max touch points:', navigator.maxTouchPoints);
```
4. Restart application

**Application Crashes on Startup**
1. Check system requirements
2. Close other heavy applications
3. Clear cache:
```bash
# Windows
del /s /q %APPDATA%\thangka-designer
npm run clear-session
```

**Share Features Not Working**
- WhatsApp:
  - Verify QR code was scanned
  - Check phone number format (international format)
  - Test: `curl http://localhost:3000/api/health`

- Facebook:
  - Only works in built application (not browser)
  - Check internet connection
  - Try logging out and back in

### Build Issues

**Error: "electron-builder fails"**
- Solution:
```bash
# Clear cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try again
npm run build
```

**Error: "Code signing failed"**
- Solution: Disable code signing (dev builds only)
- Edit `package.json`:
```json
"build": {
    "win": {
        "target": "nsis",
        "sign": false  // Add this
    }
}
```

---

## Advanced Configuration

### Kiosk Mode Setup

For public installations:

1. **Auto-Start on Windows Boot**
   - Create shortcut in: `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp`

2. **Disable Windows Key and Alt+Tab**
   - Use Group Policy Editor:
   - `gpedit.msc` → User Configuration → Administrative Templates → Windows Components → File Explorer
   - Enable "Turn off Windows Key hotkeys"

3. **Full Kiosk Mode**
   Edit `src/main/main.js`:
```javascript
mainWindow = new BrowserWindow({
    fullscreen: true,
    kiosk: true,  // Enable kiosk mode
    frame: false,
    alwaysOnTop: true,
    // ...
});
```

### Network Configuration

**Running on Custom Port**:
```bash
# Linux/Mac
PORT=8080 npm run dev

# Windows (PowerShell)
$env:PORT=8080; npm run dev
```

**Accessing from Other Devices**:
1. Find your IP: `ipconfig` (Windows) or `ifconfig` (Linux/Mac)
2. Allow through firewall
3. Access: `http://YOUR_IP:3000`

### Database Integration (Future)

To add persistent storage:
1. Install SQLite: `npm install better-sqlite3`
2. Create schema in `src/server/database/`
3. Implement save/load functions
4. Connect to UI

### Performance Optimization

**For Low-End Hardware**:
```javascript
// In src/renderer/scripts/game.js
const draggableItems = [/* Reduce to 10-15 items */];

// In src/main/main.js
webPreferences: {
    enableBlinkFeatures: '',
    disableBlinkFeatures: 'Auxclick',
    hardwareAcceleration: true
}
```

**For High-End Touch Displays**:
```javascript
// Increase history size
const MAX_HISTORY = 50;

// Higher export quality
const dataURL = stage.toDataURL({ pixelRatio: 3 });
```

---

## Testing Checklist

Before deploying:

- [ ] WhatsApp QR code appears within 15 seconds
- [ ] QR code can be scanned and connects successfully
- [ ] All four canvas shapes render correctly
- [ ] Color palettes load for each shape
- [ ] Items can be dragged from panel to canvas
- [ ] Single touch drag works
- [ ] Two-finger pinch zoom works
- [ ] Two-finger rotation works
- [ ] Undo/Redo functions work
- [ ] Clear canvas works
- [ ] Phone number validation works
- [ ] WhatsApp sharing sends successfully
- [ ] Facebook window opens (in built app)
- [ ] Download saves PNG file
- [ ] Keyboard shortcuts function
- [ ] Application survives 30+ minute session
- [ ] Session persists after app restart
- [ ] Clear session script works

---

## Resources

- **Electron Docs**: https://www.electronjs.org/docs
- **Konva.js Docs**: https://konvajs.org/docs/
- **whatsapp-web.js**: https://wwebjs.dev/
- **Express.js**: https://expressjs.com/

## Support

For additional help:
- GitHub Issues: [Report Bug](https://github.com/yourusername/thangka-designer/issues)
- Email: support@iknowHow.com
- Wiki: [Full Documentation](https://github.com/yourusername/thangka-designer/wiki)

---

**Last Updated**: 2025-01-14
**Version**: 1.0.0
