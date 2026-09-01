/**
 * Lagoree Arts - Private Wishlist Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const wishlistGrid = document.getElementById('wishlistGrid') || document.querySelector('.wishlist-grid');
  if (!wishlistGrid) return;

  if (!window.LagoreeAPI.auth.isLoggedIn()) {
    wishlistGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 80px 20px;">
        <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 28px; color: var(--forest); margin-bottom: 8px;">Private Collector Wishlist</h3>
        <p style="color: var(--muted); font-size: 14px; max-width: 440px; margin: 0 auto 24px;">Please sign in to access and curate your private sanctuary of saved masterpieces.</p>
        <a href="/login?redirect=/wishlist" class="btn primary">Sign In to Account</a>
      </div>
    `;
    return;
  }

  async function loadWishlist() {
    const res = await window.LagoreeAPI.wishlist.get();
    if (!res.success || !res.wishlist || res.wishlist.length === 0) {
      wishlistGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 80px 20px;">
          <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 28px; color: var(--forest); margin-bottom: 8px;">Your Private Wishlist is Empty</h3>
          <p style="color: var(--muted); font-size: 14px; max-width: 440px; margin: 0 auto 24px;">Browse our curated catalog and tap the heart icon on any artwork to save it here.</p>
          <a href="/category" class="btn primary">Discover Artworks</a>
        </div>
      `;
      return;
    }

    wishlistGrid.innerHTML = res.wishlist.map(p => `
      <div class="plate prod-card" data-id="${p.id}" style="background: var(--white); padding: 12px;">
        <a href="/product?slug=${p.slug}" style="display: block; aspect-ratio: 4/5; overflow: hidden; background: #eee;">
          <img src="${p.images[0] || ''}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: cover;">
        </a>

        <div style="padding: 16px 6px 6px;">
          <span style="font-size: 10px; color: var(--gold); text-transform: uppercase; letter-spacing: 0.2em;">${p.artist_name || 'Masterpiece'}</span>
          <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 20px; margin: 4px 0;">
            <a href="/product?slug=${p.slug}" style="color: var(--forest);">${p.title}</a>
          </h3>
          <div style="font-size: 12px; color: var(--muted);">${p.medium}</div>
          <div style="font-size: 16px; font-weight: 600; color: var(--forest); margin-top: 8px;">${window.formatINR(p.sale_price || p.base_price)}</div>

          <div style="margin-top: 14px; display: flex; gap: 8px;">
            <button class="move-to-cart-btn btn primary" data-id="${p.id}" style="flex: 1; padding: 10px; font-size: 10px;">Move to Bag</button>
            <button class="remove-wishlist-btn btn ghost" data-id="${p.id}" style="padding: 10px; font-size: 10px;">Remove</button>
          </div>
        </div>
      </div>
    `).join('');

    wishlistGrid.querySelectorAll('.move-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        btn.textContent = 'Moving...';
        btn.disabled = true;
        await window.LagoreeAPI.wishlist.moveToCart(id);
        loadWishlist();
      });
    });

    wishlistGrid.querySelectorAll('.remove-wishlist-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        await window.LagoreeAPI.wishlist.toggle(id);
        loadWishlist();
      });
    });
  }

  loadWishlist();
});
