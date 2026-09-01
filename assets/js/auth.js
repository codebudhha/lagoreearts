/**
 * Lagoree Arts - Authentication (Login / Register) Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to account
  if (window.LagoreeAPI.auth.isLoggedIn()) {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect') || '/account';
    window.location.href = redirect;
    return;
  }

  const loginForm = document.getElementById('loginForm') || document.querySelector('form.login-form');
  const registerForm = document.getElementById('registerForm') || document.querySelector('form.register-form');

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('[name="email"]').value;
      const password = loginForm.querySelector('[name="password"]').value;

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.innerHTML = '<span>Verifying Credentials...</span>';
        submitBtn.disabled = true;
      }

      const res = await window.LagoreeAPI.auth.login({ email, password });

      if (res.success) {
        window.LagoreeToast.show(`Welcome back, ${res.user.name}.`, 'success', 'Session Established');
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '/account';
        setTimeout(() => window.location.href = redirect, 1000);
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
      const name = registerForm.querySelector('[name="name"]').value;
      const email = registerForm.querySelector('[name="email"]').value;
      const password = registerForm.querySelector('[name="password"]').value;
      const phone = registerForm.querySelector('[name="phone"]')?.value;

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.innerHTML = '<span>Creating Collector Profile...</span>';
        submitBtn.disabled = true;
      }

      const res = await window.LagoreeAPI.auth.register({ name, email, password, phone });

      if (res.success) {
        window.LagoreeToast.show(res.message, 'success', 'Welcome to Lagoree Arts');
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '/account';
        setTimeout(() => window.location.href = redirect, 1000);
      } else {
        if (submitBtn) {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
      }
    });
  }
});
