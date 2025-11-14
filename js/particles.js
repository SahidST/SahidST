/**
 * Particle System - Dynamic background particles
 */

import * as THREE from 'three';
import {
    particleVertexShader,
    particleFragmentShader
} from './shaders.js';

export class ParticleSystem {
    constructor(scene, count = 10000) {
        this.scene = scene;
        this.count = count;
        this.particlesMesh = null;

        this.init();
    }

    init() {
        // Geometry
        const geometry = new THREE.BufferGeometry();

        // Positions - distributed in a sphere around the center
        const positions = new Float32Array(this.count * 3);
        const scales = new Float32Array(this.count);
        const randomness = new Float32Array(this.count);

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;

            // Spherical distribution with some randomness
            const radius = 50 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            // Random scale for size variation
            scales[i] = Math.random() * 0.5 + 0.5;

            // Random value for animation phase
            randomness[i] = Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
        geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 1));

        // Material with custom shader
        const material = new THREE.ShaderMaterial({
            vertexShader: particleVertexShader,
            fragmentShader: particleFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
                uColor: { value: new THREE.Color(0x00bfff) } // Bright Cyan
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        // Create mesh
        this.particlesMesh = new THREE.Points(geometry, material);
        this.particlesMesh.name = 'particleSystem';
        this.scene.add(this.particlesMesh);
    }

    update(elapsedTime) {
        if (this.particlesMesh) {
            // Update shader time
            this.particlesMesh.material.uniforms.uTime.value = elapsedTime;

            // Slow rotation for depth effect
            this.particlesMesh.rotation.y = elapsedTime * 0.02;
            this.particlesMesh.rotation.x = Math.sin(elapsedTime * 0.01) * 0.1;
        }
    }

    dispose() {
        if (this.particlesMesh) {
            this.particlesMesh.geometry.dispose();
            this.particlesMesh.material.dispose();
            this.scene.remove(this.particlesMesh);
        }
    }
}
