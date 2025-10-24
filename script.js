/**
 * Research Collaboration Lab - JavaScript
 * Handles interactive features and user interactions
 */

// ========== MODAL FUNCTIONS ==========

/**
 * Open application modal for a specific project
 * @param {string} projectId - The ID of the project to apply for
 */
function openApplication(projectId) {
    // Map project IDs to project names
    const projectNames = {
        'ML-Medicine': 'Machine Learning في الطب الحديث',
        'Sustainability-LB': 'تحليل التنمية المستدامة في لبنان',
        'NLP-Arabic': 'معالجة اللغة الطبيعية - العربية'
    };

    const modal = document.getElementById('applicationModal');
    const projectNameElement = document.getElementById('projectName');

    projectNameElement.textContent = `تقديم طلب الالتحاق بـ: ${projectNames[projectId] || 'المشروع'}`;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the application modal
 */
function closeModal() {
    const modal = document.getElementById('applicationModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

/**
 * Handle modal close when clicking outside the modal content
 */
window.onclick = function(event) {
    const modal = document.getElementById('applicationModal');
    if (event.target === modal) {
        closeModal();
    }
}

// ========== FORM SUBMISSION HANDLERS ==========

/**
 * Handle application form submission
 * @param {Event} event - The form submission event
 */
function handleApplicationSubmit(event) {
    event.preventDefault();

    // Get form data
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name') || event.target.querySelector('input[type="text"]').value,
        email: formData.get('email') || event.target.querySelector('input[type="email"]').value,
        institution: formData.get('institution') || event.target.querySelectorAll('input[type="text"]')[1].value,
        experience: event.target.querySelector('textarea').value,
        profile: event.target.querySelector('input[type="url"]').value
    };

    // Validate form data
    if (!data.email || !data.name) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    // Log form data (in real app, send to server)
    console.log('Application submitted:', data);

    // Show success message
    showNotification('تم استقبال طلبك بنجاح! سيتواصل معك الفريق قريباً', 'success');

    // Reset form and close modal
    event.target.reset();
    closeModal();
}

/**
 * Handle newsletter form submission
 * @param {Event} event - The form submission event
 */
function handleNewsletterSubmit(event) {
    event.preventDefault();

    // Get form inputs
    const emailInput = event.target.querySelector('input[type="email"]');
    const nameInput = event.target.querySelector('input[type="text"]');
    const email = emailInput.value.trim();
    const name = nameInput.value.trim();

    // Validate email
    if (!email || !name) {
        alert('يرجى إدخال البريد الإلكتروني والاسم');
        return;
    }

    // Log subscription (in real app, send to server)
    console.log('Newsletter subscription:', { name, email });

    // Show success message
    showNotification(`شكراً ${name}! تم اشتراكك بنجاح في النشرة البريدية`, 'success');

    // Reset form
    event.target.reset();
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Show a notification message to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success', 'error', 'info')
 * @param {number} duration - Duration in milliseconds (default 3000)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        right: 20px;
        max-width: 500px;
        padding: 16px 20px;
        background-color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideInDown 0.3s ease;
        z-index: 10000;
        font-weight: 500;
    `;

    // Add to DOM
    document.body.appendChild(notification);

    // Remove after duration
    setTimeout(() => {
        notification.style.animation = 'slideOutUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/**
 * Smooth scroll to a section
 * @param {string} sectionId - The ID of the section to scroll to
 */
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Add animation styles to the document
 */
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes slideOutUp {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-20px);
            }
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        .notification {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .notification-success {
            background-color: #28a745 !important;
        }

        .notification-error {
            background-color: #dc3545 !important;
        }

        .notification-info {
            background-color: #17a2b8 !important;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Initialize event listeners and interactions
 */
function initializeApp() {
    // Add animation styles
    addAnimationStyles();

    // Add smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Add keyboard event listener for modal
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    // Lazy load images if any
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
    }

    // Add active class to nav links based on scroll position
    updateActiveNavLink();
    window.addEventListener('scroll', updateActiveNavLink);

    console.log('Research Collaboration Lab initialized successfully');
}

/**
 * Update active navigation link based on scroll position
 */
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 100) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        const href = link.getAttribute('href').substring(1);
        if (href === current) {
            link.style.color = 'var(--accent)';
        } else {
            link.style.color = 'var(--primary)';
        }
    });
}

/**
 * Add active form handlers
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();

    // Form validation
    const applicationForm = document.querySelector('.modal-content form');
    if (applicationForm) {
        applicationForm.addEventListener('submit', handleApplicationSubmit);
    }

    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }
});

// ========== EXPORT FUNCTIONS FOR EXTERNAL USE ==========
// These functions are available globally for HTML onclick handlers
window.openApplication = openApplication;
window.closeModal = closeModal;
window.handleApplicationSubmit = handleApplicationSubmit;
window.handleNewsletterSubmit = handleNewsletterSubmit;
window.scrollToSection = scrollToSection;
