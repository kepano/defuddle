import { searchIndex } from './docs-data';

export const searchTrigger = `<button class="header-action filter-search-trigger" type="button" aria-label="Search documentation" aria-haspopup="dialog" aria-controls="search-dialog" aria-expanded="false" data-search-trigger>
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.3-4.3"></path>
  </svg>
  <span>Search</span>
  <kbd>⌘K</kbd>
</button>`;

export function getSearchHTML(): string {
	return `<div class="command-backdrop" data-search-backdrop hidden>
  <section class="command-palette" id="search-dialog" role="dialog" aria-modal="true" aria-label="Search Defuddle">
    <header>
      <span aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </svg>
      </span>
      <input type="search" role="combobox" aria-autocomplete="list" aria-expanded="true" autocomplete="off" spellcheck="false" placeholder="Search documentation…" aria-label="Search documentation" aria-controls="search-results" data-search-input />
      <button class="command-search-clear" type="button" aria-label="Clear search" data-search-clear hidden>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>
      </button>
    </header>
    <div class="command-results" id="search-results" role="listbox" data-search-results></div>
  </section>
</div>
<script id="search-index" type="application/json">${JSON.stringify(searchIndex).replaceAll('<', '\\u003c')}</script>`;
}
