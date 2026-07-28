import { useState } from 'react';

const API_BASE = 'http://localhost:5005';

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '12px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px',
  background: 'var(--page-bg)',
  color: 'var(--text-primary)',
};

const submitStyle = {
  width: '100%',
  padding: '10px',
  background: '#c8102e',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const linkStyle = { color: '#c8102e', cursor: 'pointer', fontWeight: 'bold' };

// Single card with three internal views (login / signup / forgot-password) — replaces the
// earlier separate Login.jsx + Register.jsx pages with one modern tabbed screen.
function AuthScreen({ onLoginSuccess }) {
  const [view, setView] = useState('login');

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [signupFullName, setSignupFullName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  const [fpEmail, setFpEmail] = useState('');
  const [fpSent, setFpSent] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      if (!res.ok) {
        setLoginError('Incorrect username or password.');
        return;
      }
      const user = await res.json();
      onLoginSuccess(user);
    } catch {
      setLoginError('Could not connect to the server.');
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: signupUsername, password: signupPassword, fullName: signupFullName, roleName: 'User' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSignupError(data.message || 'Registration failed.');
        return;
      }
      setSignupSuccess('Account created — you can log in now.');
      setSignupFullName('');
      setSignupUsername('');
      setSignupPassword('');
    } catch {
      setSignupError('Could not connect to the server.');
    }
  }

  // No real email is sent — this is a demo-only illusion. Asking for the OLD password here (like
  // the earlier version did) never made sense: someone who forgot their password by definition
  // doesn't have it. Real "change password while logged in" now lives in the navbar profile menu
  // instead, where it belongs.
  function handleForgotSubmit(e) {
    e.preventDefault();
    setFpSent(true);
  }

  const tabStyle = (tab) => ({
    flex: 1,
    padding: '10px',
    background: view === tab ? '#c8102e' : 'transparent',
    color: view === tab ? '#fff' : 'var(--text-muted)',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, color 0.15s ease',
  });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
      backgroundImage: 'linear-gradient(rgba(20,4,6,0.55), rgba(20,4,6,0.55)), url(/login-bg.jpg)',
      backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      <div style={{ background: 'var(--card-bg)', padding: '32px', borderRadius: '10px', width: '340px', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>MRO-Pulse</h2>

        {view !== 'forgot' && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'var(--page-bg)', padding: '4px', borderRadius: '8px' }}>
            <button style={tabStyle('login')} onClick={() => setView('login')}>Login</button>
            <button style={tabStyle('signup')} onClick={() => setView('signup')}>Sign Up</button>
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin}>
            <input placeholder="Username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={inputStyle} />
            {loginError && <p style={{ color: '#c8102e', fontSize: '13px', marginBottom: '12px' }}>{loginError}</p>}
            <button type="submit" style={submitStyle}>Log In</button>
            <p style={{ fontSize: '13px', textAlign: 'center', marginTop: '14px' }}>
              <span onClick={() => setView('forgot')} style={linkStyle}>Forgot your password?</span>
            </p>
          </form>
        )}

        {view === 'signup' && (
          <form onSubmit={handleSignup}>
            <input placeholder="Full Name" value={signupFullName} onChange={(e) => setSignupFullName(e.target.value)} style={inputStyle} />
            <input placeholder="Username" value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} style={inputStyle} />
            {signupError && <p style={{ color: '#c8102e', fontSize: '13px', marginBottom: '12px' }}>{signupError}</p>}
            {signupSuccess && <p style={{ color: '#1a7f4e', fontSize: '13px', marginBottom: '12px' }}>{signupSuccess}</p>}
            <button type="submit" style={submitStyle}>Sign Up</button>
          </form>
        )}

        {view === 'forgot' && (
          <div>
            <h3 style={{ marginBottom: '16px' }}>Reset Password</h3>
            {!fpSent ? (
              <form onSubmit={handleForgotSubmit}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Enter your email and we'll send you a link to reset your password.
                </p>
                <input type="email" placeholder="Email address" value={fpEmail} onChange={(e) => setFpEmail(e.target.value)} style={inputStyle} required />
                <button type="submit" style={{ ...submitStyle, marginBottom: '10px' }}>Send Reset Link</button>
              </form>
            ) : (
              <p style={{ fontSize: '13px', color: '#1a7f4e', marginBottom: '16px' }}>
                A password reset link has been sent to {fpEmail}. Check your inbox.
              </p>
            )}
            <p style={{ fontSize: '13px', textAlign: 'center' }}>
              <span onClick={() => { setView('login'); setFpSent(false); setFpEmail(''); }} style={linkStyle}>Back to Login</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthScreen;
