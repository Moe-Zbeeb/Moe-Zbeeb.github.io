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

const publicationFilters = document.querySelector('.publication-filters');
const publicationItems = document.querySelectorAll('.publication-item');
const publicationStatus = document.querySelector('#publication-status');

if (publicationFilters && publicationStatus) {
  publicationFilters.hidden = false;
  const filterButtons = publicationFilters.querySelectorAll('button');

  for (const button of filterButtons) {
    button.addEventListener('click', () => {
      const topic = button.dataset.publicationFilter;
      let visibleCount = 0;

      for (const filterButton of filterButtons) {
        filterButton.setAttribute('aria-pressed', String(filterButton === button));
      }

      for (const item of publicationItems) {
        item.hidden = topic !== 'all' && !item.dataset.topics.split(' ').includes(topic);
        if (!item.hidden) visibleCount += 1;
      }

      publicationStatus.textContent = topic === 'all'
        ? `Showing all ${visibleCount} publications.`
        : `Showing ${visibleCount} ${visibleCount === 1 ? 'publication' : 'publications'} for ${button.textContent.trim()}.`;
    });
  }
}
