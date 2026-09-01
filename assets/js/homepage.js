/**
 * Lagoree Arts - Homepage Dynamic Highlights Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const featuredContainer = document.getElementById('featuredArtworksGrid') || document.querySelector('.featured-grid, .curated-drops-grid');
  if (!featuredContainer) return;

  try {
    const res = await window.LagoreeAPI.products.list({ featured: true, limit: 6 });
    if (res.success && res.data && res.data.length > 0) {
      featuredContainer.innerHTML = res.data.map(p => `
        <article class="plate prod-card" data-id="${p.id}" data-slug="${p.slug}">
          <a href="/product?slug=${p.slug}" class="canvas-wrap" style="display: block; position: relative; aspect-ratio: 4/5; overflow: hidden; background: #E8E2D8;">
            <img src="${p.images[0] || ''}" alt="${p.title}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">
            <span class="eyebrow" style="position: absolute; top: 12px; left: 12px; background: rgba(18, 53, 36, 0.85); color: #FCFBF8; padding: 4px 8px; font-size: 9px; backdrop-filter: blur(4px);">Curator's Choice</span>
          </a>

          <div style="padding: 16px 12px 12px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span class="eyebrow" style="font-size: 10px; color: var(--gold);">${p.artist_name || 'Guild Master'}</span>
              <span style="font-size: 11px; color: var(--muted);">${p.dimensions.split('(')[0].trim()}</span>
            </div>

            <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 18px; line-height: 1.25; margin: 2px 0;">
              <a href="/product?slug=${p.slug}" style="color: var(--forest);">${p.title}</a>
            </h3>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--stone);">
              <span style="font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; color: var(--forest);">${window.formatINR(p.sale_price || p.base_price)}</span>
              <a href="/product?slug=${p.slug}" class="btn primary" style="padding: 6px 14px; font-size: 10px;">Acquire</a>
            </div>
          </div>
        </article>
      `).join('');
    }
  } catch (e) {
    console.warn('Homepage featured load error:', e);
  }
});
