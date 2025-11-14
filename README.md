# DebugSwift 3D Nexus v4.0

A world-class, 3D interactive portfolio website built with three.js, showcasing DebugSwift's premium web development capabilities.

## Features

- **Immersive 3D Experience**: Interactive constellation of 12 service nodes orbiting a central 3D logo
- **Cinematic Animations**: Smooth camera transitions with TWEEN.js and GSAP
- **Advanced Visual Effects**: UnrealBloom and Depth of Field post-processing
- **SEO Optimized**: HTML-first architecture with semantic markup and URL routing
- **Fully Responsive**: Optimized for desktop, tablet, and mobile devices
- **High Performance**: Optimized rendering with instanced meshes and shader-based particles

## Technology Stack

- **3D Engine**: three.js (latest)
- **Animations**: TWEEN.js, GSAP
- **Styling**: Tailwind CSS
- **Post-Processing**: EffectComposer, UnrealBloomPass, BokehPass

## Color Palette

- Background: Deep Space Navy (`#05080f`)
- Primary Accent: Bright Cyan (`#00bfff`) - Interactive elements
- Secondary Accent: Neon Green (`#00ff8a`) - Logo & CTA
- Text Headings: Off-White (`#F0F0F0`)
- Text Body: Light Grey (`#B0B0B0`)

## Setup

1. Install dependencies (optional, uses CDN for libraries):
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```
   Or simply open `index.html` in a modern browser.

## Project Structure

```
/
├── index.html          # Main HTML with semantic content
├── css/
│   └── styles.css      # Custom styles
├── js/
│   ├── main.js         # Entry point & initialization
│   ├── scene.js        # 3D scene setup
│   ├── nodes.js        # Service nodes
│   ├── particles.js    # Particle system
│   ├── interactions.js # Raycasting & interactions
│   ├── animations.js   # Camera animations
│   ├── shaders.js      # Custom shaders
│   ├── ui.js           # Modal management
│   └── router.js       # URL routing
└── sitemap.xml         # SEO sitemap
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Target FPS: 60fps
- Particle count: 10,000+
- Draw calls: Optimized with InstancedMesh
- DPR: Capped at 2 for performance

## License

MIT © DebugSwift
