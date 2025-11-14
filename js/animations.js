/**
 * Animations - Camera transitions and scene animations
 */

import * as THREE from 'three';

export class AnimationManager {
    constructor(camera, controls, sceneManager) {
        this.camera = camera;
        this.controls = controls;
        this.sceneManager = sceneManager;

        this.isAnimating = false;
        this.currentTween = null;

        // Store initial camera state
        this.homePosition = new THREE.Vector3(0, 0, 30);
        this.homeTarget = new THREE.Vector3(0, 0, 0);
    }

    /**
     * Animate camera to focus on a specific node
     */
    focusOnNode(nodePosition, onComplete = null) {
        if (this.isAnimating) return;

        this.isAnimating = true;

        // Disable controls during animation
        this.controls.enabled = false;

        // Calculate camera position (offset from node)
        const offset = new THREE.Vector3(0, 3, 10);
        const targetCameraPosition = nodePosition.clone().add(offset);

        // Animate camera position
        const startPosition = this.camera.position.clone();
        const startTarget = this.controls.target.clone();

        const duration = 1500; // ms
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-in-out cubic)
            const eased = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            // Interpolate camera position
            this.camera.position.lerpVectors(startPosition, targetCameraPosition, eased);

            // Interpolate look-at target
            this.controls.target.lerpVectors(startTarget, nodePosition, eased);
            this.controls.update();

            // Enable depth of field effect
            const dofProgress = Math.min(progress * 2, 1);
            this.sceneManager.setDepthOfField(
                true,
                30,
                0.0001 * dofProgress,
                0.015 * dofProgress
            );

            if (progress < 1) {
                this.currentTween = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                this.controls.enabled = true;

                if (onComplete) {
                    onComplete();
                }
            }
        };

        animate();
    }

    /**
     * Animate camera back to home position
     */
    returnToHome(onComplete = null) {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.controls.enabled = false;

        const startPosition = this.camera.position.clone();
        const startTarget = this.controls.target.clone();

        const duration = 1500; // ms
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const eased = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            // Interpolate camera position
            this.camera.position.lerpVectors(startPosition, this.homePosition, eased);

            // Interpolate look-at target
            this.controls.target.lerpVectors(startTarget, this.homeTarget, eased);
            this.controls.update();

            // Fade out depth of field
            const dofProgress = 1 - progress;
            if (dofProgress > 0.1) {
                this.sceneManager.setDepthOfField(
                    true,
                    30,
                    0.0001 * dofProgress,
                    0.015 * dofProgress
                );
            } else {
                this.sceneManager.setDepthOfField(false);
            }

            if (progress < 1) {
                this.currentTween = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                this.controls.enabled = true;

                if (onComplete) {
                    onComplete();
                }
            }
        };

        animate();
    }

    /**
     * Cinematic intro animation
     */
    playIntro(onComplete = null) {
        // Start from a wider view
        const startPosition = new THREE.Vector3(0, 10, 60);
        this.camera.position.copy(startPosition);

        this.controls.enabled = false;

        const duration = 3000; // ms
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const eased = 1 - Math.pow(1 - progress, 3);

            // Zoom in to home position
            this.camera.position.lerpVectors(startPosition, this.homePosition, eased);
            this.controls.update();

            if (progress < 1) {
                this.currentTween = requestAnimationFrame(animate);
            } else {
                this.controls.enabled = true;

                if (onComplete) {
                    onComplete();
                }
            }
        };

        animate();
    }

    /**
     * Cancel any ongoing animation
     */
    cancel() {
        if (this.currentTween) {
            cancelAnimationFrame(this.currentTween);
            this.currentTween = null;
        }
        this.isAnimating = false;
        this.controls.enabled = true;
    }

    dispose() {
        this.cancel();
    }
}
