import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import ViolationTable from '../components/ViolationTable';
import { useFocusMonitor } from '../utils/useFocusMonitor';
import api from '../utils/api';
import { useAuth } from '../utils/AuthContext';

function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleTimeString();
}

export default function Dashboard() {
  const { user } = useAuth();
  const [violations, setViolations] = useState([]);
  const [isAlarm, setIsAlarm] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(true);
  const [focusStatus, setFocusStatus] = useState('FOCUSED');
  const [sessionViolations, setSessionViolations] = useState(0);
  const [awayLogs, setAwayLogs] = useState([]);
  const [awayLogsLoading, setAwayLogsLoading] = useState(false);

  const fetchViolations = useCallback(async () => {
    try {
      const res = await api.get('/my-violations');
      setViolations(res.data.violations);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchViolations();
  }, [fetchViolations]);

  const { stopAlarm, sessionId } = useFocusMonitor({
    onViolation: (v) => {
      setViolations(prev => [{ ...v, _id: Date.now(), username: user?.username }, ...prev]);
      setFocusStatus('VIOLATION DETECTED');
    },
    onAlarmStart: () => {
      setIsAlarm(true);
      setFocusStatus('FOCUS LOST — ALARM ACTIVE');
    },
    onAlarmStop: () => {
      setIsAlarm(false);
      setCountdown(0);
      setFocusStatus('FOCUSED');
    },
    onCountdown: (val) => setCountdown(val),
    onViolationCount: (count) => setSessionViolations(count)
  });

  const fetchAwayLogs = useCallback(async () => {
    if (!sessionId) return;
    setAwayLogsLoading(true);
    try {
      const res = await api.get(`/away-time/${sessionId}`);
      setAwayLogs(res.data.logs || []);
    } catch {}
    setAwayLogsLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchAwayLogs();
    const interval = setInterval(fetchAwayLogs, 10000);
    return () => clearInterval(interval);
  }, [fetchAwayLogs]);

  const handleDismiss = () => {
    stopAlarm();
    setFocusStatus('FOCUSED');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }} className={isAlarm ? 'alarm-active' : ''}>
      <Navbar violationCount={violations.length} />

      {/* Alarm overlay */}
      {isAlarm && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255, 59, 92, 0.08)',
            border: '3px solid var(--accent)',
            zIndex: 200,
            pointerEvents: 'none',
            animation: 'alarm-flash 0.5s ease infinite'
          }}
        />
      )}

      {/* Alarm banner */}
      {isAlarm && (
        <div style={{
          background: 'var(--accent)',
          color: 'white',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 300,
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.01em' }}>
              🚨 FOCUS VIOLATION DETECTED
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700 }}>
              {countdown}s
            </span>
          </div>
          <button
            onClick={handleDismiss}
            style={{
              background: 'white',
              color: 'var(--accent)',
              border: 'none',
              padding: '8px 20px',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            DISMISS ALARM
          </button>
        </div>
      )}

      <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Status panel */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {/* Focus Status */}
          <div style={{ background: 'var(--surface)', border: `1px solid ${isAlarm ? 'var(--accent)' : 'var(--border)'}`, padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: isAlarm ? 'var(--accent)' : 'var(--green)' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>FOCUS STATUS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: isAlarm ? 'var(--accent)' : 'var(--green)',
                animation: 'pulse-dot 2s ease infinite'
              }} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: isAlarm ? 'var(--accent)' : 'var(--green)', letterSpacing: '0.05em' }}>
                {focusStatus}
              </span>
            </div>
          </div>

          {/* Session Violations */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: sessionViolations > 0 ? 'var(--accent)' : 'var(--border)' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>SESSION VIOLATIONS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '40px', fontWeight: 700, color: sessionViolations > 0 ? 'var(--accent)' : 'var(--green)', lineHeight: 1 }}>
              {sessionViolations}
            </div>
          </div>

          {/* Total Violations */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: violations.length > 0 ? 'var(--yellow)' : 'var(--border)' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>TOTAL VIOLATIONS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '40px', fontWeight: 700, color: violations.length > 0 ? 'var(--yellow)' : 'var(--green)', lineHeight: 1 }}>
              {violations.length}
            </div>
          </div>

          {/* Alarm countdown */}
          <div style={{ background: 'var(--surface)', border: `1px solid ${isAlarm ? 'var(--accent)' : 'var(--border)'}`, padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: isAlarm ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>ALARM TIMER</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '40px', fontWeight: 700, color: isAlarm ? 'var(--accent)' : 'var(--text-muted)', lineHeight: 1 }}>
              {isAlarm ? `${countdown}s` : '—'}
            </div>
          </div>

          {/* User info */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#a29bfe' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>SESSION USER</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
              {user?.username}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.1em' }}>
              ROLE: {user?.role?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '6px', height: '6px', background: 'var(--green)', borderRadius: '50%', flexShrink: 0, animation: 'pulse-dot 2s ease infinite' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            MONITORING ACTIVE — Switching tabs, minimizing the browser, switching applications, or inactivity will trigger a 30-second alarm.
          </span>
        </div>

        {/* Focus Activity Log */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: '24px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              // FOCUS ACTIVITY LOG
            </h2>
            <button
              onClick={fetchAwayLogs}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '5px 12px', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--green)'; e.target.style.color = 'var(--green)'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)'; }}
            >
              REFRESH
            </button>
          </div>
          {awayLogsLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '12px', letterSpacing: '0.1em' }}>
              LOADING...
            </div>
          ) : awayLogs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '12px', letterSpacing: '0.1em' }}>
              NO AWAY EVENTS RECORDED YET
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Event</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Left Time</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Return Time</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Away Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {awayLogs.map((log, i) => (
                    <tr key={log._id || i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px', color: 'var(--yellow)' }}>Tab Switch</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text)' }}>{formatTime(log.leftAt)}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text)' }}>{formatTime(log.returnedAt)}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--accent)' }}>{log.duration} sec</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Violations table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              // MY VIOLATION LOG
            </h2>
            <button
              onClick={fetchViolations}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '5px 12px', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--green)'; e.target.style.color = 'var(--green)'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)'; }}
            >
              REFRESH
            </button>
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '12px', letterSpacing: '0.1em' }}>
              LOADING...
            </div>
          ) : (
            <ViolationTable violations={violations} showUser={false} />
          )}
        </div>
      </div>
    </div>
  );
}
