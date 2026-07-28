import { useState } from 'react';
import { TkCard } from '@takeoff-ui/react';

const API_BASE = 'http://localhost:5005';

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '12px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px',
  background: 'var(--card-bg-alt)',
  color: 'var(--text-primary)',
};

// Reuses the same backend endpoint as the old "forgot password" flow (username + old password +
// new password) — the only thing that changed is WHERE this lives: here the user is already
// logged in, so we know their username already and don't need to ask for it.
function ChangePassword({ currentUser }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, oldPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Could not update password.');
        return;
      }
      setSuccess('Password updated successfully.');
      setOldPassword('');
      setNewPassword('');
    } catch {
      setError('Could not connect to the server.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '48px' }}>
      <h2>Change Password</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Update the password for your account ({currentUser.username}).</p>
      <TkCard style={{ width: '360px' }}>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Current Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={inputStyle}
          />
          {error && <p style={{ color: '#c8102e', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
          {success && <p style={{ color: '#1a7f4e', fontSize: '13px', marginBottom: '12px' }}>{success}</p>}
          <button
            type="submit"
            style={{ width: '100%', padding: '10px 20px', background: '#3a1013', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Update Password
          </button>
        </form>
      </TkCard>
    </div>
  );
}

export default ChangePassword;
