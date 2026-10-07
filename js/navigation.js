const navigationToggle = document.querySelector('.nav-toggle');
const navigationMenu = document.getElementById('nav-main');

if (navigationToggle && navigationMenu) {
  navigationToggle.addEventListener('click', () => {
    const expanded = navigationToggle.getAttribute('aria-expanded') === 'true';
    navigationToggle.setAttribute('aria-expanded', String(!expanded));
    navigationMenu.classList.toggle('is-open', !expanded);
  });

  navigationMenu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      navigationToggle.setAttribute('aria-expanded', 'false');
      navigationMenu.classList.remove('is-open');
      navigationToggle.focus();
    }
  });
}
