/**
 * Main Entry Point - DebugSwift 3D Nexus
 */

import { SceneManager } from './scene.js';
import { ParticleSystem } from './particles.js';
import { ServiceNodes } from './nodes.js';
import { InteractionManager } from './interactions.js';
import { AnimationManager } from './animations.js';
import { UIManager } from './ui.js';
import { Router } from './router.js';

class DebugSwiftNexus {
    constructor() {
        // Get canvas
        this.canvas = document.getElementById('webgl-canvas');
        if (!this.canvas) {
            console.error('Canvas not found!');
            return;
        }

        // Initialize managers
        this.sceneManager = null;
        this.particleSystem = null;
        this.serviceNodes = null;
        this.interactionManager = null;
        this.animationManager = null;
        this.uiManager = null;
        this.router = null;

        // Loading state
        this.isLoaded = false;

        // Start loading
        this.init();
    }

    async init() {
        // Show loading screen
        this.showLoader();

        // Simulate loading time for dramatic effect
        await this.loadResources();

        // Initialize all systems
        this.initSystems();

        // Hide loader and start experience
        this.hideLoader();

        // Start animation loop
        this.animate();

        // Play intro animation
        this.playIntro();
    }

    async loadResources() {
        // Simulate resource loading
        return new Promise((resolve) => {
            let progress = 0;
            const loader = document.getElementById('loader-progress');

            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    setTimeout(resolve, 300);
                }

                if (loader) {
                    loader.style.width = `${progress}%`;
                }
            }, 100);
        });
    }

    initSystems() {
        // Initialize scene
        this.sceneManager = new SceneManager(this.canvas);

        // Initialize particle system
        this.particleSystem = new ParticleSystem(
            this.sceneManager.getScene(),
            10000
        );

        // Initialize service nodes
        this.serviceNodes = new ServiceNodes(this.sceneManager.getScene());

        // Initialize interaction manager
        this.interactionManager = new InteractionManager(
            this.sceneManager.getCamera(),
            this.canvas,
            this.serviceNodes
        );

        // Initialize animation manager
        this.animationManager = new AnimationManager(
            this.sceneManager.getCamera(),
            this.sceneManager.getControls(),
            this.sceneManager
        );

        // Initialize UI manager
        this.uiManager = new UIManager();

        // Initialize router
        this.router = new Router(
            this.uiManager,
            this.animationManager,
            this.serviceNodes
        );

        // Setup event listeners
        this.setupEventListeners();

        this.isLoaded = true;
    }

    setupEventListeners() {
        // Listen for node clicks
        window.addEventListener('nodeClicked', (event) => {
            const { nodeId } = event.detail;
            this.router.navigateToService(nodeId);
        });

        // Update cursor style when controls are being used
        const canvas = this.canvas;
        const controls = this.sceneManager.getControls();

        controls.addEventListener('start', () => {
            canvas.style.cursor = 'grabbing';
        });

        controls.addEventListener('end', () => {
            canvas.style.cursor = 'grab';
        });
    }

    showLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'flex';
        }
    }

    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            gsap.to(loader, {
                opacity: 0,
                duration: 1,
                delay: 0.5,
                ease: 'power2.out',
                onComplete: () => {
                    loader.style.display = 'none';
                }
            });
        }
    }

    playIntro() {
        // Play cinematic intro
        this.animationManager.playIntro(() => {
            // Show hero section after intro
            this.uiManager.showHero();
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        if (!this.isLoaded) return;

        const elapsedTime = this.sceneManager.getClock().getElapsedTime();

        // Update systems
        this.sceneManager.update();
        this.particleSystem.update(elapsedTime);
        this.serviceNodes.update(elapsedTime);

        // Render
        this.sceneManager.render();
    }

    dispose() {
        // Cleanup
        if (this.particleSystem) this.particleSystem.dispose();
        if (this.serviceNodes) this.serviceNodes.dispose();
        if (this.interactionManager) this.interactionManager.dispose();
        if (this.animationManager) this.animationManager.dispose();
        if (this.uiManager) this.uiManager.dispose();
        if (this.router) this.router.dispose();
    }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new DebugSwiftNexus();
    });
} else {
    new DebugSwiftNexus();
}

// Handle window unload
window.addEventListener('beforeunload', () => {
    if (window.debugSwiftNexus) {
        window.debugSwiftNexus.dispose();
    }
});
