const REASON_LABELS = {
  tab_switch: { label: 'Tab Switch', color: 'var(--accent)', icon: '🔄' },
  focus_lost: { label: 'Focus Lost', color: 'var(--yellow)', icon: '😴' },
  window_blur: { label: 'Window Blur', color: '#ff9f43', icon: '🪟' },
  visibility_hidden: { label: 'Tab Hidden', color: '#a29bfe', icon: '👁️' }
};

export default function ViolationTable({ violations, showUser = false }) {
  if (!violations || violations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '13px', letterSpacing: '0.1em' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>✓</div>
        NO VIOLATIONS RECORDED
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {showUser && (
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', letterSpacing: '0.15em', fontSize: '11px', textTransform: 'uppercase', fontWeight: 400 }}>
                USER
              </th>
            )}
            <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', letterSpacing: '0.15em', fontSize: '11px', textTransform: 'uppercase', fontWeight: 400 }}>
              TIMESTAMP
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', letterSpacing: '0.15em', fontSize: '11px', textTransform: 'uppercase', fontWeight: 400 }}>
              REASON
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', letterSpacing: '0.15em', fontSize: '11px', textTransform: 'uppercase', fontWeight: 400 }}>
              SESSION
            </th>
          </tr>
        </thead>
        <tbody>
          {violations.map((v, i) => {
            const reasonInfo = REASON_LABELS[v.reason] || { label: v.reason, color: 'var(--text-muted)', icon: '⚠️' };
            const ts = new Date(v.timestamp);
            return (
              <tr
                key={v._id || i}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {showUser && (
                  <td style={{ padding: '12px 16px', color: 'var(--text)' }}>{v.username}</td>
                )}
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--text)' }}>{ts.toLocaleDateString()}</span>
                  {' '}
                  <span>{ts.toLocaleTimeString()}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: `${reasonInfo.color}20`, color: reasonInfo.color, padding: '3px 10px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>{reasonInfo.icon}</span>
                    {reasonInfo.label}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '10px' }}>
                  {v.sessionId ? v.sessionId.slice(-8) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
