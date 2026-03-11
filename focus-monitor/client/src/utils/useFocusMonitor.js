import { useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';

const BUZZER_DURATION = 30000; // 30 seconds
const INACTIVITY_THRESHOLD = 5000; // 5 seconds
const SWEEP_INTERVAL = 500; // 0.5s per sweep cycle

let audioContext = null;
let audioUnlocked = false;

// ─── AudioContext: single shared instance ────────────────────────────────────
function getAudioContext() {
  if (!audioContext) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      audioContext = new AC();
    }
  }
  return audioContext;
}

// ─── Unlock audio on first user gesture ──────────────────────────────────────
// Browsers block AudioContext until a real user interaction happens.
// We register this listener immediately when the module loads so the
// AudioContext is warm by the time the first violation fires.
function unlockAudio() {
  if (audioUnlocked) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const unlock = () => {
    if (audioUnlocked) return;
    // Create + immediately stop a silent buffer — this satisfies the browser
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    src.stop(0.001);

    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    audioUnlocked = true;
  };

  // Any interaction unlocks — use capture so we catch it before React
  ['click', 'keydown', 'mousedown', 'touchstart'].forEach(ev => {
    window.addEventListener(ev, unlock, { once: true, capture: true });
  });
}

// Call once at module load time
unlockAudio();

// ─── Buzzer: BIG CONTINUOUS SIREN for exactly `duration` seconds ────────────
// Uses DUAL oscillators (sawtooth + square) + heavy distortion for MAXIMUM impact
// LFO modulation ensures smooth, gap-free frequency sweep 700Hz ↔ 1500Hz
function startBuzzer(duration = 30) {
  const ctx = getAudioContext();
  if (!ctx) return null;

  // Make sure context is running
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const stopAt = now + duration;

  // ── DUAL OSCILLATORS for BIG SOUND ──
  // Sawtooth (harsh, complex harmonics)
  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.value = 1100;

  // Square (sharp, aggressive)
  const osc2 = ctx.createOscillator();
  osc2.type = 'square';
  osc2.frequency.value = 1100;

  // ── LFO for SMOOTH frequency sweep 700Hz ↔ 1500Hz ──
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 2; // 2 Hz = one full sweep every 0.5s

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 400; // sweep amplitude ±400 Hz around centre

  lfo.connect(lfoGain);
  lfoGain.connect(osc1.frequency);
  lfoGain.connect(osc2.frequency);

  // ── HEAVY DISTORTION for aggressive alarm bite ──
  const distortion = ctx.createWaveShaper();
  distortion.curve = makeAggressiveDistortionCurve(400);
  distortion.oversample = '4x';

  // ── MIXER: blend both oscillators ──
  const mixer = ctx.createGain();
  mixer.gain.value = 1.0; // combine at full strength

  // ── MASTER GAIN: LOUD (0.95 = near maximum) ──
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.95, now);
  masterGain.gain.setValueAtTime(0.95, stopAt);

  // ── SIGNAL CHAIN ──
  osc1.connect(mixer);
  osc2.connect(mixer);
  mixer.connect(distortion);
  distortion.connect(masterGain);
  masterGain.connect(ctx.destination);

  // ── START ALL OSCILLATORS ──
  lfo.start(now);
  osc1.start(now);
  osc2.start(now);

  // ── STOP ALL OSCILLATORS at exact duration ──
  lfo.stop(stopAt);
  osc1.stop(stopAt);
  osc2.stop(stopAt);

  // Return cleanup handle
  return {
    stop: () => {
      try {
        masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
        osc1.stop(ctx.currentTime + 0.06);
        osc2.stop(ctx.currentTime + 0.06);
        lfo.stop(ctx.currentTime + 0.06);
      } catch (_) { /* already stopped */ }
    }
  };
}

// ── AGGRESSIVE DISTORTION CURVE for BIG sound ──
// More aggressive than before for maximum impact
function makeAggressiveDistortionCurve(amount) {
  const samples = 256;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    // Aggressive exponential saturation
    curve[i] = Math.sign(x) * (1 - Math.exp(-Math.abs(x) * (amount / 100)));
  }
  return curve;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useFocusMonitor({ onViolation, onAlarmStart, onAlarmStop, onCountdown }) {
  const alarmTimerRef      = useRef(null);
  const countdownRef       = useRef(null);
  const inactivityRef      = useRef(null);
  const buzzerHandleRef    = useRef(null);
  const isAlarmActive      = useRef(false);
  const lastActivity       = useRef(Date.now());
  const sessionId          = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  // Store callbacks in refs so dependency arrays stay stable across re-renders
  const onViolationRef = useRef(onViolation);
  const onAlarmStartRef = useRef(onAlarmStart);
  const onAlarmStopRef = useRef(onAlarmStop);
  const onCountdownRef = useRef(onCountdown);
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);
  useEffect(() => { onAlarmStartRef.current = onAlarmStart; }, [onAlarmStart]);
  useEffect(() => { onAlarmStopRef.current = onAlarmStop; }, [onAlarmStop]);
  useEffect(() => { onCountdownRef.current = onCountdown; }, [onCountdown]);

  // ── stopAlarm ──────────────────────────────────────────────────────────────
  const stopAlarm = useCallback(() => {
    clearTimeout(alarmTimerRef.current);
    clearInterval(countdownRef.current);
    clearTimeout(inactivityRef.current);
    alarmTimerRef.current = null;
    countdownRef.current  = null;
    inactivityRef.current = null;

    buzzerHandleRef.current?.stop();
    buzzerHandleRef.current = null;

    isAlarmActive.current = false;
    onAlarmStopRef.current?.();
  }, []);

  // ── startAlarm ─────────────────────────────────────────────────────────────
  const startAlarm = useCallback((reason) => {
    // Guard: only one alarm at a time
    if (isAlarmActive.current) return;
    isAlarmActive.current = true;

    // Notify UI
    onAlarmStartRef.current?.();
    onViolationRef.current?.({ reason, timestamp: new Date().toISOString() });

    // Log to backend (fire-and-forget)
    api.post('/violation', { reason, sessionId: sessionId.current }).catch(() => {});

    // Start audio
    buzzerHandleRef.current = startBuzzer(30);

    // Countdown ticker
    let remaining = 30;
    onCountdownRef.current?.(remaining);
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      onCountdownRef.current?.(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }, 1000);

    // Auto-stop after 30 s
    alarmTimerRef.current = setTimeout(() => {
      stopAlarm();
    }, BUZZER_DURATION);
  }, [stopAlarm]);

  // ── Inactivity reset helper ────────────────────────────────────────────────
  const resetInactivity = useCallback(() => {
    lastActivity.current = Date.now();
    clearTimeout(inactivityRef.current);
    inactivityRef.current = setTimeout(() => {
      if (!isAlarmActive.current) {
        startAlarm('focus_lost');
      }
    }, INACTIVITY_THRESHOLD);
  }, [startAlarm]);

  // ── Away-time tracking ─────────────────────────────────────────────────────
  const leaveTimeRef = useRef(null);
  const isAwayRef = useRef(false);

  const handleVisibilityForAwayTime = useCallback(() => {
    if (document.hidden) {
      if (!isAwayRef.current) {
        leaveTimeRef.current = new Date();
        isAwayRef.current = true;
        console.log('User left at:', leaveTimeRef.current.toLocaleTimeString());
      }
    } else if (isAwayRef.current && leaveTimeRef.current) {
      const returnTime = new Date();
      const duration = Math.floor((returnTime - leaveTimeRef.current) / 1000);
      console.log('User returned at:', returnTime.toLocaleTimeString());
      console.log('Away duration:', duration, 'seconds');

      api.post('/away-time', {
        sessionId: sessionId.current,
        leftAt: leaveTimeRef.current,
        returnedAt: returnTime,
        duration
      }).catch(() => {});

      leaveTimeRef.current = null;
      isAwayRef.current = false;
    }
  }, []);

  // ── Event listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    // ── visibilitychange: fires immediately when tab is hidden ──
    const onVisibility = () => {
      handleVisibilityForAwayTime();
      if (document.hidden && !isAlarmActive.current) {
        startAlarm('visibility_hidden');
      }
    };

    // ── window blur: fires when user switches app / minimises ──
    const onBlur = () => {
      if (!isAlarmActive.current) {
        startAlarm('window_blur');
      }
    };

    // ── window focus: reset inactivity timer on return ──
    const onFocus = () => {
      resetInactivity();
    };

    // ── resize: detect window resize (often happens on detach/switch) ──
    const onResize = () => {
      if (!isAlarmActive.current) {
        startAlarm('tab_switch');
      }
    };

    // ── user activity events ──
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'click', 'scroll'];
    const onActivity = () => resetInactivity();

    document.addEventListener('visibilitychange', onVisibility, true);
    window.addEventListener('blur',   onBlur,   true);
    window.addEventListener('focus',  onFocus,  true);
    window.addEventListener('resize', onResize, true);
    activityEvents.forEach(ev => document.addEventListener(ev, onActivity, true));

    // Kick off the inactivity timer right away so it's active from page load
    resetInactivity();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility, true);
      window.removeEventListener('blur',   onBlur,   true);
      window.removeEventListener('focus',  onFocus,  true);
      window.removeEventListener('resize', onResize, true);
      activityEvents.forEach(ev => document.removeEventListener(ev, onActivity, true));
      stopAlarm();
    };
  }, [startAlarm, stopAlarm, resetInactivity]);

  return { stopAlarm, sessionId: sessionId.current };
}
