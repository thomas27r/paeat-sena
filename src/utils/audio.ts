import { useState, useEffect } from 'react';

// Web Audio API Synthesizer for subtle, responsive UI sound effects
// No external assets required, instant zero-latency playback

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

// In-memory audio mute status (no local storage persistence)
let inMemoryMuted = false;

export const isAudioMuted = (): boolean => {
  return inMemoryMuted;
};

export const setAudioMuted = (muted: boolean): void => {
  inMemoryMuted = muted;
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('paeat_audio_muted_change', { detail: muted }));
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('paeat_sync_channel');
      channel.postMessage({ type: 'SYNC_AUDIO_MUTE', payload: muted });
      channel.close();
    }
  } catch {
    // Ignore broadcast errors
  }
};

export const toggleAudioMute = (): boolean => {
  const nextState = !isAudioMuted();
  setAudioMuted(nextState);
  if (!nextState) {
    playSuccessSound();
  }
  return nextState;
};

/**
 * React hook to observe and toggle audio mute status across components and tabs
 */
export const useAudioMuted = (): [boolean, (muted: boolean) => void, () => boolean] => {
  const [muted, setMuted] = useState<boolean>(() => isAudioMuted());

  useEffect(() => {
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setMuted(customEvent.detail ?? isAudioMuted());
    };

    window.addEventListener('paeat_audio_muted_change', handleCustomChange);

    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('paeat_sync_channel');
        channel.onmessage = (ev) => {
          if (ev.data && ev.data.type === 'SYNC_AUDIO_MUTE') {
            setMuted(Boolean(ev.data.payload));
          }
        };
      } catch {
        // BroadcastChannel unavailable
      }
    }

    return () => {
      window.removeEventListener('paeat_audio_muted_change', handleCustomChange);
      if (channel) {
        channel.close();
      }
    };
  }, []);

  const updateMute = (newVal: boolean) => {
    setAudioMuted(newVal);
    setMuted(newVal);
  };

  const toggle = () => {
    const next = toggleAudioMute();
    setMuted(next);
    return next;
  };

  return [muted, updateMute, toggle];
};

// Subtle UI click / tap pop
export const playTapSound = () => {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  } catch {
    // ignore audio failure
  }
};

// Satisfying Delivery Success Chime (Major uplifting 2-chord chime)
export const playDeliverySuccessSound = () => {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // First tone (E5 ~ 659Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.06, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.13);

    // Second tone (B5 ~ 987Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.06);
    gain2.gain.setValueAtTime(0.08, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.23);
  } catch {
    // ignore
  }
};

// Reset to pending / toggle off sound
export const playToggleOffSound = () => {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  } catch {
    // ignore
  }
};

// General Success Chime (for saving, imports, actions)
export const playSuccessSound = () => {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.05);

      gain.gain.setValueAtTime(0.05, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.16);
    });
  } catch {
    // ignore
  }
};

// Soft Navigation / Transition sound
export const playNavSound = () => {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.05);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.055);
  } catch {
    // ignore
  }
};

// Delete / Danger action soft sound
export const playDeleteSound = () => {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  } catch {
    // ignore
  }
};

// Notification / Toast Ding
export const playNotificationSound = () => {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.06);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.21);
  } catch {
    // ignore
  }
};
