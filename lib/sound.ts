'use client';

export type SoundProfile = 'bell' | 'zen' | 'digital' | 'marimba';

export const SOUND_PROFILES: {
  id: SoundProfile;
  label: string;
  description: string;
}[] = [
  {
    id: 'bell',
    label: 'Chuông cơ học',
    description: 'Âm vang kim loại ấm áp như đồng hồ để bàn truyền thống',
  },
  {
    id: 'zen',
    label: 'Chuông ngân êm dịu',
    description: 'Âm thanh trầm ấm, thư giãn cho giờ học và làm việc tập trung',
  },
  {
    id: 'digital',
    label: 'Bíp kỹ thuật số',
    description: 'Nhịp bíp rõ ràng, dứt khoát và dễ nhận biết từ xa',
  },
  {
    id: 'marimba',
    label: 'Hợp âm ấm',
    description: 'Giai điệu ba nốt nhẹ nhàng báo hiệu hoàn thành phiên',
  },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private alarmInterval: ReturnType<typeof setInterval> | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as {webkitAudioContext: typeof AudioContext})
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    this.getContext();
  }

  public playTick(volume = 0.25) {
    const ctx = this.getContext();
    if (!ctx || volume <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.018);

    gain.gain.setValueAtTime(volume * 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.02);
  }

  public playClick(volume = 0.4) {
    const ctx = this.getContext();
    if (!ctx || volume <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.03);

    gain.gain.setValueAtTime(volume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  }

  public playChime(profile: SoundProfile = 'bell', volume = 0.8) {
    const ctx = this.getContext();
    if (!ctx || volume <= 0) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), now);
    masterGain.connect(ctx.destination);

    if (profile === 'bell') {
      // Classic mechanical desk timer double-strike bell
      const strikeTimes = [0, 0.22];
      strikeTimes.forEach((offset) => {
        const partials = [
          {freq: 1174.66, amp: 0.55, decay: 1.4}, // D6
          {freq: 2349.32, amp: 0.3, decay: 0.9}, // D7
          {freq: 3135.96, amp: 0.2, decay: 0.55}, // G7 overtone
          {freq: 4186.01, amp: 0.12, decay: 0.35}, // C8 metallic transient
        ];
        partials.forEach(({freq, amp, decay}) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + offset);

          gain.gain.setValueAtTime(0.0001, now + offset);
          gain.gain.linearRampToValueAtTime(amp, now + offset + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + decay);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + offset);
          osc.stop(now + offset + decay + 0.02);
        });
      });
    } else if (profile === 'zen') {
      // Warm harmonic singing bowl chime
      const partials = [
        {freq: 528, amp: 0.5, decay: 2.6},
        {freq: 792, amp: 0.25, decay: 2.1},
        {freq: 1056, amp: 0.15, decay: 1.6},
      ];
      partials.forEach(({freq, amp, decay}) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(amp, now + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + decay + 0.05);
      });
    } else if (profile === 'digital') {
      // Classic 4-beep digital timer pattern
      const offsets = [0, 0.12, 0.24, 0.36];
      offsets.forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(2048, now + offset);

        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.linearRampToValueAtTime(0.28, now + offset + 0.005);
        gain.gain.setValueAtTime(0.28, now + offset + 0.065);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.085);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
    } else if (profile === 'marimba') {
      // Ascending warm triad: C5 - E5 - G5 - C6
      const notes = [
        {freq: 523.25, offset: 0},
        {freq: 659.25, offset: 0.13},
        {freq: 783.99, offset: 0.26},
        {freq: 1046.5, offset: 0.39},
      ];
      notes.forEach(({freq, offset}) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + offset);

        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.linearRampToValueAtTime(0.55, now + offset + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.55);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + offset);
        osc.stop(now + offset + 0.6);
      });
    }
  }

  public startAlarmLoop(profile: SoundProfile = 'bell', volume = 0.85) {
    this.stopAlarmLoop();
    this.playChime(profile, volume);
    let count = 1;
    this.alarmInterval = setInterval(() => {
      if (count >= 8) {
        this.stopAlarmLoop();
        return;
      }
      this.playChime(profile, volume);
      count += 1;
    }, 1800);
  }

  public stopAlarmLoop() {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();
