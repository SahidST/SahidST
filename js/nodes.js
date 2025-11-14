/**
 * Service Nodes - Interactive 3D service constellation
 */

import * as THREE from 'three';

export class ServiceNodes {
    constructor(scene) {
        this.scene = scene;
        this.nodes = [];
        this.nodeData = this.getNodeData();

        this.init();
    }

    getNodeData() {
        return [
            {
                id: 'web-development',
                name: 'Web Development',
                geometry: 'icosahedron',
                color: 0x00bfff,
                orbit: { radius: 18, speed: 0.3, offset: 0, tilt: 0.2 }
            },
            {
                id: 'app-development',
                name: 'Mobile App Development',
                geometry: 'roundedBox',
                color: 0x00bfff,
                orbit: { radius: 20, speed: 0.25, offset: Math.PI / 6, tilt: 0.3 }
            },
            {
                id: 'desktop-development',
                name: 'Desktop App Development',
                geometry: 'box',
                color: 0x00bfff,
                orbit: { radius: 19, speed: 0.28, offset: Math.PI / 3, tilt: -0.2 }
            },
            {
                id: 'game-development',
                name: 'Game Development',
                geometry: 'dodecahedron',
                color: 0x00bfff,
                orbit: { radius: 21, speed: 0.32, offset: Math.PI / 2, tilt: 0.4 }
            },
            {
                id: 'performance',
                name: 'Performance & Core Web Vitals',
                geometry: 'torus',
                color: 0x00bfff,
                orbit: { radius: 17, speed: 0.35, offset: 2 * Math.PI / 3, tilt: -0.3 }
            },
            {
                id: 'seo',
                name: 'SEO Optimization',
                geometry: 'cone',
                color: 0x00bfff,
                orbit: { radius: 22, speed: 0.27, offset: 5 * Math.PI / 6, tilt: 0.1 }
            },
            {
                id: 'uiux-design',
                name: 'UI/UX Design',
                geometry: 'torusKnot',
                color: 0x00bfff,
                orbit: { radius: 18, speed: 0.29, offset: Math.PI, tilt: -0.4 }
            },
            {
                id: 'security',
                name: 'Security',
                geometry: 'tetrahedron',
                color: 0x00bfff,
                orbit: { radius: 20, speed: 0.31, offset: 7 * Math.PI / 6, tilt: 0.25 }
            },
            {
                id: 'process',
                name: 'Our Process',
                geometry: 'plane',
                color: 0x00bfff,
                orbit: { radius: 19, speed: 0.26, offset: 4 * Math.PI / 3, tilt: -0.1 }
            },
            {
                id: 'portfolio',
                name: 'Portfolio & Testimonials',
                geometry: 'sphere',
                color: 0x00bfff,
                orbit: { radius: 21, speed: 0.33, offset: 3 * Math.PI / 2, tilt: 0.35 }
            },
            {
                id: 'blog',
                name: 'Blog',
                geometry: 'octahedron',
                color: 0x00bfff,
                orbit: { radius: 18, speed: 0.24, offset: 5 * Math.PI / 3, tilt: -0.25 }
            },
            {
                id: 'contact',
                name: 'Free Audit / Contact',
                geometry: 'octahedron',
                color: 0x00ff8a, // Neon Green for CTA
                size: 1.5,
                orbit: { radius: 17, speed: 0.36, offset: 11 * Math.PI / 6, tilt: 0.15 }
            }
        ];
    }

    createGeometry(type, size = 1) {
        switch (type) {
            case 'icosahedron':
                return new THREE.IcosahedronGeometry(size, 0);
            case 'roundedBox':
                return new THREE.BoxGeometry(size * 0.8, size * 1.5, size * 0.3, 2, 2, 2);
            case 'box':
                return new THREE.BoxGeometry(size, size, size);
            case 'dodecahedron':
                return new THREE.DodecahedronGeometry(size, 0);
            case 'torus':
                return new THREE.TorusGeometry(size * 0.7, size * 0.3, 16, 32);
            case 'cone':
                return new THREE.ConeGeometry(size * 0.6, size * 1.2, 8);
            case 'torusKnot':
                return new THREE.TorusKnotGeometry(size * 0.6, size * 0.2, 64, 8);
            case 'tetrahedron':
                return new THREE.TetrahedronGeometry(size, 0);
            case 'plane':
                return new THREE.PlaneGeometry(size * 1.2, size * 1.2);
            case 'sphere':
                return new THREE.SphereGeometry(size, 32, 32);
            case 'octahedron':
                return new THREE.OctahedronGeometry(size, 0);
            default:
                return new THREE.BoxGeometry(size, size, size);
        }
    }

    init() {
        this.nodeData.forEach(data => {
            const size = data.size || 1;
            const geometry = this.createGeometry(data.geometry, size);

            // Wireframe material with emissive color
            const material = new THREE.MeshStandardMaterial({
                color: data.color,
                emissive: data.color,
                emissiveIntensity: 0.3,
                wireframe: true,
                transparent: true,
                opacity: 0.8,
                metalness: 0.8,
                roughness: 0.2
            });

            const mesh = new THREE.Mesh(geometry, material);

            // Add solid inner glow mesh for depth
            const glowGeometry = geometry.clone();
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: data.color,
                transparent: true,
                opacity: 0.1,
                side: THREE.BackSide
            });
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            glowMesh.scale.setScalar(0.9);
            mesh.add(glowMesh);

            // Store node data
            mesh.userData = {
                id: data.id,
                name: data.name,
                orbit: data.orbit,
                originalColor: data.color,
                isHovered: false,
                rotationSpeed: Math.random() * 0.5 + 0.5
            };

            mesh.name = `node-${data.id}`;

            // Add to scene
            this.scene.add(mesh);
            this.nodes.push(mesh);
        });
    }

    update(elapsedTime) {
        this.nodes.forEach(node => {
            const orbit = node.userData.orbit;

            // Calculate orbital position (multi-layered orbits)
            const angle = elapsedTime * orbit.speed + orbit.offset;

            // 3D orbital path with tilt
            node.position.x = Math.cos(angle) * orbit.radius;
            node.position.y = Math.sin(angle * 0.7 + orbit.tilt) * orbit.radius * 0.3;
            node.position.z = Math.sin(angle) * orbit.radius;

            // Rotate nodes for visual interest
            node.rotation.x += 0.01 * node.userData.rotationSpeed;
            node.rotation.y += 0.01 * node.userData.rotationSpeed;

            // Pulsing effect for contact node (CTA)
            if (node.userData.id === 'contact') {
                const pulse = Math.sin(elapsedTime * 3) * 0.1 + 1;
                node.scale.setScalar(pulse);
                node.material.emissiveIntensity = 0.5 + Math.sin(elapsedTime * 3) * 0.2;
            }
        });
    }

    getNodes() {
        return this.nodes;
    }

    getNodeById(id) {
        return this.nodes.find(node => node.userData.id === id);
    }

    highlightNode(node, highlight = true) {
        if (highlight) {
            node.material.emissive.setHex(0x00bfff); // Bright Cyan
            node.material.emissiveIntensity = 1.0;
            node.userData.isHovered = true;
        } else {
            node.material.emissive.setHex(node.userData.originalColor);
            node.material.emissiveIntensity = 0.3;
            node.userData.isHovered = false;
        }
    }

    dispose() {
        this.nodes.forEach(node => {
            node.geometry.dispose();
            node.material.dispose();
            // Dispose glow mesh
            if (node.children.length > 0) {
                node.children[0].geometry.dispose();
                node.children[0].material.dispose();
            }
            this.scene.remove(node);
        });
        this.nodes = [];
    }
}
