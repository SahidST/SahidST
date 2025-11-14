/**
 * UI Manager - Modal management and GSAP animations
 */

export class UIManager {
    constructor() {
        this.heroSection = document.getElementById('hero-section');
        this.modalsContainer = document.getElementById('modals-container');
        this.currentModal = null;

        this.init();
    }

    init() {
        // Setup close buttons for all modals
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.closeCurrentModal();
            });
        });

        // Setup form submission
        const auditForm = document.getElementById('audit-form');
        if (auditForm) {
            auditForm.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.closeCurrentModal();
            }
        });
    }

    /**
     * Show hero section with fade-in animation
     */
    showHero() {
        if (!this.heroSection) return;

        gsap.to(this.heroSection, {
            opacity: 1,
            duration: 1,
            delay: 0.5,
            ease: 'power2.out'
        });
    }

    /**
     * Hide hero section
     */
    hideHero() {
        if (!this.heroSection) return;

        gsap.to(this.heroSection, {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.in'
        });
    }

    /**
     * Open a service modal with GSAP animation
     */
    openModal(serviceId, onComplete = null) {
        // Hide hero
        this.hideHero();

        // Find modal
        const modal = document.getElementById(`modal-${serviceId}`);
        if (!modal) {
            console.error(`Modal not found: modal-${serviceId}`);
            return;
        }

        this.currentModal = modal;

        // Show modal with animation
        gsap.fromTo(
            modal,
            {
                opacity: 0,
                scale: 0.9,
                y: 50
            },
            {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.6,
                ease: 'back.out(1.2)',
                onStart: () => {
                    modal.classList.add('active');
                },
                onComplete: () => {
                    if (onComplete) onComplete();
                }
            }
        );

        // Animate modal content children with stagger
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            const children = modalContent.querySelectorAll('h2, p, ul, .tech-badge, .process-step, .portfolio-item, form, .bg-\\[\\#0a192f\\]\\/50');

            gsap.fromTo(
                children,
                {
                    opacity: 0,
                    y: 20
                },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.4,
                    stagger: 0.05,
                    delay: 0.3,
                    ease: 'power2.out'
                }
            );
        }
    }

    /**
     * Close current modal
     */
    closeCurrentModal(onComplete = null) {
        if (!this.currentModal) return;

        const modal = this.currentModal;

        gsap.to(modal, {
            opacity: 0,
            scale: 0.9,
            y: 50,
            duration: 0.4,
            ease: 'power2.in',
            onComplete: () => {
                modal.classList.remove('active');
                this.currentModal = null;

                // Show hero again
                this.showHero();

                if (onComplete) onComplete();
            }
        });
    }

    /**
     * Handle form submission
     */
    handleFormSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        // Get form values
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            website: formData.get('website'),
            message: formData.get('message')
        };

        // For demo purposes, just log and show success message
        console.log('Form submitted:', data);

        // Show success message
        this.showSuccessMessage();

        // Reset form
        form.reset();
    }

    /**
     * Show success message after form submission
     */
    showSuccessMessage() {
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 z-50 px-6 py-4 bg-[#00ff8a] text-[#05080f] rounded-lg shadow-lg font-semibold';
        successMessage.textContent = 'Thank you! We\'ll be in touch soon.';
        document.body.appendChild(successMessage);

        // Animate in
        gsap.fromTo(
            successMessage,
            {
                opacity: 0,
                x: 100
            },
            {
                opacity: 1,
                x: 0,
                duration: 0.5,
                ease: 'back.out(1.5)'
            }
        );

        // Remove after 3 seconds
        setTimeout(() => {
            gsap.to(successMessage, {
                opacity: 0,
                x: 100,
                duration: 0.5,
                ease: 'power2.in',
                onComplete: () => {
                    successMessage.remove();
                }
            });
        }, 3000);
    }

    /**
     * Get current modal ID
     */
    getCurrentModalId() {
        if (!this.currentModal) return null;
        return this.currentModal.dataset.service;
    }

    dispose() {
        // Cleanup
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.removeEventListener('click', this.closeCurrentModal);
        });
    }
}
