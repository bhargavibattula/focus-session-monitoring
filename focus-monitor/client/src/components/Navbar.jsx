import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

export default function Navbar({ violationCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '8px', height: '8px', background: 'var(--green)', borderRadius: '50%', animation: 'pulse-dot 2s ease infinite' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.01em' }}>
          FOCUS<span style={{ color: 'var(--accent)' }}>GUARD</span>
        </span>
      </div>

      {/* Center status */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ color: 'var(--green)' }}>● MONITORING ACTIVE</span>
        {violationCount > 0 && (
          <span style={{ background: 'var(--accent)', color: 'white', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>
            {violationCount} VIOLATIONS
          </span>
        )}
      </div>

      {/* Right: user info + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text)', letterSpacing: '0.05em' }}>{user?.username}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: user?.role === 'admin' ? 'var(--yellow)' : 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{user?.role}</div>
        </div>
        <button
          onClick={handleLogout}
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '6px 12px', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)'; }}
        >
          LOGOUT
        </button>
      </div>
    </nav>
  );
}
