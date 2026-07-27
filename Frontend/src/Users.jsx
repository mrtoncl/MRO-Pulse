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
