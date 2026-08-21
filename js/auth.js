/* LUXORA — auth.js
   Frontend-only demo authentication. This does NOT provide real security:
   no passwords are hashed, no server validates credentials, and anyone
   with access to this browser's localStorage can read the stored data.
   It exists purely to demonstrate a login/register UI flow. */

window.PageInit = window.PageInit || {};

window.PageInit.login = function(){
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form).entries());
    let ok = true;
    const emailField = form.querySelector('[name="email"]');
    const passField = form.querySelector('[name="password"]');
    if (!/^\S+@\S+\.\S+$/.test(fd.email)){ emailField.closest('.field').classList.add('has-error'); ok = false; }
    else emailField.closest('.field').classList.remove('has-error');
    if (!fd.password || fd.password.length < 4){ passField.closest('.field').classList.add('has-error'); ok = false; }
    else passField.closest('.field').classList.remove('has-error');
    if (!ok) return;

    State.saveUser({ name: fd.email.split('@')[0], email: fd.email });
    Components.toast('Welcome back!');
    setTimeout(() => window.location.href = 'account.html', 500);
  });
};

window.PageInit.register = function(){
  const form = document.getElementById('registerForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form).entries());
    let ok = true;
    const check = (name, test) => {
      const input = form.querySelector(`[name="${name}"]`);
      const bad = !test(fd[name] || '');
      input.closest('.field').classList.toggle('has-error', bad);
      if (bad) ok = false;
    };
    check('name', v => v.trim().length > 1);
    check('email', v => /^\S+@\S+\.\S+$/.test(v));
    check('password', v => v.length >= 4);
    check('confirmPassword', v => v === fd.password);
    if (!ok) return;

    State.saveUser({ name: fd.name, email: fd.email });
    Components.toast('Account created — welcome to LUXORA!');
    setTimeout(() => window.location.href = 'account.html', 500);
  });
};
