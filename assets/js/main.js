/**
 * Research Collaboration Lab - Main JavaScript
 * Handles interactive features and form submissions
 */

// Handle newsletter form submission
function handleNewsletterSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const inputs = form.querySelectorAll('.form-input');
  const email = inputs[0].value.trim();
  const name = inputs[1].value.trim();

  // Validate
  if (!email || !name) {
    alert('Please fill in all fields');
    return;
  }

  // Log subscription (in production, send to server)
  console.log('Newsletter subscription:', { name, email });

  // Show success message
  showNotification(`Thanks ${name}! You've been subscribed to our newsletter.`);

  // Reset form
  form.reset();
}

// Show notification message
function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #388e3c;
    color: white;
    padding: 1em 1.5em;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    font-weight: 500;
  `;
  notification.textContent = message;

  // Add animation styles
  const style = document.createElement('style');
  if (!document.getElementById('notification-styles')) {
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes slideOut {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(20px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Add to page
  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('Research Lab initialized');

  // Add smooth scroll behavior for internal links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#' && document.querySelector(href)) {
        e.preventDefault();
        document.querySelector(href).scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});
