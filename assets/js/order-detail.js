/**
 * Lagoree Arts - Order Detail & Live Tracking Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const identifier = urlParams.get('orderNumber') || urlParams.get('id') || 'LAG-2026-88914';

  async function loadOrder() {
    const res = await window.LagoreeAPI.orders.get(identifier);
    if (!res.success || !res.order) {
      window.LagoreeToast.show('Order tracking reference not found.', 'error');
      return;
    }

    const order = res.order;
    renderOrderView(order);
  }

  function renderOrderView(order) {
    // Header & Meta
    const numberEls = document.querySelectorAll('#orderNumberDisplay, .order-number, #orderId');
    numberEls.forEach(el => el.textContent = order.order_number);

    const dateEls = document.querySelectorAll('#orderDateDisplay, .order-date');
    dateEls.forEach(el => el.textContent = new Date(order.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }));

    const statusBadge = document.getElementById('orderStatusBadge');
    if (statusBadge) {
      statusBadge.textContent = order.order_status.toUpperCase();
      statusBadge.className = `badge status-${order.order_status}`;
    }

    const deliveryEl = document.getElementById('estimatedDeliveryDate');
    if (deliveryEl) deliveryEl.textContent = order.estimated_delivery || '5-7 Business Days';

    const courierEl = document.getElementById('courierName');
    if (courierEl) courierEl.textContent = order.courier_name || 'BlueDart Luxury Secure Logistics';

    const trackingEl = document.getElementById('trackingNumber');
    if (trackingEl) trackingEl.textContent = order.tracking_number || 'Generated upon dispatch';

    // Render Timeline Steps
    const timelineContainer = document.getElementById('orderTimeline') || document.querySelector('.tracking-timeline');
    if (timelineContainer && order.timeline) {
      timelineContainer.innerHTML = order.timeline.map((step, idx) => `
        <div class="timeline-step active" style="display: flex; gap: 16px; margin-bottom: 24px; position: relative;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--forest); color: #C6A15B; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0;">
            ✓
          </div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <h4 style="font-family: 'Cormorant Garamond', serif; font-size: 18px; color: var(--forest); margin: 0;">${step.title}</h4>
              <span style="font-size: 11px; color: var(--muted);">${new Date(step.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p style="font-size: 13px; color: var(--charcoal); margin-top: 4px; line-height: 1.5;">${step.description || ''}</p>
          </div>
        </div>
      `).join('');
    }

    // Render Items
    const itemsContainer = document.getElementById('orderItemsList') || document.querySelector('.order-items-list');
    if (itemsContainer && order.items) {
      itemsContainer.innerHTML = order.items.map(item => `
        <div style="display: flex; gap: 16px; align-items: center; padding: 18px 0; border-bottom: 1px solid var(--stone);">
          <div style="width: 64px; height: 80px; aspect-ratio: 4/5; overflow: hidden; background: #eee; border: 1px solid var(--gold-dim); flex-shrink: 0;">
            <img src="${item.image || ''}" alt="${item.product_title}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div style="flex: 1;">
            <h4 style="font-family: 'Cormorant Garamond', serif; font-size: 18px; color: var(--forest); margin: 0;">${item.product_title}</h4>
            <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">
              <span>Framing: ${item.frame_name || 'Standard Archival'}</span> • <span>Size: ${item.size || 'Original'}</span>
            </div>
            <div style="font-size: 12px; color: var(--charcoal); margin-top: 4px;">Qty: ${item.quantity} × ${window.formatINR(item.unitPrice)}</div>
          </div>
          <div style="font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: var(--forest);">
            ${window.formatINR(item.total_price)}
          </div>
        </div>
      `).join('');
    }

    // Breakdown
    const subtotalEl = document.getElementById('orderSubtotal');
    const discountEl = document.getElementById('orderDiscount');
    const shippingEl = document.getElementById('orderShipping');
    const taxEl = document.getElementById('orderTax');
    const totalEl = document.getElementById('orderGrandTotal');

    if (subtotalEl) subtotalEl.textContent = window.formatINR(order.subtotal + order.frame_cost);
    if (discountEl) discountEl.textContent = order.discount_amount > 0 ? `−${window.formatINR(order.discount_amount)}` : '₹0';
    if (shippingEl) shippingEl.textContent = order.shipping_fee === 0 ? 'Complimentary' : window.formatINR(order.shipping_fee);
    if (taxEl) taxEl.textContent = window.formatINR(order.tax_amount);
    if (totalEl) totalEl.textContent = window.formatINR(order.total_amount);

    // Addresses
    const shippingAddr = order.shipping_address || {};
    const addrEl = document.getElementById('shippingAddressDisplay');
    if (addrEl) {
      addrEl.innerHTML = `
        <strong>${shippingAddr.fullName || order.customer_name}</strong><br>
        ${shippingAddr.street || ''}${shippingAddr.apartment ? ', ' + shippingAddr.apartment : ''}<br>
        ${shippingAddr.city || ''}, ${shippingAddr.state || ''} — ${shippingAddr.postalCode || ''}<br>
        ${shippingAddr.country || 'India'}<br>
        📞 ${shippingAddr.phone || order.customer_phone}
      `;
    }
  }

  // Print Invoice handler
  const printBtn = document.getElementById('printInvoiceBtn') || document.querySelector('.print-invoice-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  loadOrder();
});
