/* LUXORA — search.js
   Small enhancement layer on top of the search overlay defined in app.js:
   arrow-key navigation between result cards/chips and a clear-search
   control. Kept separate so search behavior is easy to extend in isolation. */

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('globalSearchInput');
    const overlay = document.getElementById('searchOverlay');
    if (!input || !overlay) return;

    let focusables = [];
    let cursor = -1;

    function refreshFocusables(){
      focusables = Array.from(overlay.querySelectorAll('.search-result-row, .chip'));
      cursor = -1;
    }

    // Recompute focusable list whenever the overlay's content changes
    const observer = new MutationObserver(Utils.debounce(refreshFocusables, 150));
    observer.observe(document.getElementById('searchBody'), { childList: true, subtree: true });

    input.addEventListener('keydown', (e) => {
      if (!focusables.length) return;
      if (e.key === 'ArrowDown'){ e.preventDefault(); cursor = Math.min(focusables.length - 1, cursor + 1); focusables[cursor]?.focus(); }
      else if (e.key === 'ArrowUp'){ e.preventDefault(); cursor = Math.max(0, cursor - 1); focusables[cursor]?.focus(); }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value === ''){ /* nothing extra — default behavior is fine */ }
    });
  });
})();
