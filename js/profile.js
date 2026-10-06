const sectionLinks = document.querySelectorAll('.section-nav a');

function updateSectionNavigation() {
  const activeSection = window.location.hash || '#bio';

  for (const link of sectionLinks) {
    if (link.hash === activeSection) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  }
}

window.addEventListener('hashchange', updateSectionNavigation);
updateSectionNavigation();
