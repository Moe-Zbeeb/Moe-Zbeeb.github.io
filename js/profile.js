const sectionLinks = document.querySelectorAll('.section-nav a');

function updateSectionNavigation() {
  if (window.location.hash === '#writing') {
    window.location.replace('/blog.html');
    return;
  }

  const target = document.getElementById(window.location.hash.slice(1) || 'bio');
  const section = target?.closest('section[id]');
  const activeSection = section ? `#${section.id}` : '#bio';

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
