/**
 * Lagoree Arts - Unified API Client & State Bridge
 */

const API_BASE = '/api';

// Generate or retrieve persistent guest session ID
function getSessionId() {
  let sessionId = localStorage.getItem('lagoree_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('lagoree_session_id', sessionId);
  }
  return sessionId;
}

// Global Luxury Toast Notification Engine
export const LagoreeToast = {
  container: null,
  init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.id = 'lagoree-toast-container';
    this.container.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
      font-family: 'Inter', sans-serif;
    `;
    document.body.appendChild(this.container);
  },
  show(message, type = 'success', title = '') {
    this.init();
    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    const isError = type === 'error';
    
    toast.style.cssText = `
      min-width: 320px;
      max-width: 440px;
      background: #123524;
      color: #FCFBF8;
      border: 1px solid ${isError ? '#C0392B' : '#C6A15B'};
      padding: 16px 20px;
      border-radius: 4px;
      box-shadow: 0 12px 36px rgba(18, 53, 36, 0.35);
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 14px;
    `;

    const iconSvg = isError
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C6A15B" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

    toast.innerHTML = `
      <div style="flex-shrink: 0; margin-top: 2px;">${iconSvg}</div>
      <div style="flex: 1;">
        ${title ? `<div style="font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 600; color: #C6A15B; margin-bottom: 2px;">${title}</div>` : ''}
        <div style="font-size: 13px; line-height: 1.5; color: #DED5C8;">${message}</div>
      </div>
      <button style="background: none; border: none; color: #686660; cursor: pointer; font-size: 18px; line-height: 1; padding: 0;" onclick="this.parentElement.remove()">×</button>
    `;

    this.container.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    // Auto remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }
};

// Core Request Helper
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('lagoree_token');
  const sessionId = getSessionId();

  const headers = {
    'Content-Type': 'application/json',
    'x-session-id': sessionId,
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.message || `Request failed with status ${res.status}`;
      if (options.showToast !== false && res.status !== 401) {
        LagoreeToast.show(errorMsg, 'error', 'Action Notice');
      }
      return { success: false, status: res.status, message: errorMsg, ...data };
    }

    return data;
  } catch (err) {
    console.error('API Error:', err);
    if (options.showToast !== false) {
      LagoreeToast.show('Unable to connect to Lagoree Arts atelier server.', 'error', 'Network Notice');
    }
    return { success: false, message: err.message };
  }
}

// API Methods
export const API = {
  // Authentication
  auth: {
    async register(userData) {
      const res = await request('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
      if (res.success && res.token) {
        localStorage.setItem('lagoree_token', res.token);
        localStorage.setItem('lagoree_user', JSON.stringify(res.user));
        window.dispatchEvent(new CustomEvent('lagoree:auth-changed', { detail: res.user }));
      }
      return res;
    },
    async login(credentials) {
      const res = await request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
      if (res.success && res.token) {
        localStorage.setItem('lagoree_token', res.token);
        localStorage.setItem('lagoree_user', JSON.stringify(res.user));
        window.dispatchEvent(new CustomEvent('lagoree:auth-changed', { detail: res.user }));
      }
      return res;
    },
    async getMe() {
      const res = await request('/auth/me', { method: 'GET', showToast: false });
      if (res.success && res.user) {
        localStorage.setItem('lagoree_user', JSON.stringify(res.user));
      }
      return res;
    },
    async updateProfile(profileData) {
      const res = await request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) });
      if (res.success && res.user) {
        localStorage.setItem('lagoree_user', JSON.stringify(res.user));
        window.dispatchEvent(new CustomEvent('lagoree:auth-changed', { detail: res.user }));
      }
      return res;
    },
    async changePassword(passwords) {
      return request('/auth/change-password', { method: 'PUT', body: JSON.stringify(passwords) });
    },
    async getAddresses() {
      return request('/auth/addresses', { method: 'GET' });
    },
    async addAddress(address) {
      return request('/auth/addresses', { method: 'POST', body: JSON.stringify(address) });
    },
    async updateAddress(id, address) {
      return request(`/auth/addresses/${id}`, { method: 'PUT', body: JSON.stringify(address) });
    },
    async deleteAddress(id) {
      return request(`/auth/addresses/${id}`, { method: 'DELETE' });
    },
    logout() {
      localStorage.removeItem('lagoree_token');
      localStorage.removeItem('lagoree_user');
      window.dispatchEvent(new CustomEvent('lagoree:auth-changed', { detail: null }));
      window.location.href = '/login';
    },
    getUser() {
      try {
        return JSON.parse(localStorage.getItem('lagoree_user'));
      } catch (e) {
        return null;
      }
    },
    isLoggedIn() {
      return !!localStorage.getItem('lagoree_token');
    }
  },

  // Products & Catalog
  products: {
    async list(params = {}) {
      const query = new URLSearchParams(params).toString();
      return request(`/products?${query}`, { method: 'GET' });
    },
    async get(identifier) {
      return request(`/products/${identifier}`, { method: 'GET' });
    },
    async categories() {
      return request('/products/categories', { method: 'GET' });
    },
    async artists() {
      return request('/products/artists', { method: 'GET' });
    },
    async framingOptions() {
      return request('/products/framing-options', { method: 'GET' });
    },
    async addReview(productId, reviewData) {
      return request(`/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(reviewData) });
    }
  },

  // Cart
  cart: {
    async get(couponCode = null) {
      const query = couponCode ? `?couponCode=${encodeURIComponent(couponCode)}` : '';
      const res = await request(`/cart${query}`, { method: 'GET', showToast: false });
      if (res.success && res.cart) {
        window.dispatchEvent(new CustomEvent('lagoree:cart-updated', { detail: res.cart }));
      }
      return res;
    },
    async add(item) {
      const res = await request('/cart/add', { method: 'POST', body: JSON.stringify(item) });
      if (res.success && res.cart) {
        LagoreeToast.show(res.message || 'Artwork added to your collection.', 'success', 'Collection Updated');
        window.dispatchEvent(new CustomEvent('lagoree:cart-updated', { detail: res.cart }));
      }
      return res;
    },
    async update(itemId, quantity) {
      const res = await request(`/cart/items/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
      if (res.success && res.cart) {
        window.dispatchEvent(new CustomEvent('lagoree:cart-updated', { detail: res.cart }));
      }
      return res;
    },
    async remove(itemId) {
      const res = await request(`/cart/items/${itemId}`, { method: 'DELETE' });
      if (res.success && res.cart) {
        LagoreeToast.show('Item removed from cart.', 'success');
        window.dispatchEvent(new CustomEvent('lagoree:cart-updated', { detail: res.cart }));
      }
      return res;
    },
    async applyCoupon(code, subtotal) {
      return request('/cart/coupon', { method: 'POST', body: JSON.stringify({ code, subtotal }) });
    }
  },

  // Checkout & Orders
  checkout: {
    async createOrder(orderPayload) {
      const res = await request('/checkout/create-order', { method: 'POST', body: JSON.stringify(orderPayload) });
      if (res.success) {
        window.dispatchEvent(new CustomEvent('lagoree:cart-updated', { detail: { itemCount: 0, items: [] } }));
      }
      return res;
    },
    async verifyPayment(verificationData) {
      return request('/checkout/verify-payment', { method: 'POST', body: JSON.stringify(verificationData) });
    }
  },

  // Orders
  orders: {
    async myOrders() {
      return request('/orders/my-orders', { method: 'GET' });
    },
    async get(identifier) {
      return request(`/orders/${identifier}`, { method: 'GET' });
    }
  },

  // Wishlist
  wishlist: {
    async get() {
      const res = await request('/wishlist', { method: 'GET', showToast: false });
      if (res.success && res.wishlist) {
        window.dispatchEvent(new CustomEvent('lagoree:wishlist-updated', { detail: res.wishlist }));
      }
      return res;
    },
    async toggle(productId) {
      const res = await request('/wishlist/toggle', { method: 'POST', body: JSON.stringify({ productId }) });
      if (res.success) {
        LagoreeToast.show(res.message, 'success', 'Private Wishlist');
        window.dispatchEvent(new CustomEvent('lagoree:wishlist-toggled', { detail: { productId, isSaved: res.isSaved } }));
      }
      return res;
    },
    async moveToCart(productId, framingId, size) {
      const res = await request('/wishlist/move-to-cart', { method: 'POST', body: JSON.stringify({ productId, framingId, size }) });
      if (res.success) {
        LagoreeToast.show(res.message, 'success');
      }
      return res;
    }
  },

  // Contact & Inquiries
  contact: {
    async send(messageData) {
      return request('/contact/message', { method: 'POST', body: JSON.stringify(messageData) });
    },
    async subscribe(email) {
      return request('/contact/newsletter', { method: 'POST', body: JSON.stringify({ email }) });
    }
  },

  // Admin
  admin: {
    async metrics() {
      return request('/admin/metrics', { method: 'GET' });
    },
    async updateOrderStatus(orderId, updateData) {
      return request(`/admin/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify(updateData) });
    },
    async createProduct(productData) {
      return request('/admin/products', { method: 'POST', body: JSON.stringify(productData) });
    },
    async updateProduct(id, productData) {
      return request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(productData) });
    },
    async deleteProduct(id) {
      return request(`/admin/products/${id}`, { method: 'DELETE' });
    }
  }
};

// Expose globally to window
window.LagoreeAPI = API;
window.LagoreeToast = LagoreeToast;
window.formatINR = function(amount) {
  if (amount === null || amount === undefined) return 'Price on Request';
  return '₹' + Number(amount).toLocaleString('en-IN');
};

export default API;
