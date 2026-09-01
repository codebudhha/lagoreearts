/**
 * Lagoree Arts - Global UI State & Interactivity Engine
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Lock navbar header while scrolling
  initStickyNavbar();

  // 2. Initialize API and load initial cart & wishlist counts
  if (window.LagoreeAPI) {
    try {
      window.LagoreeAPI.cart.get();
      if (window.LagoreeAPI.auth.isLoggedIn()) {
        window.LagoreeAPI.auth.getMe();
        window.LagoreeAPI.wishlist.get();
      }
    } catch (e) {
      console.warn('Initial state sync error:', e);
    }
  }

  // 3. Setup Navbar and User Status
  updateNavUserStatus();
  window.addEventListener('lagoree:auth-changed', () => {
    updateNavUserStatus();
  });

  // 4. Listen to Cart Updates
  window.addEventListener('lagoree:cart-updated', (e) => {
    const cart = e.detail;
    updateCartBadges(cart ? cart.itemCount : 0);
  });

  // 5. Listen to Wishlist Updates
  window.addEventListener('lagoree:wishlist-updated', (e) => {
    const items = e.detail;
    updateWishlistBadges(items ? items.length : 0);
  });

  // 6. Global Newsletter Form Handler
  bindNewsletterForms();

  // 7. Global Search Form Handler
  bindGlobalSearch();
});

// Initialize Locked/Sticky Navbar with Frosted Blur across All Pages
function initStickyNavbar() {
  // Inject Universal Sticky Header Styles
  if (!document.getElementById('lagoree-sticky-header-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'lagoree-sticky-header-styles';
    styleEl.textContent = `
      html {
        overflow-x: clip !important;
      }
      body {
        overflow-x: clip !important;
      }
      .nav, header.header, header.site-header, header, .site-header, nav.nav {
        position: sticky !important;
        top: 0 !important;
        z-index: 1000 !important;
        background: rgba(247, 245, 240, 0.96) !important;
        backdrop-filter: blur(16px) !important;
        -webkit-backdrop-filter: blur(16px) !important;
        border-bottom: 1px solid rgba(222, 213, 200, 0.7) !important;
        transition: background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease, height 0.3s ease !important;
      }
      .nav.is-scrolled, header.is-scrolled, .site-header.is-scrolled, header.header.is-scrolled {
        background: rgba(247, 245, 240, 0.98) !important;
        box-shadow: 0 4px 24px rgba(18, 53, 36, 0.09) !important;
        border-bottom-color: rgba(198, 161, 91, 0.35) !important;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Scroll listener for elevation shadow
  const headers = document.querySelectorAll('.nav, header, .site-header, .header, nav');
  function handleScroll() {
    const isScrolled = window.scrollY > 15;
    headers.forEach(h => {
      h.classList.toggle('is-scrolled', isScrolled);
      if (h.classList.contains('nav')) {
        h.classList.toggle('solid', isScrolled);
      }
    });
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Trigger initial check
}

// Update navbar user avatar or login link
function updateNavUserStatus() {
  const user = window.LagoreeAPI ? window.LagoreeAPI.auth.getUser() : null;
  const userLinks = document.querySelectorAll('a[href*="Login-Register"], a[href="/login"], a[href="/account"], .nav-user-link');

  userLinks.forEach(link => {
    if (user) {
      link.href = '/account';
      link.setAttribute('title', `Logged in as ${user.name}`);
      const textSpan = link.querySelector('.nav-label') || link.querySelector('span');
      if (textSpan) {
        textSpan.textContent = user.name.split(' ')[0];
      }
    } else {
      link.href = '/login';
      const textSpan = link.querySelector('.nav-label') || link.querySelector('span');
      if (textSpan) {
        textSpan.textContent = 'Account';
      }
    }
  });
}

// Update Cart Badges across Header
function updateCartBadges(count) {
  const badges = document.querySelectorAll('.cart-count, [data-cart-count], .bag-count, .cart-badge');
  badges.forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

// Update Wishlist Badges across Header
function updateWishlistBadges(count) {
  const badges = document.querySelectorAll('.wishlist-count, [data-wishlist-count], .wishlist-badge');
  badges.forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

// Bind Newsletter Subscription Forms
function bindNewsletterForms() {
  const forms = document.querySelectorAll('form.newsletter-form, form[action*="newsletter"], .footer-newsletter form');
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      if (!emailInput || !emailInput.value) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.textContent = 'Subscribing...';
        submitBtn.disabled = true;
      }

      const res = await window.LagoreeAPI.contact.subscribe(emailInput.value);
      if (res.success) {
        window.LagoreeToast.show(res.message, 'success', 'Gazette Subscription');
        emailInput.value = '';
      }

      if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  });
}

// Bind Header / Global Search
function bindGlobalSearch() {
  const searchForms = document.querySelectorAll('form.search-form, form[action*="Search"], .nav-search form');
  searchForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="search"], input[name="q"], input[type="text"]');
      if (input && input.value.trim()) {
        window.location.href = `/search?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  });
}

// Expose state helpers
window.LagoreeState = {
  updateCartBadges,
  updateWishlistBadges,
  updateNavUserStatus,
  initStickyNavbar
};
