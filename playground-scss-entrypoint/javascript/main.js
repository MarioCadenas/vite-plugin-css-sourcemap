/**
 * Main JavaScript entrypoint.
 * In a traditional server-rendered setup, this file contains
 * the JS logic, while CSS is loaded separately via <link> tags.
 */

console.log('Main JS loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM ready');

  const buttons = document.querySelectorAll('.btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      console.log('Button clicked:', btn.textContent);
    });
  });
});
