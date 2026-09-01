/**
 * Lagoree Arts - Product Detail Page Dynamic PDP Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const identifier = urlParams.get('slug') || urlParams.get('id') || 'the-descent-of-saraswati-tanjore-school';

  let currentProduct = null;
  let framingOptions = [];
  let selectedFraming = null;
  let selectedSize = 'Original Dimensions';
  let quantity = 1;

  async function loadProduct() {
    const res = await window.LagoreeAPI.products.get(identifier);
    if (!res.success || !res.product) {
      window.LagoreeToast.show('Artwork not found in atelier catalog.', 'error');
      return;
    }

    currentProduct = res.product;
    framingOptions = res.framingOptions || [];
    selectedFraming = framingOptions[0] || null;

    renderProductDetails();
    renderFramingOptions();
    renderReviews(res.reviews || []);
    renderRelated(res.related || []);
    updatePrice();
  }

  function renderProductDetails() {
    document.title = `${currentProduct.title} — Lagoree Arts`;

    // Title & Subtitles
    const titleEls = document.querySelectorAll('#pdpTitle, .product-title, .pdp-title, h1');
    if (titleEls.length > 0) titleEls[0].textContent = currentProduct.title;

    const artistEls = document.querySelectorAll('#pdpArtist, .product-artist, .artist-name');
    artistEls.forEach(el => el.textContent = currentProduct.artist_name || 'Royal Guild Master');

    const descEls = document.querySelectorAll('#pdpDescription, .product-description, #pdpStory');
    descEls.forEach(el => el.textContent = currentProduct.description);

    const mediumEls = document.querySelectorAll('#pdpMedium, .product-medium, [data-field="medium"]');
    mediumEls.forEach(el => el.textContent = currentProduct.medium);

    const dimEls = document.querySelectorAll('#pdpDimensions, .product-dimensions, [data-field="dimensions"]');
    dimEls.forEach(el => el.textContent = currentProduct.dimensions);

    const provEls = document.querySelectorAll('#pdpProvenance, .provenance-text, [data-field="provenance"]');
    provEls.forEach(el => el.textContent = currentProduct.provenance || 'Acquired directly from the master artisan atelier. Authenticated and sealed by Lagoree Arts.');

    // Gallery
    if (currentProduct.images && currentProduct.images.length > 0) {
      const mainImg = document.querySelector('#mainProductImage, .main-canvas-img, #mainCanvas img');
      if (mainImg) mainImg.src = currentProduct.images[0];

      const thumbsContainer = document.getElementById('galleryThumbs') || document.querySelector('.pdp-thumbs, .gallery-thumbs');
      if (thumbsContainer) {
        thumbsContainer.innerHTML = currentProduct.images.map((img, idx) => `
          <button class="thumb ${idx === 0 ? 'active' : ''}" data-idx="${idx}" style="border: 1px solid ${idx === 0 ? 'var(--gold)' : 'var(--stone)'}; padding: 4px; background: #fff; cursor: pointer; aspect-ratio: 1/1; width: 72px; overflow: hidden;">
            <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;">
          </button>
        `).join('');

        thumbsContainer.querySelectorAll('.thumb').forEach(th => {
          th.addEventListener('click', () => {
            const idx = th.dataset.idx;
            if (mainImg) mainImg.src = currentProduct.images[idx];
            thumbsContainer.querySelectorAll('.thumb').forEach(t => {
              t.classList.toggle('active', t === th);
              t.style.borderColor = t === th ? 'var(--gold)' : 'var(--stone)';
            });
          });
        });
      }
    }
  }

  function renderFramingOptions() {
    const frameContainer = document.getElementById('frameRow') || document.querySelector('.frame-options-grid, #framingOptions');
    if (!frameContainer || framingOptions.length === 0) return;

    frameContainer.innerHTML = framingOptions.map((opt, idx) => {
      const basePrice = currentProduct.sale_price || currentProduct.base_price;
      const extraCost = Math.round((basePrice * (opt.price_multiplier - 1)) + opt.price_adder);
      const costBadge = extraCost > 0 ? `+${window.formatINR(extraCost)}` : 'Included';

      return `
        <div class="frame-swatch ${idx === 0 ? 'active' : ''}" data-frame-id="${opt.id}" style="border: 1.5px solid ${idx === 0 ? 'var(--forest)' : 'var(--stone)'}; padding: 12px; border-radius: 2px; cursor: pointer; transition: all 0.2s; background: ${idx === 0 ? 'rgba(18, 53, 36, 0.04)' : 'transparent'};">
          <div style="font-weight: 600; font-size: 13px; color: var(--forest);">${opt.name}</div>
          <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">${opt.description || ''}</div>
          <div style="font-size: 11px; color: var(--gold); font-weight: 600; margin-top: 6px;">${costBadge}</div>
        </div>
      `;
    }).join('');

    frameContainer.querySelectorAll('.frame-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        const frameId = sw.dataset.frameId;
        selectedFraming = framingOptions.find(f => f.id == frameId);
        frameContainer.querySelectorAll('.frame-swatch').forEach(s => {
          const isActive = s === sw;
          s.classList.toggle('active', isActive);
          s.style.borderColor = isActive ? 'var(--forest)' : 'var(--stone)';
          s.style.background = isActive ? 'rgba(18, 53, 36, 0.04)' : 'transparent';
        });
        updatePrice();
      });
    });
  }

  function updatePrice() {
    if (!currentProduct) return;
    const base = currentProduct.sale_price || currentProduct.base_price;
    let frameCost = 0;

    if (selectedFraming) {
      frameCost = Math.round((base * (selectedFraming.price_multiplier - 1)) + selectedFraming.price_adder);
    }

    const unitTotal = (base + frameCost) * quantity;
    const priceEls = document.querySelectorAll('#pdpPrice, .product-price, .pdp-current-price');
    priceEls.forEach(el => el.textContent = window.formatINR(unitTotal));

    const breakdownEl = document.getElementById('priceBreakdown');
    if (breakdownEl) {
      breakdownEl.textContent = frameCost > 0 
        ? `Includes ${window.formatINR(base)} Artwork + ${window.formatINR(frameCost)} ${selectedFraming.name}`
        : 'Includes Archival Crate & Certificate';
    }
  }

  function renderReviews(reviews) {
    const reviewsContainer = document.getElementById('reviewsList') || document.querySelector('.reviews-list');
    if (!reviewsContainer) return;

    if (reviews.length === 0) {
      reviewsContainer.innerHTML = `<div style="color: var(--muted); padding: 20px 0;">Be the first distinguished collector to review this masterpiece.</div>`;
      return;
    }

    reviewsContainer.innerHTML = reviews.map(r => `
      <div style="padding: 20px 0; border-bottom: 1px solid var(--stone);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="font-family: 'Cormorant Garamond', serif; font-size: 18px; color: var(--forest);">${r.user_name}</strong>
          <span style="color: var(--gold); letter-spacing: 2px;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
        </div>
        ${r.title ? `<div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${r.title}</div>` : ''}
        <p style="color: var(--charcoal); font-size: 13px; line-height: 1.6;">${r.comment}</p>
        <span style="font-size: 11px; color: var(--muted); margin-top: 6px; display: inline-block;">Verified Acquisition • ${new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
      </div>
    `).join('');
  }

  function renderRelated(related) {
    const relatedGrid = document.getElementById('relatedGrid') || document.querySelector('.related-grid');
    if (!relatedGrid || related.length === 0) return;

    relatedGrid.innerHTML = related.map(p => `
      <div class="plate" style="background: var(--white); padding: 10px;">
        <a href="/product?slug=${p.slug}" style="display: block; aspect-ratio: 4/5; overflow: hidden; background: #eee;">
          <img src="${p.images[0] || ''}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: cover;">
        </a>
        <div style="padding: 12px 6px;">
          <div style="font-size: 10px; color: var(--gold); text-transform: uppercase; letter-spacing: 0.2em;">${p.artist_name || 'Masterpiece'}</div>
          <h4 style="font-size: 16px; margin: 4px 0;"><a href="/product?slug=${p.slug}" style="color: var(--forest);">${p.title}</a></h4>
          <div style="font-size: 14px; font-weight: 600; color: var(--forest); margin-top: 4px;">${window.formatINR(p.sale_price || p.base_price)}</div>
        </div>
      </div>
    `).join('');
  }

  // Quantity handlers
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const qtyVal = document.getElementById('qtyVal');

  if (qtyMinus && qtyPlus && qtyVal) {
    qtyMinus.addEventListener('click', () => {
      quantity = Math.max(1, quantity - 1);
      qtyVal.textContent = quantity;
      updatePrice();
    });
    qtyPlus.addEventListener('click', () => {
      quantity = Math.min(5, quantity + 1);
      qtyVal.textContent = quantity;
      updatePrice();
    });
  }

  // Add to Cart
  const addBtn = document.getElementById('addToCartBtn') || document.querySelector('.add-to-cart-btn, #primaryAddBtn');
  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      if (!currentProduct) return;
      const originalText = addBtn.innerHTML;
      addBtn.innerHTML = '<span>Acquiring...</span>';
      addBtn.disabled = true;

      const res = await window.LagoreeAPI.cart.add({
        productId: currentProduct.id,
        framingId: selectedFraming ? selectedFraming.id : null,
        size: selectedSize,
        quantity: quantity
      });

      if (res.success) {
        addBtn.innerHTML = '<span>Acquired in Collection ✓</span>';
      } else {
        addBtn.innerHTML = originalText;
      }

      setTimeout(() => {
        addBtn.innerHTML = originalText;
        addBtn.disabled = false;
      }, 2500);
    });
  }

  // Wishlist Toggle
  const wishlistBtn = document.getElementById('wishlistBtn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', async () => {
      if (!currentProduct) return;
      if (!window.LagoreeAPI.auth.isLoggedIn()) {
        window.LagoreeToast.show('Please log in to save to your private wishlist.', 'info');
        setTimeout(() => window.location.href = '/login', 1500);
        return;
      }
      const res = await window.LagoreeAPI.wishlist.toggle(currentProduct.id);
      if (res.success) {
        wishlistBtn.classList.toggle('active', res.isSaved);
      }
    });
  }

  // Review submission
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rating = reviewForm.querySelector('[name="rating"]').value;
      const title = reviewForm.querySelector('[name="title"]').value;
      const comment = reviewForm.querySelector('[name="comment"]').value;
      const userName = reviewForm.querySelector('[name="userName"]')?.value;

      const res = await window.LagoreeAPI.products.addReview(currentProduct.id, {
        rating,
        title,
        comment,
        userName
      });

      if (res.success) {
        window.LagoreeToast.show(res.message, 'success', 'Review Recorded');
        reviewForm.reset();
        loadProduct(); // Reload reviews
      }
    });
  }

  // Initial load
  loadProduct();
});
