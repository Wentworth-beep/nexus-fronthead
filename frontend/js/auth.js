// PAGE: /login.html AND /register.html
// Both pages include this file; it auto-detects which form is present.

(function () {
  const loginForm = document.getElementById('loginForm');
  const regForm = document.getElementById('regForm');
  const msg = document.getElementById('msg');

  function showSuccess(text) {
    msg.innerHTML = `<div class="form-msg success">${text}</div>`;
  }
  function showError(text) {
    msg.innerHTML = `<div class="form-msg error">${text}</div>`;
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.innerHTML = '';
      const form = new FormData(loginForm);
      const submitButton = loginForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Logging in...';
      try {
        await API.post('/api/auth/login', {
          email: form.get('email'),
          password: form.get('password'),
        });
        showSuccess('Signed in! Redirecting…');
        if (typeof toast === 'function') toast('Signed in successfully!');
        setTimeout(() => (location.href = '/'), 600);
      } catch (err) {
        showError(err.message);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Sign In';
      }
    });
  }

  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.innerHTML = '';
      const form = new FormData(regForm);
      try {
        await API.post('/api/auth/register', {
          firstName: form.get('firstName') || null,
          lastName: form.get('lastName') || null,
          email: form.get('email'),
          password: form.get('password'),
        });
        showSuccess('Account created! Redirecting…');
        if (typeof toast === 'function') toast('Account created successfully!');
        setTimeout(() => (location.href = '/'), 600);
      } catch (err) {
        showError(err.message);
      }
    });
  }
})();