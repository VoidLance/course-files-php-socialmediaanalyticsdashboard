import { useEffect, useState } from 'react';
import { getAuthBootstrapStatus, loginUser, registerUser, setToken, verifyEmailToken } from '../services/api.js';

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    fullName: '',
    role: 'admin',
    email: '',
    password: '',
    mfaCode: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const status = await getAuthBootstrapStatus();
        if (!status.hasUsers) {
          setMode('register');
        }
      } catch (_err) {
        // Bootstrap endpoint ghosted us, so we keep the default mode.
      }
    }

    init();
  }, []);

  function onChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      if (mode === 'register') {
        const registered = await registerUser({
          fullName: form.fullName,
          role: form.role,
          email: form.email,
          password: form.password,
        });

        if (registered.emailVerificationToken) {
          await verifyEmailToken(registered.emailVerificationToken);
        }
      }

      const login = await loginUser({
        email: form.email,
        password: form.password,
        mfaCode: form.mfaCode || undefined,
      });

      setToken(login.accessToken);
      onAuthenticated(login.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="auth-switch" role="tablist" aria-label="Authentication mode">
        <button
          type="button"
          className={mode === 'login' ? 'auth-tab active' : 'auth-tab'}
          onClick={() => setMode('login')}
        >
          Sign In
        </button>
        <button
          type="button"
          className={mode === 'register' ? 'auth-tab active' : 'auth-tab'}
          onClick={() => setMode('register')}
        >
          Create Account
        </button>
      </div>

      <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
      <p>Use your role-based account to manage teams, analytics, and scheduling.</p>

      <form className="stack" onSubmit={onSubmit}>
        {mode === 'register' ? (
          <>
            <label>
              Full name
              <input name="fullName" value={form.fullName} onChange={onChange} required />
            </label>
            <label>
              Role
              <select name="role" value={form.role} onChange={onChange}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="analyst">Analyst</option>
              </select>
            </label>
          </>
        ) : null}

        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={onChange} required />
        </label>

        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={onChange} required />
        </label>

        <label>
          MFA code (if enabled)
          <input name="mfaCode" inputMode="numeric" value={form.mfaCode} onChange={onChange} placeholder="123456" />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button type="submit" disabled={busy}>
          {busy ? 'Working...' : mode === 'login' ? 'Sign In' : 'Register and Sign In'}
        </button>
      </form>
    </section>
  );
}
