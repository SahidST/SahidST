# Thangka Designer - Interactive Multi-Touch Canvas Application

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A professional, production-ready Electron desktop application featuring an interactive multi-touch canvas for creative design with integrated WhatsApp and Facebook sharing capabilities. Designed for museum kiosks and public exhibition displays with large multi-touch screens.

## 🎯 Features

### Core Functionality
- **Multi-Touch Canvas**: Supports unlimited simultaneous touches with smooth gesture recognition
- **Shape Selection**: Square, Circle, Horizontal Rectangle, Vertical Rectangle canvas formats
- **Color Themes**: Unique color palettes for each canvas shape
- **Drag & Drop**: Intuitive drag-and-drop interface for adding design elements
- **Real-Time Manipulation**: Pinch to zoom, rotate, pan, and move objects with natural gestures

### Gesture Support
- **Single Touch**: Drag and move objects
- **Two Fingers**: Pinch to zoom, rotate objects
- **Multi-Touch**: Simultaneous manipulation of multiple objects

### Social Sharing
- **WhatsApp Integration**:
  - QR code authentication
  - Phone number validation
  - Direct image sharing with automatic watermark
  - Session persistence

- **Facebook Sharing**:
  - OAuth integration
  - Auto-post with caption
  - Automatic logout after posting

- **Direct Download**: Export as high-resolution PNG

### User Experience
- Splash screen with loading animation
- Real-time touch count and object tracking
- Undo/Redo history (up to 20 steps)
- Keyboard shortcuts for power users
- Responsive interface
- Auto-reconnection for network interruptions

## 📋 Requirements

### System Requirements
- **OS**: Windows 10/11 (64-bit)
- **RAM**: 4GB minimum, 8GB recommended
- **Display**: 1920x1080 or higher resolution
- **Touch Screen**: Optional but recommended for full experience
- **Internet**: Required for WhatsApp and Facebook features

### Software Dependencies
- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Chrome/Chromium (included with Electron)

## 🚀 Installation

### Development Setup

1. **Clone the repository**:
```bash
git clone https://github.com/yourusername/thangka-designer.git
cd thangka-designer
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start development server**:
```bash
npm run dev
```

### Production Build

1. **Build Windows installer**:
```bash
npm run build
```

2. **Install the application**:
   - Navigate to `dist` folder
   - Run the `Thangka Designer Setup.exe` installer
   - Follow installation wizard

## 📖 Usage Guide

### First Launch

1. **WhatsApp Authentication**:
   - Launch the application
   - Wait for QR code to appear (10-15 seconds)
   - Open WhatsApp on your phone
   - Go to Settings → Linked Devices → Link a Device
   - Scan the QR code
   - Wait for confirmation (connected phone number will display)

2. **Select Canvas**:
   - Choose your preferred canvas shape
   - Select a color theme
   - Click "Start Designing"

3. **Design on Canvas**:
   - Drag items from the side panel onto the canvas
   - Use touch gestures to manipulate objects:
     - **Drag**: Move with one finger
     - **Pinch**: Zoom in/out with two fingers
     - **Rotate**: Turn with two fingers
   - Use toolbar buttons for undo/redo/clear

4. **Share Your Design**:
   - Click the "Share" button
   - Choose WhatsApp, Facebook, or Download
   - Follow prompts for your selected option

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+F5` | Reload page |
| `Alt+F12` | Toggle DevTools (development) |
| `Ctrl+W` | Navigate to QR code page |
| `Ctrl+Q` | Navigate to home page |
| `F11` | Toggle fullscreen |
| `Alt+Shift+Q` | Quit application |

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the root directory (optional):

```env
PORT=3000
NODE_ENV=production
PUPPETEER_EXECUTABLE_PATH=/path/to/chrome
```

### Customizing Design Elements

Edit `src/renderer/scripts/game.js` to modify draggable items:

```javascript
const draggableItems = [
    'path/to/your/image1.png',
    'path/to/your/image2.png',
    // Add more items...
];
```

### Adjusting Multi-Touch Settings

Modify sensitivity in `src/renderer/scripts/multitouch-manager.js`:

```javascript
this.config = {
    MIN_SCALE: 0.3,         // Minimum zoom (30%)
    MAX_SCALE: 3.0,         // Maximum zoom (300%)
    PINCH_THRESHOLD: 10,    // Pixels before pinch activates
    ROTATE_THRESHOLD: 5,    // Degrees before rotation activates
    DRAG_THRESHOLD: 3       // Pixels before drag activates
};
```

## 🔧 Maintenance

### Clear WhatsApp Session

If you encounter WhatsApp connection issues:

```bash
npm run clear-session
```

This will:
- Remove WhatsApp authentication data
- Clear temporary upload files
- Force QR code re-scan on next launch

### Reset to Default

1. Uninstall the application
2. Delete `%APPDATA%/thangka-designer` folder
3. Reinstall

## 📁 Project Structure

```
thangka-designer/
├── src/
│   ├── main/
│   │   ├── main.js                 # Electron main process
│   │   └── preload.js              # IPC bridge
│   ├── renderer/
│   │   ├── pages/
│   │   │   ├── splash.html         # Loading screen
│   │   │   ├── qr-code.html        # WhatsApp auth
│   │   │   ├── index.html          # Shape/color selection
│   │   │   └── game.html           # Main canvas
│   │   ├── scripts/
│   │   │   ├── multitouch-manager.js
│   │   │   └── game.js
│   │   └── styles/
│   │       └── *.css
│   └── server/
│       └── server.js               # Express backend
├── scripts/
│   └── clear-session.js
├── package.json
└── README.md
```

## 🐛 Troubleshooting

### WhatsApp Issues

**Problem**: QR code not appearing
- **Solution**: Wait 15-20 seconds, check internet connection
- **Alternative**: Run `npm run clear-session` and restart

**Problem**: "Phone number not registered on WhatsApp"
- **Solution**: Verify the number is correct and has WhatsApp installed
- **Format**: Enter without country code for default region, or with full international format

### Canvas Issues

**Problem**: Touch gestures not working
- **Solution**: Ensure touch screen is properly calibrated
- **Alternative**: Use mouse (drag = touch, scroll+drag = pinch)

**Problem**: Objects disappearing
- **Solution**: Check if objects are behind the background shape
- **Fix**: Use undo (Ctrl+Z) or click "Clear All" and start over

### Performance Issues

**Problem**: Lag with many objects
- **Solution**: Limit to 20-30 objects on canvas
- **Alternative**: Clear canvas and start new design

**Problem**: App crashes on startup
- **Solution**: Check system requirements, close other applications
- **Fix**: Run `npm run clear-session`, restart computer

## 🔐 Security & Privacy

- **Local Storage**: All WhatsApp session data is stored locally
- **No Tracking**: Application does not send analytics or telemetry
- **Watermarking**: All shared images include "IKnowHow" watermark
- **Session Isolation**: Each installation has independent WhatsApp session

## 📝 Development

### Tech Stack
- **Framework**: Electron 27.x
- **Backend**: Express.js 4.x
- **Canvas**: Konva.js 9.x
- **WhatsApp**: whatsapp-web.js 1.23.x
- **Real-Time**: WebSocket

### Adding New Features

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m "Add new feature"`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

### Testing

```bash
# Run in development mode with DevTools
npm run dev

# Test build without installation
npm run build
# Check dist/ folder
```

## 📄 License

MIT License - see [LICENSE.md](LICENSE.md) for details

## 👥 Credits

- **Developed by**: IKnowHow
- **Canvas Library**: Konva.js
- **WhatsApp Integration**: whatsapp-web.js
- **Icons**: Custom SVG designs

## 📞 Support

For issues, questions, or feature requests:
- **Email**: support@iknowHow.com
- **GitHub Issues**: [Create Issue](https://github.com/yourusername/thangka-designer/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/thangka-designer/wiki)

## 🗺️ Roadmap

- [ ] Multi-language support
- [ ] Cloud save functionality
- [ ] Template library
- [ ] Video export
- [ ] Instagram integration
- [ ] Collaborative design mode
- [ ] Custom brush tools
- [ ] Layer management

---

**Version**: 1.0.0
**Last Updated**: 2025-01-14
**Platform**: Windows 10/11 (64-bit)

Made with ❤️ by IKnowHow
