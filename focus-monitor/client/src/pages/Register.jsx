import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div style={{ position: 'fixed', top: '20px', left: '20px', width: '40px', height: '40px', borderTop: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)' }} />
      <div style={{ position: 'fixed', top: '20px', right: '20px', width: '40px', height: '40px', borderTop: '2px solid var(--accent)', borderRight: '2px solid var(--accent)' }} />
      <div style={{ position: 'fixed', bottom: '20px', left: '20px', width: '40px', height: '40px', borderBottom: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)' }} />
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '40px', height: '40px', borderBottom: '2px solid var(--accent)', borderRight: '2px solid var(--accent)' }} />

      <div className="animate-slide-up w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            FOCUS<span style={{ color: 'var(--accent)' }}>GUARD</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', letterSpacing: '0.1em' }}>
            CREATE NEW ACCOUNT
          </p>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '40px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--green), transparent)' }} />

          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '28px', textTransform: 'uppercase' }}>
            // NEW USER REGISTRATION
          </h2>

          {error && (
            <div style={{ background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.3)', color: 'var(--accent)', padding: '12px 16px', marginBottom: '20px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                USERNAME
              </label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
                placeholder="choose a username"
                required
                minLength={3}
                className="input-field"
                style={{ width: '100%', padding: '12px 16px', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="min 6 characters"
                required
                minLength={6}
                className="input-field"
                style={{ width: '100%', padding: '12px 16px', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                ROLE
              </label>
              <select
                value={form.role}
                onChange={e => setForm({...form, role: e.target.value})}
                className="input-field"
                style={{ width: '100%', padding: '12px 16px', fontSize: '14px' }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ padding: '14px', fontSize: '13px', marginTop: '4px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, background: 'var(--green)', color: '#000' }}
            >
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '24px', textAlign: 'center' }}>
            HAVE ACCOUNT?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              LOGIN
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
