/**
 * Lagoree Arts - Shopping Cart Page Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const cartItemsContainer = document.getElementById('cartItemsList') || document.querySelector('.cart-items-container, #cartList');
  const cartSummaryContainer = document.getElementById('cartSummary') || document.querySelector('.cart-summary-box, .order-summary');
  if (!cartItemsContainer) return;

  let appliedCouponCode = null;

  async function renderCart() {
    const res = await window.LagoreeAPI.cart.get(appliedCouponCode);
    if (!res.success || !res.cart || res.cart.items.length === 0) {
      cartItemsContainer.innerHTML = `
        <div style="padding: 80px 20px; text-align: center;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.5" style="margin: 0 auto 16px;"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 32px; color: var(--forest); margin-bottom: 8px;">Your Curated Bag is Empty</h2>
          <p style="color: var(--muted); font-size: 14px; max-width: 440px; margin: 0 auto 24px;">Discover certified Tanjore paintings, devotional Pichwais, and Chola bronzes from royal heritage guilds.</p>
          <a href="/category" class="btn primary">Explore Masterpieces</a>
        </div>
      `;

      if (cartSummaryContainer) {
        cartSummaryContainer.style.display = 'none';
      }
      return;
    }

    const cart = res.cart;
    if (cartSummaryContainer) cartSummaryContainer.style.display = 'block';

    // Render Line Items
    cartItemsContainer.innerHTML = cart.items.map(item => `
      <div class="cart-item-row" data-id="${item.cartItemId}" style="display: grid; grid-template-columns: 100px 1fr auto auto; gap: 20px; align-items: center; padding: 24px 0; border-bottom: 1px solid var(--stone);">
        <div style="aspect-ratio: 4/5; overflow: hidden; background: #eee; border: 1px solid var(--gold-dim);">
          <img src="${item.image}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>

        <div>
          <div style="font-size: 10px; color: var(--gold); text-transform: uppercase; letter-spacing: 0.2em;">${item.categoryName || 'Heritage Artwork'}</div>
          <h4 style="font-family: 'Cormorant Garamond', serif; font-size: 20px; margin: 4px 0;">
            <a href="/product?slug=${item.slug}" style="color: var(--forest);">${item.title}</a>
          </h4>
          <div style="font-size: 12px; color: var(--muted); display: flex; flex-direction: column; gap: 2px;">
            <span>Framing: <strong>${item.framingName}</strong></span>
            <span>Dimensions: ${item.dimensions}</span>
          </div>
          <div style="font-size: 14px; font-weight: 600; color: var(--forest); margin-top: 6px;">${window.formatINR(item.unitPrice)} each</div>
        </div>

        <div style="display: flex; align-items: center; border: 1px solid var(--stone); border-radius: 2px;">
          <button class="cart-qty-btn" data-action="minus" data-id="${item.cartItemId}" data-qty="${item.quantity}" style="padding: 6px 12px; cursor: pointer;">−</button>
          <span style="padding: 6px 10px; font-size: 13px; font-weight: 600;">${item.quantity}</span>
          <button class="cart-qty-btn" data-action="plus" data-id="${item.cartItemId}" data-qty="${item.quantity}" style="padding: 6px 12px; cursor: pointer;">+</button>
        </div>

        <div style="text-align: right; min-width: 110px;">
          <div style="font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: var(--forest);">${window.formatINR(item.itemTotal)}</div>
          <button class="cart-remove-btn" data-id="${item.cartItemId}" style="font-size: 11px; color: var(--muted); text-decoration: underline; margin-top: 6px; cursor: pointer;">Remove</button>
        </div>
      </div>
    `).join('');

    // Render Order Summary
    updateSummaryView(cart);
    bindCartItemEvents();
  }

  function updateSummaryView(cart) {
    const subtotalEl = document.getElementById('summarySubtotal');
    const framingEl = document.getElementById('summaryFraming');
    const discountRow = document.getElementById('summaryDiscountRow');
    const discountEl = document.getElementById('summaryDiscount');
    const shippingEl = document.getElementById('summaryShipping');
    const taxEl = document.getElementById('summaryTax');
    const totalEl = document.getElementById('summaryTotal');

    if (subtotalEl) subtotalEl.textContent = window.formatINR(cart.subtotal);
    if (framingEl) framingEl.textContent = window.formatINR(cart.framingCost);

    if (discountRow && discountEl) {
      if (cart.discountAmount > 0) {
        discountRow.style.display = 'flex';
        discountEl.textContent = `−${window.formatINR(cart.discountAmount)}`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    if (shippingEl) {
      shippingEl.textContent = cart.shippingFee === 0 ? 'Complimentary (Insured Crate)' : window.formatINR(cart.shippingFee);
    }

    if (taxEl) taxEl.textContent = window.formatINR(cart.taxAmount);
    if (totalEl) totalEl.textContent = window.formatINR(cart.grandTotal);
  }

  function bindCartItemEvents() {
    document.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const currentQty = parseInt(btn.dataset.qty);
        const newQty = btn.dataset.action === 'plus' ? currentQty + 1 : currentQty - 1;
        btn.disabled = true;
        await window.LagoreeAPI.cart.update(id, newQty);
        renderCart();
      });
    });

    document.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        btn.textContent = 'Removing...';
        btn.disabled = true;
        await window.LagoreeAPI.cart.remove(id);
        renderCart();
      });
    });
  }

  // Coupon application
  const couponForm = document.getElementById('couponForm');
  if (couponForm) {
    couponForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const codeInput = couponForm.querySelector('input[name="couponCode"], #couponInput');
      if (!codeInput || !codeInput.value.trim()) return;

      const code = codeInput.value.trim().toUpperCase();
      const res = await window.LagoreeAPI.cart.applyCoupon(code);
      if (res.success) {
        appliedCouponCode = code;
        window.LagoreeToast.show(res.message, 'success', 'Coupon Applied');
        renderCart();
      }
    });
  }

  // Checkout button
  const checkoutBtn = document.getElementById('proceedCheckoutBtn') || document.querySelector('.checkout-btn, #checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      window.location.href = '/checkout';
    });
  }

  // Initial render
  renderCart();
});
