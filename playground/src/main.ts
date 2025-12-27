// Test Case: Multiple CSS files imported in JS
// This tests the plugin's ability to merge sourcemaps from multiple CSS files

// Base styles
import './styles/variables.css';
import './styles/reset.css';

// Layout styles
import './styles/layout/container.css';
import './styles/layout/grid.css';

// Component styles
import './styles/components/button.css';
import './styles/components/card.css';
import './styles/components/form.css';
import './styles/components/modal.css';

// Utility styles
import './styles/utilities.css';
import './styles/animations.css';

// Original styles
import './styles/main.css';
import './styles/second.css';

console.log('Playground loaded with all CSS imports');

// Demo: Show a modal
document.addEventListener('DOMContentLoaded', () => {
  const openModalBtn = document.querySelector('[data-open-modal]');
  const closeModalBtn = document.querySelector('[data-close-modal]');
  const modalOverlay = document.querySelector('.modal-overlay');

  openModalBtn?.addEventListener('click', () => {
    modalOverlay?.classList.add('is-visible');
  });

  closeModalBtn?.addEventListener('click', () => {
    modalOverlay?.classList.remove('is-visible');
  });

  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('is-visible');
    }
  });
});
