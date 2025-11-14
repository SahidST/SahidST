/**
 * MultiTouch Manager
 * Handles all touch events and gestures for the canvas application
 * Supports multiple simultaneous touches, drag, pinch, rotate, pan
 */

class MultiTouchManager {
    constructor(stage, layer) {
        this.stage = stage;
        this.layer = layer;

        // Touch tracking
        this.activeTouches = new Map(); // touchId -> touch data
        this.dragGhosts = new Map();     // touchId -> ghost element
        this.itemTouches = new Map();    // konvaImage._id -> array of touchIds
        this.itemGestures = new Map();   // konvaImage._id -> gesture state
        this.dragOperations = new Map(); // touchId -> drag operation data

        // Gesture state
        this.gestureInfo = document.getElementById('gestureInfo');
        this.touchCount = document.getElementById('touchCount');

        // Configuration
        this.config = {
            MIN_SCALE: 0.3,
            MAX_SCALE: 3.0,
            PINCH_THRESHOLD: 10,
            ROTATE_THRESHOLD: 5,
            DRAG_THRESHOLD: 3
        };

        this.init();
    }

    /**
     * Initialize event listeners
     */
    init() {
        console.log('🖐️  Initializing MultiTouch Manager...');

        // Disable Konva's default touch handling
        this.disableKonvaTouchEvents();

        // Capture phase event listeners for all touches
        document.addEventListener('touchstart', this.handleTouchStart.bind(this),
            { passive: false, capture: true });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this),
            { passive: false, capture: true });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this),
            { passive: false, capture: true });
        document.addEventListener('touchcancel', this.handleTouchCancel.bind(this),
            { passive: false, capture: true });

        console.log('✅ MultiTouch Manager initialized');
    }

    /**
     * Disable Konva's built-in touch handling
     */
    disableKonvaTouchEvents() {
        Konva.hitOnDragEnabled = false;
        this.stage.container().style.touchAction = 'none';

        const canvas = document.querySelector('#container canvas');
        if (canvas) {
            canvas.addEventListener('touchstart', (e) => e.stopPropagation(),
                { capture: true, passive: false });
        }
    }

    /**
     * Touch Start Handler
     */
    handleTouchStart(e) {
        e.preventDefault();
        e.stopPropagation();

        for (let touch of e.changedTouches) {
            const touchId = touch.identifier;
            const target = this.identifyTarget(touch);

            // Store touch data
            this.activeTouches.set(touchId, {
                startX: touch.clientX,
                startY: touch.clientY,
                currentX: touch.clientX,
                currentY: touch.clientY,
                startTime: Date.now(),
                target: target,
                operation: null
            });

            // Route to appropriate handler
            if (target.type === 'panel-item') {
                this.startPanelDrag(touchId, target.element, touch);
            } else if (target.type === 'canvas-item') {
                this.startCanvasInteraction(touchId, target.konvaImage, touch);
            }
        }

        this.updateTouchCount();
    }

    /**
     * Touch Move Handler
     */
    handleTouchMove(e) {
        e.preventDefault();
        e.stopPropagation();

        for (let touch of e.changedTouches) {
            const touchId = touch.identifier;
            const touchData = this.activeTouches.get(touchId);

            if (!touchData) continue;

            // Update current position
            touchData.currentX = touch.clientX;
            touchData.currentY = touch.clientY;

            // Route to appropriate handler
            if (touchData.target.type === 'panel-item') {
                this.updatePanelDrag(touchId, touch);
            } else if (touchData.target.type === 'canvas-item') {
                this.updateCanvasInteraction(touchData.target.konvaImage);
            }
        }
    }

    /**
     * Touch End Handler
     */
    handleTouchEnd(e) {
        e.preventDefault();
        e.stopPropagation();

        for (let touch of e.changedTouches) {
            const touchId = touch.identifier;
            const touchData = this.activeTouches.get(touchId);

            if (!touchData) continue;

            // Route to appropriate handler
            if (touchData.target.type === 'panel-item') {
                this.endPanelDrag(touchId, touch);
            } else if (touchData.target.type === 'canvas-item') {
                this.endCanvasInteraction(touchId, touchData.target.konvaImage);
            }

            // Clean up
            this.activeTouches.delete(touchId);
        }

        this.updateTouchCount();

        // Update gesture info
        if (this.activeTouches.size === 0) {
            this.updateGestureInfo('Tap to add objects');
        }
    }

    /**
     * Touch Cancel Handler
     */
    handleTouchCancel(e) {
        this.handleTouchEnd(e);
    }

    /**
     * Identify what the user touched
     */
    identifyTarget(touch) {
        const x = touch.clientX;
        const y = touch.clientY;
        const element = document.elementFromPoint(x, y);

        // Check if touched a panel item
        const panelItem = element.closest('.item');
        if (panelItem) {
            return { type: 'panel-item', element: panelItem };
        }

        // Check if touched a canvas item (Konva)
        const stageBox = this.stage.container().getBoundingClientRect();
        const canvasX = x - stageBox.left;
        const canvasY = y - stageBox.top;

        const konvaTarget = this.stage.getIntersection({ x: canvasX, y: canvasY });
        if (konvaTarget && konvaTarget.name() === 'draggable-image') {
            return { type: 'canvas-item', konvaImage: konvaTarget };
        }

        return { type: 'background' };
    }

    /**
     * Start Panel Drag - dragging from side panel to canvas
     */
    startPanelDrag(touchId, panelItem, touch) {
        const imageSrc = panelItem.querySelector('img').src;

        // Create visual feedback "ghost" image
        const ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        ghost.style.position = 'fixed';
        ghost.style.left = touch.clientX - 50 + 'px';
        ghost.style.top = touch.clientY - 50 + 'px';
        ghost.style.width = '100px';
        ghost.style.height = '100px';
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = '10000';
        ghost.style.opacity = '0.7';
        ghost.style.transform = 'translate(-50%, -50%)';

        const img = document.createElement('img');
        img.src = imageSrc;
        img.style.width = '100%';
        img.style.height = '100%';
        ghost.appendChild(img);

        document.body.appendChild(ghost);
        this.dragGhosts.set(touchId, ghost);

        this.dragOperations.set(touchId, {
            imageSrc: imageSrc,
            ghost: ghost
        });

        this.updateGestureInfo('Dragging from panel...');
    }

    /**
     * Update Panel Drag - move ghost image
     */
    updatePanelDrag(touchId, touch) {
        const ghost = this.dragGhosts.get(touchId);
        if (ghost) {
            ghost.style.left = touch.clientX + 'px';
            ghost.style.top = touch.clientY + 'px';
        }
    }

    /**
     * End Panel Drag - drop item on canvas or cancel
     */
    endPanelDrag(touchId, touch) {
        const dragOp = this.dragOperations.get(touchId);
        const ghost = this.dragGhosts.get(touchId);

        if (!dragOp || !ghost) return;

        // Check if dropped on canvas
        const stageBox = this.stage.container().getBoundingClientRect();
        const canvasX = touch.clientX - stageBox.left;
        const canvasY = touch.clientY - stageBox.top;

        const isOnCanvas = canvasX >= 0 && canvasX <= stageBox.width &&
                          canvasY >= 0 && canvasY <= stageBox.height;

        if (isOnCanvas) {
            // Create new Konva image at drop position
            const imageObj = new Image();
            imageObj.onload = () => {
                const konvaImage = new Konva.Image({
                    x: canvasX - 75,
                    y: canvasY - 75,
                    image: imageObj,
                    width: 150,
                    height: 150,
                    draggable: false, // We handle dragging manually
                    name: 'draggable-image'
                });

                this.layer.add(konvaImage);
                this.layer.batchDraw();

                // Update object count
                updateObjectCount();

                // Add to history
                if (typeof saveState === 'function') {
                    saveState();
                }
            };
            imageObj.src = dragOp.imageSrc;
        }

        // Remove ghost
        ghost.remove();
        this.dragGhosts.delete(touchId);
        this.dragOperations.delete(touchId);
    }

    /**
     * Start Canvas Interaction - touched an item on canvas
     */
    startCanvasInteraction(touchId, konvaImage, touch) {
        // Get or create touch array for this image
        if (!this.itemTouches.has(konvaImage._id)) {
            this.itemTouches.set(konvaImage._id, []);
        }

        const touches = this.itemTouches.get(konvaImage._id);
        touches.push(touchId);

        // Bring to front
        konvaImage.moveToTop();
        this.layer.batchDraw();

        if (touches.length === 1) {
            // SINGLE TOUCH = DRAG
            this.activeTouches.get(touchId).operation = 'drag';
            this.itemGestures.set(konvaImage._id, {
                mode: 'drag',
                initialPos: { x: konvaImage.x(), y: konvaImage.y() }
            });

            this.updateGestureInfo('Dragging object');
        } else if (touches.length === 2) {
            // TWO TOUCHES = GESTURE (pinch/rotate)
            this.activeTouches.get(touchId).operation = 'gesture';
            this.initializeGesture(konvaImage, touches);

            this.updateGestureInfo('Pinch to zoom, rotate to turn');
        } else if (touches.length >= 3) {
            this.updateGestureInfo('Using ' + touches.length + ' touches');
        }
    }

    /**
     * Initialize Gesture - setup pinch/rotate tracking
     */
    initializeGesture(konvaImage, touches) {
        const touch1Data = this.activeTouches.get(touches[0]);
        const touch2Data = this.activeTouches.get(touches[1]);

        if (!touch1Data || !touch2Data) return;

        // Calculate initial distance between two touches
        const dx = touch2Data.currentX - touch1Data.currentX;
        const dy = touch2Data.currentY - touch1Data.currentY;
        const initialDistance = Math.sqrt(dx * dx + dy * dy);

        // Calculate initial angle between two touches
        const initialAngle = Math.atan2(dy, dx) * (180 / Math.PI);

        // Get center point
        const centerX = (touch1Data.currentX + touch2Data.currentX) / 2;
        const centerY = (touch1Data.currentY + touch2Data.currentY) / 2;

        this.itemGestures.set(konvaImage._id, {
            mode: 'gesture',
            initialDistance: initialDistance,
            initialAngle: initialAngle,
            initialScale: konvaImage.scaleX(),
            initialRotation: konvaImage.rotation(),
            centerX: centerX,
            centerY: centerY
        });
    }

    /**
     * Update Canvas Interaction - Drag or Gesture
     */
    updateCanvasInteraction(konvaImage) {
        const touches = this.itemTouches.get(konvaImage._id);
        if (!touches || touches.length === 0) return;

        const gesture = this.itemGestures.get(konvaImage._id);
        if (!gesture) return;

        if (gesture.mode === 'drag' && touches.length === 1) {
            // SINGLE TOUCH DRAG
            this.handleDrag(konvaImage, touches[0]);
        } else if (gesture.mode === 'gesture' && touches.length >= 2) {
            // MULTI TOUCH GESTURE
            this.handleGesture(konvaImage, touches);
        }
    }

    /**
     * Handle Drag - Move item with single touch
     */
    handleDrag(konvaImage, touchId) {
        const touchData = this.activeTouches.get(touchId);
        const gesture = this.itemGestures.get(konvaImage._id);

        if (!touchData || !gesture) return;

        const dx = touchData.currentX - touchData.startX;
        const dy = touchData.currentY - touchData.startY;

        const newX = gesture.initialPos.x + dx;
        const newY = gesture.initialPos.y + dy;

        // Apply boundary constraints
        const constrainedPos = this.constrainToStage(konvaImage, newX, newY);

        konvaImage.position(constrainedPos);
        this.layer.batchDraw();
    }

    /**
     * Handle Gesture - Pinch/Zoom/Rotate with two touches
     */
    handleGesture(konvaImage, touches) {
        const touch1Data = this.activeTouches.get(touches[0]);
        const touch2Data = this.activeTouches.get(touches[1]);
        const gesture = this.itemGestures.get(konvaImage._id);

        if (!touch1Data || !touch2Data || !gesture) return;

        // Calculate current distance
        const dx = touch2Data.currentX - touch1Data.currentX;
        const dy = touch2Data.currentY - touch1Data.currentY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);

        // Calculate current angle
        const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);

        // ──────────────────────────────────────────────────────
        //  SCALE (Pinch Zoom)
        // ──────────────────────────────────────────────────────
        if (Math.abs(currentDistance - gesture.initialDistance) > this.config.PINCH_THRESHOLD) {
            const scaleRatio = currentDistance / gesture.initialDistance;
            let newScale = gesture.initialScale * scaleRatio;

            // Constrain scale
            newScale = Math.max(this.config.MIN_SCALE, Math.min(this.config.MAX_SCALE, newScale));

            konvaImage.scale({ x: newScale, y: newScale });
        }

        // ──────────────────────────────────────────────────────
        //  ROTATION
        // ──────────────────────────────────────────────────────
        if (Math.abs(currentAngle - gesture.initialAngle) > this.config.ROTATE_THRESHOLD) {
            const angleDelta = currentAngle - gesture.initialAngle;
            let newRotation = gesture.initialRotation + angleDelta;

            // Normalize to 0-360
            newRotation = newRotation % 360;
            if (newRotation < 0) newRotation += 360;

            konvaImage.rotation(newRotation);
        }

        // ──────────────────────────────────────────────────────
        //  PAN (Move during gesture)
        // ──────────────────────────────────────────────────────
        const currentCenterX = (touch1Data.currentX + touch2Data.currentX) / 2;
        const currentCenterY = (touch1Data.currentY + touch2Data.currentY) / 2;

        const panDx = currentCenterX - gesture.centerX;
        const panDy = currentCenterY - gesture.centerY;

        const newX = konvaImage.x() + panDx;
        const newY = konvaImage.y() + panDy;

        // Update gesture center for next frame
        gesture.centerX = currentCenterX;
        gesture.centerY = currentCenterY;

        // Apply position with constraints
        const constrainedPos = this.constrainToStage(konvaImage, newX, newY);
        konvaImage.position(constrainedPos);

        this.layer.batchDraw();
    }

    /**
     * End Canvas Interaction - Clean up touch tracking
     */
    endCanvasInteraction(touchId, konvaImage) {
        const touches = this.itemTouches.get(konvaImage._id);
        if (!touches) return;

        const index = touches.indexOf(touchId);
        if (index > -1) {
            touches.splice(index, 1);
        }

        // If no more touches on this item, clean up
        if (touches.length === 0) {
            this.itemTouches.delete(konvaImage._id);
            this.itemGestures.delete(konvaImage._id);

            // Save state to history
            if (typeof saveState === 'function') {
                saveState();
            }
        } else if (touches.length === 1) {
            // Transition from gesture back to drag
            const remainingTouch = touches[0];
            const touchData = this.activeTouches.get(remainingTouch);

            if (touchData) {
                touchData.operation = 'drag';

                this.itemGestures.set(konvaImage._id, {
                    mode: 'drag',
                    initialPos: { x: konvaImage.x(), y: konvaImage.y() }
                });

                this.updateGestureInfo('Dragging object');
            }
        }
    }

    /**
     * Constrain object to stage boundaries
     */
    constrainToStage(image, x, y) {
        const stageWidth = this.stage.width();
        const stageHeight = this.stage.height();

        const imgWidth = image.width() * image.scaleX();
        const imgHeight = image.height() * image.scaleY();

        // Calculate bounds considering rotation
        const rotation = image.rotation();
        const bounds = {
            minX: -imgWidth / 2,
            maxX: stageWidth - imgWidth / 2,
            minY: -imgHeight / 2,
            maxY: stageHeight - imgHeight / 2
        };

        return {
            x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
            y: Math.max(bounds.minY, Math.min(bounds.maxY, y))
        };
    }

    /**
     * Update touch count display
     */
    updateTouchCount() {
        if (this.touchCount) {
            this.touchCount.textContent = this.activeTouches.size;
        }
    }

    /**
     * Update gesture info display
     */
    updateGestureInfo(text) {
        if (this.gestureInfo) {
            this.gestureInfo.textContent = text;
        }
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        // Remove event listeners
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
        document.removeEventListener('touchcancel', this.handleTouchCancel);

        // Clean up maps
        this.activeTouches.clear();
        this.dragGhosts.forEach(ghost => ghost.remove());
        this.dragGhosts.clear();
        this.itemTouches.clear();
        this.itemGestures.clear();
        this.dragOperations.clear();

        console.log('🗑️  MultiTouch Manager destroyed');
    }
}
