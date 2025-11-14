/**
 * Scene Setup - Core 3D scene initialization
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import {
    logoVertexShader,
    logoFragmentShader
} from './shaders.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        // Initialize core components
        this.initScene();
        this.initCamera();
        this.initRenderer();
        this.initControls();
        this.initLights();
        this.initCentralLogo();
        this.initPostProcessing();

        // Bind resize handler
        window.addEventListener('resize', this.handleResize.bind(this));

        // Time for animations
        this.clock = new THREE.Clock();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x05080f); // Deep Space Navy
        this.scene.fog = new THREE.Fog(0x05080f, 50, 200);
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.sizes.width / this.sizes.height,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 30);
        this.scene.add(this.camera);

        // Store initial camera position for reset
        this.initialCameraPosition = this.camera.position.clone();
        this.initialCameraTarget = new THREE.Vector3(0, 0, 0);
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });

        this.renderer.setSize(this.sizes.width, this.sizes.height);

        // Limit DPR for performance
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        this.renderer.setPixelRatio(pixelRatio);

        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = false;
        this.controls.minDistance = 15;
        this.controls.maxDistance = 60;
        this.controls.maxPolarAngle = Math.PI / 1.5;
        this.controls.minPolarAngle = Math.PI / 3;
    }

    initLights() {
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);

        // Central point light (from logo) - Neon Green
        this.logoLight = new THREE.PointLight(0x00ff8a, 2, 100);
        this.logoLight.position.set(0, 0, 0);
        this.scene.add(this.logoLight);

        // Additional accent lights - Cyan
        const accentLight1 = new THREE.PointLight(0x00bfff, 1, 50);
        accentLight1.position.set(20, 10, 10);
        this.scene.add(accentLight1);

        const accentLight2 = new THREE.PointLight(0x00bfff, 1, 50);
        accentLight2.position.set(-20, -10, 10);
        this.scene.add(accentLight2);

        // Directional light for depth
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
    }

    initCentralLogo() {
        // Create TorusKnot geometry for the central logo
        const geometry = new THREE.TorusKnotGeometry(3, 1, 128, 16, 2, 3);

        // Custom shader material with pulsing glow
        const material = new THREE.ShaderMaterial({
            vertexShader: logoVertexShader,
            fragmentShader: logoFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x00ff8a) } // Neon Green
            },
            wireframe: true,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.logo = new THREE.Mesh(geometry, material);
        this.logo.name = 'centralLogo';
        this.scene.add(this.logo);

        // Add emissive wireframe version for extra glow
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff8a,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const glowLogo = new THREE.Mesh(geometry.clone(), glowMaterial);
        glowLogo.scale.setScalar(1.02);
        this.logo.add(glowLogo);
    }

    initPostProcessing() {
        // Create composer
        this.composer = new EffectComposer(this.renderer);

        // Render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Unreal Bloom Pass - The key to the glow effect
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.sizes.width, this.sizes.height),
            0.8,  // strength
            0.5,  // radius
            0.3   // threshold
        );
        this.composer.addPass(this.bloomPass);

        // Bokeh Pass (Depth of Field) - Initially disabled
        this.bokehPass = new BokehPass(this.scene, this.camera, {
            focus: 30.0,
            aperture: 0.00001,
            maxblur: 0.01
        });
        this.bokehPass.enabled = false;
        this.composer.addPass(this.bokehPass);
    }

    // Method to enable/disable depth of field
    setDepthOfField(enabled, focus = 30, aperture = 0.00005, maxblur = 0.01) {
        this.bokehPass.enabled = enabled;
        if (enabled) {
            this.bokehPass.uniforms['focus'].value = focus;
            this.bokehPass.uniforms['aperture'].value = aperture;
            this.bokehPass.uniforms['maxblur'].value = maxblur;
        }
    }

    handleResize() {
        // Update sizes
        this.sizes.width = window.innerWidth;
        this.sizes.height = window.innerHeight;

        // Update camera
        this.camera.aspect = this.sizes.width / this.sizes.height;
        this.camera.updateProjectionMatrix();

        // Update renderer
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        this.renderer.setPixelRatio(pixelRatio);

        // Update composer
        this.composer.setSize(this.sizes.width, this.sizes.height);
    }

    update() {
        const elapsedTime = this.clock.getElapsedTime();

        // Update logo rotation and shader
        if (this.logo) {
            this.logo.rotation.x = elapsedTime * 0.1;
            this.logo.rotation.y = elapsedTime * 0.15;
            this.logo.material.uniforms.uTime.value = elapsedTime;

            // "Look at" effect - logo slightly orients towards camera
            const targetQuaternion = new THREE.Quaternion();
            const lookAtMatrix = new THREE.Matrix4();
            lookAtMatrix.lookAt(
                this.logo.position,
                this.camera.position,
                new THREE.Vector3(0, 1, 0)
            );
            targetQuaternion.setFromRotationMatrix(lookAtMatrix);

            // Subtle slerp for smooth orientation
            this.logo.quaternion.slerp(targetQuaternion, 0.02);
        }

        // Update logo light intensity (pulsing)
        if (this.logoLight) {
            this.logoLight.intensity = 2 + Math.sin(elapsedTime * 2) * 0.5;
        }

        // Update controls
        this.controls.update();
    }

    render() {
        // Use composer for post-processing
        this.composer.render();
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    getRenderer() {
        return this.renderer;
    }

    getControls() {
        return this.controls;
    }

    getClock() {
        return this.clock;
    }
}
