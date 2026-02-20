/**
 * Shared tab switcher.
 * 
 * Import this file from any page that uses .tab-btn / [data-tab-content].
 * Uses event delegation so it works with dynamically rendered content.
 * 
 * Scoping: If the tab button lives inside a [data-season] div, the switcher
 * only affects tab content within that same season div. Otherwise it affects
 * all [data-tab-content] elements in the document.
 * 
 * Usage in an Astro page:
 *   <script>
 *     import '../scripts/tabSwitcher';
 *   </script>
 * 
 * Expected markup:
 *   <button class="tab-btn" data-tab="overall">Overall</button>
 *   <div data-tab-content="overall">...</div>
 */

document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('.tab-btn');
  if (!btn) return;

  const tab = btn.dataset.tab;
  if (!tab) return;

  // Scope to the nearest season container, or fall back to the whole document
  const scope = btn.closest<HTMLElement>('[data-season]') || document;

  // Update button styles
  scope.querySelectorAll<HTMLElement>('.tab-btn').forEach(b => {
    b.classList.remove('border-pul-black', 'text-pul-black');
    b.classList.add('border-transparent', 'text-pul-gray');
  });
  btn.classList.remove('border-transparent', 'text-pul-gray');
  btn.classList.add('border-pul-black', 'text-pul-black');

  // Show/hide tab content
  scope.querySelectorAll<HTMLElement>('[data-tab-content]').forEach(content => {
    content.classList.toggle('hidden', content.dataset.tabContent !== tab);
  });
});