/**
 * Lagoree Arts - Authentication (Login / Register) Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to account
  if (window.LagoreeAPI?.auth?.isLoggedIn()) {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect') || 'My Account Lagoree Arts.html';
    window.location.href = redirect;
    return;
  }

  const loginForm = document.getElementById('loginForm') || document.querySelector('form.login-form');
  const registerForm = document.getElementById('registerForm') || document.querySelector('form.register-form');

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = loginForm.querySelector('[name="email"]') || document.getElementById('loginEmail');
      const passwordInput = loginForm.querySelector('[name="password"]') || document.getElementById('loginPassword');

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      if (!email || !password) return;

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.innerHTML = '<span>Verifying Credentials...</span>';
        submitBtn.disabled = true;
      }

      const res = await window.LagoreeAPI.auth.login({ email, password });

      if (res.success) {
        const userName = res.user?.firstName ? `${res.user.firstName} ${res.user.lastName || ''}`.trim() : (res.user?.name || 'Connoisseur');
        window.LagoreeToast.show(`Welcome back, ${userName}.`, 'success', 'Session Established');
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || 'My Account Lagoree Arts.html';
        setTimeout(() => window.location.href = redirect, 900);
      } else {
        if (submitBtn) {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
      }
    });
  }

  // Handle Register
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const firstNameInput = registerForm.querySelector('[name="firstName"]') || document.getElementById('firstName');
      const lastNameInput = registerForm.querySelector('[name="lastName"]') || document.getElementById('lastName');
      const nameInput = registerForm.querySelector('[name="name"]');
      const emailInput = registerForm.querySelector('[name="email"]') || document.getElementById('regEmail');
      const passwordInput = registerForm.querySelector('[name="password"]') || document.getElementById('regPassword');
      const phoneInput = registerForm.querySelector('[name="phone"]') || document.getElementById('regPhone');

      let firstName = firstNameInput ? firstNameInput.value.trim() : '';
      let lastName = lastNameInput ? lastNameInput.value.trim() : '';
      if (!firstName && nameInput && nameInput.value.trim()) {
        const parts = nameInput.value.trim().split(' ');
        firstName = parts[0];
        lastName = parts.slice(1).join(' ') || 'Patron';
      }

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';

      if (!email || !password || !firstName) return;

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.innerHTML = '<span>Creating Collector Profile...</span>';
        submitBtn.disabled = true;
      }

      const res = await window.LagoreeAPI.auth.register({ firstName, lastName: lastName || 'Patron', email, password, phone });

      if (res.success) {
        window.LagoreeToast.show('Welcome to the Circle of Lagoree Patrons.', 'success', 'Account Created');
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || 'My Account Lagoree Arts.html';
        setTimeout(() => window.location.href = redirect, 900);
      } else {
        if (submitBtn) {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
      }
    });
  }
});
