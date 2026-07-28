import { useState, useEffect } from 'react';
import { TkCard } from '@takeoff-ui/react';

const API_BASE = 'http://localhost:5005';
const ROLE_OPTIONS = ['User', 'Admin'];

function Users({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/users`);
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }

  async function handleRoleChange(userId, newRoleName) {
    setError('');
    const res = await fetch(`${API_BASE}/api/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actingUserId: currentUser.id, newRoleName }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || 'Failed to change role.');
      return;
    }
    await loadUsers();
  }

  async function handleDelete(user) {
    if (user.id === currentUser.id) {
      setError('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) {
      return;
    }
    setError('');
    const res = await fetch(`${API_BASE}/api/users/${user.id}?actingUserId=${currentUser.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || 'Failed to delete user.');
      return;
    }
    await loadUsers();
  }

  return (
    <div>
      <h2>User Management</h2>
      <p style={{ color: 'var(--text-muted)' }}>Only Admin users can change roles.</p>
      {error && <p style={{ color: '#c8102e', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
      <TkCard style={{ marginTop: '16px' }}>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Username</th>
                <th style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Full Name</th>
                <th style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Role</th>
                <th style={{ padding: '10px', width: '48px' }}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px', color: 'var(--text-primary)' }}>{u.username}</td>
                  <td style={{ padding: '10px', color: 'var(--text-primary)' }}>{u.fullName}</td>
                  <td style={{ padding: '10px', width: '160px' }}>
                    <select
                      value={u.roleName}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(u)}
                      title="Delete user"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c8102e', padding: '4px' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TkCard>
    </div>
  );
}

export default Users;
