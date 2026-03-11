import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import ViolationTable from '../components/ViolationTable';
import api from '../utils/api';

const REASON_ICONS = {
  tab_switch: '🔄',
  focus_lost: '😴',
  window_blur: '🪟',
  visibility_hidden: '👁️'
};

export default function AdminDashboard() {
  const [violations, setViolations] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('violations');
  const [filterUser, setFilterUser] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, sRes, uRes] = await Promise.all([
        api.get('/violations?limit=200'),
        api.get('/stats'),
        api.get('/auth/users')
      ]);
      setViolations(vRes.data.violations);
      setStats(sRes.data);
      setUsers(uRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredViolations = filterUser
    ? violations.filter(v => v.username?.toLowerCase().includes(filterUser.toLowerCase()))
    : violations;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--yellow)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '8px' }}>
              ★ ADMINISTRATOR
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              ADMIN DASHBOARD
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
              Auto-refresh: 30s
            </span>
            <button
              onClick={fetchData}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '8px 16px', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--yellow)'; e.target.style.color = 'var(--yellow)'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)'; }}
            >
              ↻ REFRESH
            </button>
          </div>
        </div>

        {/* Stats cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <StatCard title="TOTAL VIOLATIONS" value={stats.totalViolations} color="var(--accent)" />
            <StatCard title="LAST 24 HOURS" value={stats.last24h} color="var(--yellow)" />
            <StatCard title="TOTAL USERS" value={users.length} color="var(--green)" />
            <StatCard title="ACTIVE SESSIONS" value={stats.byUser?.length || 0} color="#a29bfe" />
          </div>
        )}

        {/* Breakdown cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            {/* By Reason */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '20px', textTransform: 'uppercase' }}>// VIOLATIONS BY REASON</h3>
              {stats.byReason?.map(item => (
                <div key={item._id} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {REASON_ICONS[item._id] || '⚠️'} {item._id?.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)' }}>{item.count}</span>
                  </div>
                  <div style={{ background: 'var(--surface-2)', height: '4px', width: '100%' }}>
                    <div style={{ background: 'var(--accent)', height: '4px', width: `${Math.min(100, (item.count / stats.totalViolations) * 100)}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Top offenders */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '20px', textTransform: 'uppercase' }}>// TOP VIOLATORS</h3>
              {stats.byUser?.slice(0, 5).map((item, i) => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', width: '16px' }}>#{i+1}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 600 }}>{item._id}</span>
                  </div>
                  <span style={{ background: 'var(--accent-dim)', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '3px 10px' }}>{item.count}</span>
                </div>
              ))}
              {!stats.byUser?.length && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>No data</div>}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '0', borderBottom: '1px solid var(--border)' }}>
          {['violations', 'users'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--text)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '12px 20px',
                cursor: 'pointer',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'violations' ? `// VIOLATIONS (${violations.length})` : `// USERS (${users.length})`}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 'none' }}>
          {activeTab === 'violations' && (
            <>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
                <input
                  type="text"
                  placeholder="FILTER BY USERNAME..."
                  value={filterUser}
                  onChange={e => setFilterUser(e.target.value)}
                  className="input-field"
                  style={{ padding: '8px 14px', fontSize: '12px', width: '240px' }}
                />
              </div>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '12px', letterSpacing: '0.1em' }}>LOADING...</div>
              ) : (
                <ViolationTable violations={filteredViolations} showUser={true} />
              )}
            </>
          )}

          {activeTab === 'users' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['USERNAME', 'ROLE', 'JOINED', 'VIOLATIONS'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', letterSpacing: '0.15em', fontSize: '11px', fontWeight: 400, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const userViolations = violations.filter(v => v.username === u.username).length;
                    return (
                      <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px', color: 'var(--text)', fontWeight: 600 }}>{u.username}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: u.role === 'admin' ? 'rgba(255,214,10,0.1)' : 'rgba(0,229,160,0.1)', color: u.role === 'admin' ? 'var(--yellow)' : 'var(--green)', padding: '3px 10px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ color: userViolations > 0 ? 'var(--accent)' : 'var(--text-muted)', fontWeight: userViolations > 0 ? 700 : 400 }}>{userViolations}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: color }} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '40px', fontWeight: 700, color, lineHeight: 1 }}>{value ?? '—'}</div>
    </div>
  );
}
