/**
 * Lagoree Arts - Multi-Step Checkout Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const checkoutForm = document.getElementById('checkoutForm') || document.querySelector('form.checkout-form');
  if (!checkoutForm) return;

  let currentCart = null;
  let savedAddresses = [];
  let selectedAddressId = null;
  let selectedPaymentMethod = 'upi';

  // 1. Fetch Cart Data
  async function loadCheckoutData() {
    const res = await window.LagoreeAPI.cart.get();
    if (!res.success || !res.cart || res.cart.items.length === 0) {
      window.LagoreeToast.show('Your curated bag is empty. Redirecting to gallery...', 'info');
      setTimeout(() => window.location.href = '/category', 1500);
      return;
    }

    currentCart = res.cart;
    renderOrderSummary(currentCart);

    // If logged in, fetch saved addresses & prefill contact details
    if (window.LagoreeAPI.auth.isLoggedIn()) {
      const user = window.LagoreeAPI.auth.getUser();
      const nameInput = checkoutForm.querySelector('[name="customerName"]');
      const emailInput = checkoutForm.querySelector('[name="customerEmail"]');
      const phoneInput = checkoutForm.querySelector('[name="customerPhone"]');

      if (nameInput && user) nameInput.value = user.name || '';
      if (emailInput && user) emailInput.value = user.email || '';
      if (phoneInput && user) phoneInput.value = user.phone || '';

      const addrRes = await window.LagoreeAPI.auth.getAddresses();
      if (addrRes.success && addrRes.addresses) {
        savedAddresses = addrRes.addresses;
        renderSavedAddresses();
      }
    }
  }

  function renderOrderSummary(cart) {
    const itemsList = document.getElementById('checkoutItemsList') || document.querySelector('.checkout-items-list');
    if (itemsList) {
      itemsList.innerHTML = cart.items.map(item => `
        <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid var(--stone);">
          <div style="width: 54px; height: 68px; aspect-ratio: 4/5; overflow: hidden; background: #eee; flex-shrink: 0;">
            <img src="${item.image}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div style="flex: 1;">
            <div style="font-family: 'Cormorant Garamond', serif; font-size: 16px; color: var(--forest);">${item.title}</div>
            <div style="font-size: 11px; color: var(--muted);">${item.framingName} • Qty: ${item.quantity}</div>
          </div>
          <div style="font-weight: 600; font-size: 14px; color: var(--forest);">${window.formatINR(item.itemTotal)}</div>
        </div>
      `).join('');
    }

    const subtotalEl = document.getElementById('checkoutSubtotal');
    const discountEl = document.getElementById('checkoutDiscount');
    const shippingEl = document.getElementById('checkoutShipping');
    const taxEl = document.getElementById('checkoutTax');
    const totalEl = document.getElementById('checkoutTotal');

    if (subtotalEl) subtotalEl.textContent = window.formatINR(cart.grossSubtotal);
    if (discountEl) discountEl.textContent = cart.discountAmount > 0 ? `−${window.formatINR(cart.discountAmount)}` : '₹0';
    if (shippingEl) shippingEl.textContent = cart.shippingFee === 0 ? 'Complimentary Insured' : window.formatINR(cart.shippingFee);
    if (taxEl) taxEl.textContent = window.formatINR(cart.taxAmount);
    if (totalEl) totalEl.textContent = window.formatINR(cart.grandTotal);
  }

  function renderSavedAddresses() {
    const addressContainer = document.getElementById('savedAddressContainer');
    if (!addressContainer || savedAddresses.length === 0) return;

    addressContainer.innerHTML = `
      <div style="margin-bottom: 20px;">
        <label class="eyebrow" style="margin-bottom: 10px; display: block;">Saved Collector Addresses</label>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
          ${savedAddresses.map((addr, idx) => `
            <div class="saved-addr-card ${addr.is_default ? 'selected' : ''}" data-id="${addr.id}" style="border: 1.5px solid ${addr.is_default ? 'var(--forest)' : 'var(--stone)'}; padding: 14px; border-radius: 2px; cursor: pointer; background: ${addr.is_default ? 'rgba(18, 53, 36, 0.04)' : '#fff'};">
              <div style="font-weight: 600; font-size: 13px; color: var(--forest);">${addr.full_name}</div>
              <div style="font-size: 12px; color: var(--muted); margin-top: 4px; line-height: 1.4;">
                ${addr.street}, ${addr.apartment ? addr.apartment + ', ' : ''}${addr.city}, ${addr.state} — ${addr.postal_code}
              </div>
              <div style="font-size: 11px; color: var(--gold); margin-top: 6px;">📞 ${addr.phone}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Auto-select default
    const defaultAddr = savedAddresses.find(a => a.is_default) || savedAddresses[0];
    if (defaultAddr) {
      selectedAddressId = defaultAddr.id;
      fillAddressInputs(defaultAddr);
    }

    addressContainer.querySelectorAll('.saved-addr-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        selectedAddressId = id;
        const addr = savedAddresses.find(a => a.id == id);
        if (addr) fillAddressInputs(addr);

        addressContainer.querySelectorAll('.saved-addr-card').forEach(c => {
          const isSel = c === card;
          c.style.borderColor = isSel ? 'var(--forest)' : 'var(--stone)';
          c.style.background = isSel ? 'rgba(18, 53, 36, 0.04)' : '#fff';
        });
      });
    });
  }

  function fillAddressInputs(addr) {
    const fields = {
      fullName: addr.full_name,
      phone: addr.phone,
      street: addr.street,
      apartment: addr.apartment || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postal_code
    };

    for (const [name, val] of Object.entries(fields)) {
      const input = checkoutForm.querySelector(`[name="${name}"]`);
      if (input) input.value = val;
    }
  }

  // Payment method switcher
  const paymentRadios = checkoutForm.querySelectorAll('[name="paymentMethod"]');
  paymentRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      selectedPaymentMethod = radio.value;
    });
  });

  // Handle Order Submission
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = checkoutForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.innerHTML = '<span>Securing Acquisition & Payment...</span>';
      submitBtn.disabled = true;
    }

    const formData = new FormData(checkoutForm);
    const customerName = formData.get('customerName') || formData.get('fullName');
    const customerEmail = formData.get('customerEmail') || formData.get('email');
    const customerPhone = formData.get('customerPhone') || formData.get('phone');

    const shippingAddress = {
      fullName: customerName,
      phone: customerPhone,
      street: formData.get('street') || formData.get('address'),
      apartment: formData.get('apartment') || '',
      city: formData.get('city'),
      state: formData.get('state'),
      postalCode: formData.get('postalCode') || formData.get('zip'),
      country: formData.get('country') || 'India'
    };

    const notes = formData.get('notes') || formData.get('orderNotes') || '';

    const orderPayload = {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      billingAddress: shippingAddress,
      paymentMethod: selectedPaymentMethod,
      couponCode: currentCart.appliedCoupon ? currentCart.appliedCoupon.code : null,
      notes
    };

    const res = await window.LagoreeAPI.checkout.createOrder(orderPayload);

    if (res.success && res.order) {
      window.LagoreeToast.show('Acquisition verified! Directing to receipt...', 'success', 'Order Confirmed');
      setTimeout(() => {
        window.location.href = `/order-confirmation?orderNumber=${res.order.orderNumber}`;
      }, 1000);
    } else {
      if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    }
  });

  // Initial load
  loadCheckoutData();
});
