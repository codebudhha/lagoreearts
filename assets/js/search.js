/**
 * Lagoree Arts - Live Search & Discovery Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('searchPageInput') || document.querySelector('.search-input, input[name="q"]');
  const resultsGrid = document.getElementById('searchResultsGrid') || document.querySelector('.search-results-grid');
  const resultsMeta = document.getElementById('searchResultsMeta');

  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';

  if (searchInput && initialQuery) {
    searchInput.value = initialQuery;
  }

  async function performSearch(query) {
    if (!resultsGrid) return;

    if (!query || !query.trim()) {
      resultsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--muted);">
          Enter an artist name, style (e.g., Tanjore, Pichwai, Bronze), or medium above to explore.
        </div>
      `;
      if (resultsMeta) resultsMeta.textContent = '';
      return;
    }

    resultsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--muted); font-family: 'Cormorant Garamond', serif; font-size: 22px;">
        Searching the royal atelier registry for "${query}"...
      </div>
    `;

    const res = await window.LagoreeAPI.products.list({ q: query.trim(), limit: 16 });

    if (!res.success || !res.data || res.data.length === 0) {
      resultsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 26px; color: var(--forest); margin-bottom: 8px;">No Masterpieces Found for "${query}"</h3>
          <p style="color: var(--muted); font-size: 14px; max-width: 440px; margin: 0 auto 20px;">Try searching for "Tanjore", "Pichwai", "Gold", "Nataraja", or "Bronze".</p>
        </div>
      `;
      if (resultsMeta) resultsMeta.textContent = `0 results found for "${query}"`;
      return;
    }

    if (resultsMeta) {
      resultsMeta.textContent = `Found ${res.data.length} masterpiece${res.data.length > 1 ? 's' : ''} for "${query}"`;
    }

    resultsGrid.innerHTML = res.data.map(p => `
      <article class="plate prod-card" data-id="${p.id}" data-slug="${p.slug}" style="background: #fff;">
        <a href="/product?slug=${p.slug}" style="display: block; aspect-ratio: 4/5; overflow: hidden; background: #eee;">
          <img src="${p.images[0] || ''}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: cover;">
        </a>
        <div style="padding: 14px 8px;">
          <span style="font-size: 10px; color: var(--gold); text-transform: uppercase; letter-spacing: 0.2em;">${p.artist_name || 'Masterpiece'}</span>
          <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 18px; margin: 4px 0;">
            <a href="/product?slug=${p.slug}" style="color: var(--forest);">${p.title}</a>
          </h3>
          <div style="font-size: 12px; color: var(--muted);">${p.medium}</div>
          <div style="font-size: 16px; font-weight: 600; color: var(--forest); margin-top: 6px;">${window.formatINR(p.sale_price || p.base_price)}</div>
        </div>
      </article>
    `).join('');
  }

  if (initialQuery) {
    performSearch(initialQuery);
  }

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        performSearch(e.target.value);
      }, 350);
    });
  }
});
