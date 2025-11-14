/**
 * Router - URL management with history.pushState()
 */

export class Router {
    constructor(uiManager, animationManager, serviceNodes) {
        this.uiManager = uiManager;
        this.animationManager = animationManager;
        this.serviceNodes = serviceNodes;

        this.currentPath = '/';
        this.init();
    }

    init() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', this.handlePopState.bind(this));

        // Check initial URL on load
        this.handleInitialRoute();
    }

    /**
     * Handle initial route on page load
     */
    handleInitialRoute() {
        const path = window.location.pathname;

        if (path === '/' || path === '') {
            // Home page
            this.currentPath = '/';
        } else if (path.startsWith('/service/')) {
            // Service page
            const serviceId = path.replace('/service/', '');
            this.navigateToService(serviceId, false);
        }
    }

    /**
     * Navigate to a service (open modal and update URL)
     */
    navigateToService(serviceId, updateHistory = true) {
        const node = this.serviceNodes.getNodeById(serviceId);

        if (!node) {
            console.error(`Service not found: ${serviceId}`);
            return;
        }

        // Update URL
        const newPath = `/service/${serviceId}`;
        if (updateHistory) {
            window.history.pushState({ serviceId }, '', newPath);
        }
        this.currentPath = newPath;

        // Animate camera to node
        this.animationManager.focusOnNode(node.position, () => {
            // Open modal after camera animation
            this.uiManager.openModal(serviceId);
        });
    }

    /**
     * Navigate to home
     */
    navigateToHome(updateHistory = true) {
        // Update URL
        if (updateHistory) {
            window.history.pushState({}, '', '/');
        }
        this.currentPath = '/';

        // Close modal
        this.uiManager.closeCurrentModal(() => {
            // Animate camera back to home
            this.animationManager.returnToHome();
        });
    }

    /**
     * Handle browser back/forward buttons
     */
    handlePopState(event) {
        const path = window.location.pathname;

        if (path === '/' || path === '') {
            // Navigate to home
            this.navigateToHome(false);
        } else if (path.startsWith('/service/')) {
            // Navigate to service
            const serviceId = path.replace('/service/', '');
            this.navigateToService(serviceId, false);
        }
    }

    /**
     * Get current path
     */
    getCurrentPath() {
        return this.currentPath;
    }

    dispose() {
        window.removeEventListener('popstate', this.handlePopState);
    }
}
