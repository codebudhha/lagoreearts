/**
 * Lagoree Arts - Customer Portal & Account Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check auth
  if (!window.LagoreeAPI?.auth?.isLoggedIn()) {
    window.location.href = 'Login-Register - Lagoree Arts.html';
    return;
  }

  const profileNameEl = document.getElementById('profileName');
  const profileEmailEl = document.getElementById('profileEmail');
  const profilePhoneEl = document.getElementById('profilePhone');
  const totalOrdersEl = document.getElementById('totalOrdersCount');
  const totalWishlistEl = document.getElementById('totalWishlistCount');

  async function loadDashboard() {
    let res;
    try {
      res = await window.LagoreeAPI.auth.getMe();
    } catch (e) {
      console.warn('Could not fetch current customer:', e);
    }

    const user = res?.user || window.LagoreeAPI.auth.getUser();
    if (!user) {
      window.LagoreeAPI.auth.logout();
      return;
    }

    const fullName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.name || user.email || 'Connoisseur');

    // Update welcome banner & sidebar profile info
    const welcomeEl = document.querySelector('.welcome, .account-header .welcome');
    if (welcomeEl) welcomeEl.textContent = `Welcome back, ${user.firstName || fullName}`;

    const sidebarNameEl = document.querySelector('.account-sidebar .name, .profile .name');
    if (sidebarNameEl) sidebarNameEl.textContent = fullName;

    const sidebarEmailEl = document.querySelector('.account-sidebar .email, .profile .email');
    if (sidebarEmailEl) sidebarEmailEl.textContent = user.email || '';

    if (profileNameEl) profileNameEl.textContent = fullName;
    if (profileEmailEl) profileEmailEl.textContent = user.email || '';
    if (profilePhoneEl) profilePhoneEl.textContent = user.phone || 'Not provided';

    const editNameInput = document.querySelector('input[name="profileName"]');
    const editPhoneInput = document.querySelector('input[name="profilePhone"]');
    if (editNameInput) editNameInput.value = fullName;
    if (editPhoneInput) editPhoneInput.value = user.phone || '';

    if (totalOrdersEl) totalOrdersEl.textContent = res?.stats?.totalOrders || 0;
    if (totalWishlistEl) totalWishlistEl.textContent = res?.stats?.wishlistCount || 0;

    loadOrders();
    loadAddresses();
  }

  async function loadOrders() {
    const ordersContainer = document.getElementById('accountOrdersList') || document.querySelector('.account-orders-table tbody, #ordersList');
    if (!ordersContainer) return;

    const res = await window.LagoreeAPI.orders.myOrders();
    if (!res.success || !res.orders || res.orders.length === 0) {
      ordersContainer.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: var(--muted);">
            You have not placed any masterpiece acquisitions yet.
          </td>
        </tr>
      `;
      return;
    }

    ordersContainer.innerHTML = res.orders.map(o => `
      <tr style="border-bottom: 1px solid var(--stone);">
        <td style="padding: 16px 12px; font-weight: 600; color: var(--forest);">
          <a href="/order-detail?orderNumber=${o.order_number}" style="color: var(--forest); text-decoration: underline;">${o.order_number}</a>
        </td>
        <td style="padding: 16px 12px; font-size: 13px; color: var(--muted);">${new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
        <td style="padding: 16px 12px; font-size: 13px;">${o.first_item_title || 'Curated Artwork'} ${o.item_count > 1 ? `(+${o.item_count - 1} more)` : ''}</td>
        <td style="padding: 16px 12px; font-weight: 600;">${window.formatINR(o.total_amount)}</td>
        <td style="padding: 16px 12px;">
          <span style="display: inline-block; padding: 3px 8px; font-size: 10px; font-weight: 600; text-transform: uppercase; border-radius: 2px; background: rgba(18, 53, 36, 0.1); color: var(--forest);">${o.order_status}</span>
        </td>
        <td style="padding: 16px 12px; text-align: right;">
          <a href="/order-detail?orderNumber=${o.order_number}" class="btn ghost" style="padding: 6px 14px; font-size: 10px;">Track Order</a>
        </td>
      </tr>
    `).join('');
  }

  async function loadAddresses() {
    const addressContainer = document.getElementById('accountAddressesList') || document.querySelector('.addresses-grid');
    if (!addressContainer) return;

    const res = await window.LagoreeAPI.auth.getAddresses();
    if (!res.success || !res.addresses || res.addresses.length === 0) {
      addressContainer.innerHTML = `<div style="color: var(--muted); padding: 20px 0;">No saved addresses found.</div>`;
      return;
    }

    addressContainer.innerHTML = res.addresses.map(a => `
      <div style="border: 1px solid var(--stone); padding: 18px; border-radius: 2px; position: relative; background: #fff;">
        ${a.is_default ? `<span class="eyebrow" style="font-size: 9px; margin-bottom: 8px; color: var(--forest);">Default Address</span>` : ''}
        <div style="font-weight: 600; font-size: 14px; color: var(--forest);">${a.full_name}</div>
        <div style="font-size: 13px; color: var(--muted); margin-top: 4px; line-height: 1.5;">
          ${a.street}${a.apartment ? ', ' + a.apartment : ''}<br>
          ${a.city}, ${a.state} — ${a.postal_code}<br>
          ${a.country}
        </div>
        <div style="font-size: 12px; color: var(--gold); margin-top: 6px;">📞 ${a.phone}</div>
        <div style="margin-top: 12px; display: flex; gap: 12px;">
          <button class="delete-address-btn" data-id="${a.id}" style="font-size: 11px; color: #c0392b; cursor: pointer; text-decoration: underline;">Remove</button>
        </div>
      </div>
    `).join('');

    addressContainer.querySelectorAll('.delete-address-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('Are you sure you want to remove this address?')) {
          await window.LagoreeAPI.auth.deleteAddress(id);
          loadAddresses();
        }
      });
    });
  }

  // Profile Edit Form
  const profileForm = document.getElementById('profileEditForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (profileForm.querySelector('[name="profileName"]') || document.getElementById('editFullName'))?.value || '';
      const phone = (profileForm.querySelector('[name="profilePhone"]') || document.getElementById('editPhone'))?.value || '';

      const parts = name.trim().split(' ');
      const firstName = parts[0] || 'Connoisseur';
      const lastName = parts.slice(1).join(' ') || '';

      const res = await window.LagoreeAPI.auth.updateProfile({ firstName, lastName, phone });
      if (res.success) {
        window.LagoreeToast.show(res.message || 'Profile updated successfully', 'success');
        loadDashboard();
      }
    });
  }

  // Password Form
  const passwordForm = document.getElementById('changePasswordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = passwordForm.querySelector('[name="currentPassword"]').value;
      const newPassword = passwordForm.querySelector('[name="newPassword"]').value;

      const res = await window.LagoreeAPI.auth.changePassword({ currentPassword, newPassword });
      if (res.success) {
        window.LagoreeToast.show(res.message || 'Password changed successfully', 'success');
        passwordForm.reset();
      }
    });
  }

  // Add Address Form
  const addAddressForm = document.getElementById('newAddressForm');
  if (addAddressForm) {
    addAddressForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(addAddressForm);
      const rawName = (formData.get('fullName') || '').toString().trim();
      const nameParts = rawName.split(' ');
      const addressData = {
        firstName: nameParts[0] || 'Patron',
        lastName: nameParts.slice(1).join(' ') || 'Address',
        phone: formData.get('phone'),
        addressLine1: formData.get('street'),
        addressLine2: formData.get('apartment') || '',
        city: formData.get('city'),
        state: formData.get('state'),
        postalCode: formData.get('postalCode'),
        country: formData.get('country') || 'INDIA',
        isDefaultShipping: Boolean(addAddressForm.querySelector('[name="isDefault"]')?.checked)
      };

      const res = await window.LagoreeAPI.auth.addAddress(addressData);
      if (res.success) {
        window.LagoreeToast.show(res.message || 'Address saved successfully', 'success');
        addAddressForm.reset();
        loadAddresses();
      }
    });
  }

  // Logout Button
  const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.LagoreeAPI.auth.logout();
    });
  }

  loadDashboard();
});
