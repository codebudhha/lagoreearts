/**
 * Lagoree Arts - Category & Catalog Dynamic Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const productGrid = document.getElementById('productGrid') || document.querySelector('.product-grid, .catalog-grid, .artworks-grid');
  if (!productGrid) return;

  const urlParams = new URLSearchParams(window.location.search);
  let currentCategory = urlParams.get('category') || '';
  let currentArtist = urlParams.get('artist') || '';
  let currentSort = urlParams.get('sort') || 'newest';
  let currentOrientation = urlParams.get('orientation') || '';
  let currentMedium = urlParams.get('medium') || '';
  let currentMinPrice = urlParams.get('minPrice') || '';
  let currentMaxPrice = urlParams.get('maxPrice') || '';
  let currentQuery = urlParams.get('q') || '';
  let currentPage = parseInt(urlParams.get('page')) || 1;

  // Render Category Header if present
  if (currentCategory) {
    try {
      const catRes = await window.LagoreeAPI.products.categories();
      if (catRes.success && catRes.categories) {
        const activeCat = catRes.categories.find(c => c.slug === currentCategory || c.id == currentCategory);
        if (activeCat) {
          const titleEl = document.querySelector('.category-title, .page-header h1, #categoryHeading');
          const descEl = document.querySelector('.category-description, .page-header p, #categorySub');
          if (titleEl) titleEl.textContent = activeCat.name;
          if (descEl) descEl.textContent = activeCat.description;
        }
      }
    } catch (e) {
      console.warn('Category fetch error:', e);
    }
  }

  // Load products
  async function loadCatalog() {
    productGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 60px 0; text-align: center; color: var(--muted); font-family: 'Cormorant Garamond', serif; font-size: 24px;">
        Curating masterpieces from royal ateliers...
      </div>
    `;

    const params = {
      page: currentPage,
      limit: 12,
      sort: currentSort
    };
    if (currentCategory) params.category = currentCategory;
    if (currentArtist) params.artist = currentArtist;
    if (currentOrientation) params.orientation = currentOrientation;
    if (currentMedium) params.medium = currentMedium;
    if (currentMinPrice) params.minPrice = currentMinPrice;
    if (currentMaxPrice) params.maxPrice = currentMaxPrice;
    if (currentQuery) params.q = currentQuery;

    const res = await window.LagoreeAPI.products.list(params);
    if (!res.success || !res.data || res.data.length === 0) {
      productGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 80px 0; text-align: center;">
          <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 28px; color: var(--forest); margin-bottom: 12px;">No Masterpieces Match Your Selection</h3>
          <p style="color: var(--muted); max-width: 480px; margin: 0 auto 24px; font-size: 14px;">Try adjusting your filters or search criteria to explore our broader heritage salon collection.</p>
          <button class="btn ghost" onclick="window.location.href='/category'">Reset All Filters</button>
        </div>
      `;
      return;
    }

    // Update item counter
    const countEl = document.querySelector('.catalog-count, #resultsCount');
    if (countEl) {
      countEl.textContent = `Showing ${res.data.length} of ${res.pagination.total} artworks`;
    }

    // Render Cards
    productGrid.innerHTML = res.data.map(product => {
      const mainImg = product.images && product.images.length > 0 ? product.images[0] : '';
      const priceDisplay = window.formatINR(product.sale_price || product.base_price);
      const originalPrice = product.sale_price ? `<span style="text-decoration: line-through; color: var(--muted); font-size: 13px; margin-left: 8px;">${window.formatINR(product.base_price)}</span>` : '';

      return `
        <article class="prod-card plate" data-id="${product.id}" data-slug="${product.slug}">
          <a href="/product?slug=${product.slug}" class="canvas-wrap" style="display: block; position: relative; aspect-ratio: 4/5; overflow: hidden; background: #E8E2D8;">
            <img src="${mainImg}" alt="${product.title}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">
            ${product.is_featured ? `<span class="eyebrow" style="position: absolute; top: 12px; left: 12px; background: rgba(18, 53, 36, 0.85); color: #FCFBF8; padding: 4px 8px; font-size: 9px; backdrop-filter: blur(4px);">Curator's Choice</span>` : ''}
            ${product.is_antique ? `<span class="eyebrow" style="position: absolute; top: 12px; right: 12px; background: rgba(198, 161, 91, 0.9); color: #123524; padding: 4px 8px; font-size: 9px; font-weight: 700;">Antique Artefact</span>` : ''}
          </a>

          <div style="padding: 16px 12px 12px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span class="eyebrow" style="font-size: 10px; color: var(--gold);">${product.artist_name || 'Lagoree Guild Master'}</span>
              <span style="font-size: 11px; color: var(--muted);">${product.dimensions.split('(')[0].trim()}</span>
            </div>

            <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 18px; line-height: 1.25; margin: 2px 0;">
              <a href="/product?slug=${product.slug}" style="color: var(--forest); transition: color 0.2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='var(--forest)'">${product.title}</a>
            </h3>

            <div style="font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${product.medium}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--stone);">
              <div>
                <span style="font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; color: var(--forest);">${priceDisplay}</span>
                ${originalPrice}
              </div>

              <div style="display: flex; gap: 8px;">
                <button class="wishlist-btn-icon" data-product-id="${product.id}" title="Save to Private Wishlist" style="background: none; border: 1px solid var(--stone); width: 32px; height: 32px; border-radius: 2px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>

                <button class="quick-add-btn" data-product-id="${product.id}" title="Add to Curated Bag" style="background: var(--forest); color: #FCFBF8; border: none; padding: 0 12px; height: 32px; border-radius: 2px; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background 0.2s;">
                  <span>Acquire</span>
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Bind Wishlist & Quick Add buttons
    bindCardActions();
  }

  function bindCardActions() {
    document.querySelectorAll('.wishlist-btn-icon').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pid = btn.dataset.productId;
        if (!window.LagoreeAPI.auth.isLoggedIn()) {
          window.LagoreeToast.show('Please log in to preserve items to your private wishlist.', 'info', 'Curator Access');
          setTimeout(() => window.location.href = '/login', 1500);
          return;
        }
        const res = await window.LagoreeAPI.wishlist.toggle(pid);
        if (res.success) {
          btn.style.color = res.isSaved ? '#C6A15B' : 'inherit';
          btn.style.borderColor = res.isSaved ? '#C6A15B' : 'var(--stone)';
        }
      });
    });

    document.querySelectorAll('.quick-add-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pid = btn.dataset.productId;
        btn.textContent = 'Acquiring...';
        btn.disabled = true;

        await window.LagoreeAPI.cart.add({
          productId: pid,
          quantity: 1
        });

        btn.innerHTML = '<span>Acquired ✓</span>';
        setTimeout(() => {
          btn.innerHTML = '<span>Acquire</span>';
          btn.disabled = false;
        }, 2000);
      });
    });
  }

  // Initial load
  loadCatalog();

  // Filter Event Listeners
  const sortSelect = document.getElementById('sortSelect') || document.querySelector('select[name="sort"]');
  if (sortSelect) {
    sortSelect.value = currentSort;
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      loadCatalog();
    });
  }
});
