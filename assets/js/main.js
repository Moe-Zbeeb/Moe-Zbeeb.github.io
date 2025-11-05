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
  const palette = {
    success: '#388e3c',
    error: '#c62828',
    info: '#2c71b6'
  };
  const background = palette[type] || palette.success;

  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: ${background};
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

  initSubmissionDesk();
});

function initSubmissionDesk() {
  const form = document.getElementById('submission-form');
  const dropzone = document.getElementById('submission-dropzone');
  const fileInput = document.getElementById('submission-file');
  const fileList = document.getElementById('submission-file-list');
  const clearButton = document.getElementById('submission-clear');
  const messageField = document.getElementById('submission-message');
  if (!form || !dropzone || !fileInput || !fileList) {
    return;
  }

  const browseButton = dropzone.querySelector('.dropzone-browse');
  let selectedFiles = [];
  const allowedExtensions = /\.pdf$/i;

  function formatFileSize(bytes) {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.max(bytes / 1024, 0.1).toFixed(1)} KB`;
  }

  function syncFileInput() {
    const dataTransfer = new DataTransfer();
    selectedFiles.forEach(file => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;
  }

  function renderFileList() {
    fileList.innerHTML = '';
    if (!selectedFiles.length) {
      const empty = document.createElement('li');
      empty.className = 'file-list-empty';
      empty.textContent = 'No files added yet.';
      fileList.appendChild(empty);
      return;
    }

    selectedFiles.forEach((file, index) => {
      const item = document.createElement('li');
      const name = document.createElement('span');
      name.className = 'file-name';
      name.textContent = `${file.name} (${formatFileSize(file.size)})`;

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'file-remove';
      removeButton.textContent = 'Remove';
      removeButton.addEventListener('click', () => {
        selectedFiles.splice(index, 1);
        syncFileInput();
        renderFileList();
      });

      item.appendChild(name);
      item.appendChild(removeButton);
      fileList.appendChild(item);
    });
  }

  function handleNewFiles(fileListLike) {
    const incoming = Array.from(fileListLike || []);
    if (!incoming.length) {
      return;
    }

    let rejectedCount = 0;
    incoming.forEach(file => {
      if (!allowedExtensions.test(file.name)) {
        rejectedCount += 1;
        return;
      }
      const duplicate = selectedFiles.some(existing =>
        existing.name === file.name &&
        existing.size === file.size &&
        existing.lastModified === file.lastModified
      );
      if (!duplicate) {
        selectedFiles.push(file);
      }
    });

    syncFileInput();
    renderFileList();

    if (rejectedCount > 0) {
      showNotification(`${rejectedCount} file(s) were skipped — only PDF format is supported.`, 'error');
    }
  }

  dropzone.addEventListener('dragover', event => {
    event.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', event => {
    event.preventDefault();
    dropzone.classList.remove('drag-over');
  });

  dropzone.addEventListener('drop', event => {
    event.preventDefault();
    dropzone.classList.remove('drag-over');
    handleNewFiles(event.dataTransfer.files);
  });

  dropzone.addEventListener('click', () => fileInput.click());

  if (browseButton) {
    browseButton.addEventListener('click', event => {
      event.preventDefault();
      fileInput.click();
    });
  }

  fileInput.addEventListener('change', event => {
    handleNewFiles(event.target.files);
    // Clear value so the same file can be re-selected if needed
    fileInput.value = '';
  });

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      selectedFiles = [];
      syncFileInput();
      renderFileList();
    });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!selectedFiles.length) {
      showNotification('Please add at least one SOP or paper before composing your email.', 'error');
      return;
    }

    const subject = encodeURIComponent('SOP or Paper Review Submission');
    const fileLines = selectedFiles.map(file => `- ${file.name} (${formatFileSize(file.size)})`);
    const message = messageField ? messageField.value.trim() : '';

    const bodySegments = [
      'Hello LAIN team,',
      '',
      'I am submitting the following document(s) for review:',
      ...(fileLines.length ? fileLines : ['- (files listed above)']),
      ''
    ];

    if (message) {
      bodySegments.push('Cover note:', message, '');
    }

    bodySegments.push(
      'Primary goal:',
      'Target program or venue:',
      'Specific questions:',
      '',
      'Thank you for your time.'
    );

    const body = encodeURIComponent(bodySegments.join('\n'));
    const mailtoLink = `mailto:mbz02@mail.aub.edu?subject=${subject}&body=${body}`;
    showNotification('Opening your email app — please attach the files listed before sending.', 'info');
    window.location.href = mailtoLink;
  });

  renderFileList();
}
