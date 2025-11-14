/**
 * Interactions - Raycasting, hover, and click handlers
 */

import * as THREE from 'three';

export class InteractionManager {
    constructor(camera, canvas, serviceNodes) {
        this.camera = camera;
        this.canvas = canvas;
        this.serviceNodes = serviceNodes;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.currentHoveredNode = null;
        this.tooltip = document.getElementById('node-tooltip');

        this.bindEvents();
    }

    bindEvents() {
        // Mouse move for hover effects
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));

        // Click for node selection
        this.canvas.addEventListener('click', this.onClick.bind(this));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
    }

    onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.updateHover();
        this.updateTooltipPosition(event.clientX, event.clientY);
    }

    onTouchMove(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

            this.updateHover();
            this.updateTooltipPosition(touch.clientX, touch.clientY);
        }
    }

    onTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

            this.handleNodeClick();
        }
    }

    onClick() {
        this.handleNodeClick();
    }

    updateHover() {
        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check for intersections with nodes
        const nodes = this.serviceNodes.getNodes();
        const intersects = this.raycaster.intersectObjects(nodes, false);

        if (intersects.length > 0) {
            const hoveredNode = intersects[0].object;

            // If hovering over a new node
            if (this.currentHoveredNode !== hoveredNode) {
                // Reset previous hovered node
                if (this.currentHoveredNode) {
                    this.serviceNodes.highlightNode(this.currentHoveredNode, false);
                }

                // Highlight new node
                this.serviceNodes.highlightNode(hoveredNode, true);
                this.currentHoveredNode = hoveredNode;

                // Show tooltip
                this.showTooltip(hoveredNode.userData.name);

                // Change cursor
                this.canvas.style.cursor = 'pointer';
            }
        } else {
            // No intersection - reset
            if (this.currentHoveredNode) {
                this.serviceNodes.highlightNode(this.currentHoveredNode, false);
                this.currentHoveredNode = null;
                this.hideTooltip();
                this.canvas.style.cursor = 'grab';
            }
        }
    }

    handleNodeClick() {
        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check for intersections
        const nodes = this.serviceNodes.getNodes();
        const intersects = this.raycaster.intersectObjects(nodes, false);

        if (intersects.length > 0) {
            const clickedNode = intersects[0].object;
            const serviceId = clickedNode.userData.id;

            // Dispatch custom event for node click
            const event = new CustomEvent('nodeClicked', {
                detail: {
                    nodeId: serviceId,
                    nodeName: clickedNode.userData.name,
                    nodePosition: clickedNode.position.clone()
                }
            });
            window.dispatchEvent(event);
        }
    }

    showTooltip(text) {
        if (this.tooltip) {
            this.tooltip.querySelector('span').textContent = text;
            this.tooltip.style.opacity = '1';
        }
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.opacity = '0';
        }
    }

    updateTooltipPosition(x, y) {
        if (this.tooltip && this.currentHoveredNode) {
            // Offset tooltip from cursor
            const offsetX = 15;
            const offsetY = 15;

            // Keep tooltip within viewport
            let tooltipX = x + offsetX;
            let tooltipY = y + offsetY;

            const tooltipRect = this.tooltip.getBoundingClientRect();
            if (tooltipX + tooltipRect.width > window.innerWidth) {
                tooltipX = x - tooltipRect.width - offsetX;
            }
            if (tooltipY + tooltipRect.height > window.innerHeight) {
                tooltipY = y - tooltipRect.height - offsetY;
            }

            this.tooltip.style.left = `${tooltipX}px`;
            this.tooltip.style.top = `${tooltipY}px`;
        }
    }

    dispose() {
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        this.canvas.removeEventListener('click', this.onClick);
        this.canvas.removeEventListener('touchstart', this.onTouchStart);
        this.canvas.removeEventListener('touchmove', this.onTouchMove);
    }
}
