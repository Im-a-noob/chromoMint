'use client';

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Bell,
  SlidersHorizontal,
  Plus,
  Minus,
  Check,
  Clock,
  Palette,
} from 'lucide-react';
import AnalogDial from './AnalogDial';
import {soundEngine, SOUND_PROFILES, SoundProfile} from '@/lib/sound';
import {TIMER_THEMES, ThemeId} from '@/lib/themes';

type ViewMode = 'centered-large' | 'hybrid' | 'dial-only';

interface PresetItem {
  label: string;
  seconds: number;
  featured?: boolean;
}

const DEFAULT_PRESETS: PresetItem[] = [
  {label: '5 phút', seconds: 5 * 60, featured: true},
  {label: '15 phút', seconds: 15 * 60, featured: true},
  {label: '30 phút', seconds: 30 * 60, featured: true},
  {label: '1 phút', seconds: 1 * 60},
  {label: '10 phút', seconds: 10 * 60},
  {label: '25 phút', seconds: 25 * 60},
  {label: '45 phút', seconds: 45 * 60},
  {label: '60 phút', seconds: 60 * 60},
];

export default function CountdownTimerApp() {
  // Core timer state
  const [totalSeconds, setTotalSeconds] = useState<number>(15 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(15 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Display mode & Theme state
  const [viewMode, setViewMode] = useState<ViewMode>('hybrid');
  const [themeId, setThemeId] = useState<ThemeId>('mint');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showKnobDigital, setShowKnobDigital] = useState<boolean>(false);

  const theme = TIMER_THEMES[themeId];

  // Custom time inputs (Hours, Minutes, Seconds)
  const [customHours, setCustomHours] = useState<string>('0');
  const [customMinutes, setCustomMinutes] = useState<string>('15');
  const [customSeconds, setCustomSeconds] = useState<string>('0');
  const [customPresets, setCustomPresets] = useState<PresetItem[]>([]);

  // Sound settings
  const [soundProfile, setSoundProfile] = useState<SoundProfile>('bell');
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [tickEnabled, setTickEnabled] = useState<boolean>(false);

  // Accurate timestamp reference for drift-free countdown
  const endTimeRef = useRef<number | null>(null);

  // Format helpers
  const formatTimeParts = (secs: number) => {
    const safeSecs = Math.max(0, secs);
    const hrs = Math.floor(safeSecs / 3600);
    const mins = Math.floor((safeSecs % 3600) / 60);
    const remSecs = safeSecs % 60;
    return {
      hrs: String(hrs).padStart(2, '0'),
      mins: String(mins).padStart(2, '0'),
      secs: String(remSecs).padStart(2, '0'),
      hasHours: hrs > 0,
    };
  };

  const syncCustomInputs = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    setCustomHours(String(hrs));
    setCustomMinutes(String(mins));
    setCustomSeconds(String(s));
  };

  // Enter / Exit pure Fullscreen mode
  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true);
    if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      if (typeof document !== 'undefined' && !document.fullscreenElement) {
        // Keep state synced if user pressed browser Esc
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Select a preset or dial duration
  const selectDuration = useCallback(
    (seconds: number) => {
      const clamped = Math.max(1, Math.min(359999, seconds));
      soundEngine.stopAlarmLoop();
      if (!isMuted) {
        soundEngine.playClick(volume);
      }
      setIsRunning(false);
      setIsFinished(false);
      setTotalSeconds(clamped);
      setRemainingSeconds(clamped);
      syncCustomInputs(clamped);
      endTimeRef.current = null;
    },
    [isMuted, volume]
  );

  // Start / Pause handler
  const toggleStartPause = useCallback(() => {
    soundEngine.unlock();
    soundEngine.stopAlarmLoop();

    if (isFinished) {
      setIsFinished(false);
      setRemainingSeconds(totalSeconds);
      endTimeRef.current = Date.now() + totalSeconds * 1000;
      setIsRunning(true);
      if (!isMuted) soundEngine.playClick(volume);
      return;
    }

    if (!isRunning) {
      const targetSecs = remainingSeconds > 0 ? remainingSeconds : totalSeconds;
      if (remainingSeconds === 0) {
        setRemainingSeconds(totalSeconds);
      }
      endTimeRef.current = Date.now() + targetSecs * 1000;
      setIsRunning(true);
      if (!isMuted) soundEngine.playClick(volume);
    } else {
      setIsRunning(false);
      endTimeRef.current = null;
      if (!isMuted) soundEngine.playClick(volume);
    }
  }, [isFinished, isMuted, isRunning, remainingSeconds, totalSeconds, volume]);

  // Reset handler
  const handleReset = useCallback(() => {
    soundEngine.stopAlarmLoop();
    setIsRunning(false);
    setIsFinished(false);
    setRemainingSeconds(totalSeconds);
    endTimeRef.current = null;
    if (!isMuted) soundEngine.playClick(volume);
  }, [isMuted, totalSeconds, volume]);

  // Quick relative adjustments (+1m, -1m, +5m, +30s)
  const adjustBySeconds = (delta: number) => {
    soundEngine.stopAlarmLoop();
    setIsFinished(false);
    const nextRemaining = Math.max(5, Math.min(359999, remainingSeconds + delta));
    const nextTotal = Math.max(nextRemaining, totalSeconds + (delta > 0 ? delta : 0));
    setRemainingSeconds(nextRemaining);
    setTotalSeconds(nextTotal);
    syncCustomInputs(nextRemaining);
    if (isRunning) {
      endTimeRef.current = Date.now() + nextRemaining * 1000;
    }
    if (!isMuted) soundEngine.playClick(volume);
  };

  // Apply custom H:M:S form
  const handleApplyCustomTime = (e: React.FormEvent) => {
    e.preventDefault();
    const h = Math.max(0, parseInt(customHours || '0', 10) || 0);
    const m = Math.max(0, parseInt(customMinutes || '0', 10) || 0);
    const s = Math.max(0, parseInt(customSeconds || '0', 10) || 0);
    const total = h * 3600 + m * 60 + s;
    if (total > 0) {
      selectDuration(total);
    }
  };

  // Save current custom input as a quick preset button
  const handleSaveCustomPreset = () => {
    const h = Math.max(0, parseInt(customHours || '0', 10) || 0);
    const m = Math.max(0, parseInt(customMinutes || '0', 10) || 0);
    const s = Math.max(0, parseInt(customSeconds || '0', 10) || 0);
    const total = h * 3600 + m * 60 + s;
    if (total <= 0) return;

    const parts: string[] = [];
    if (h > 0) parts.push(`${h}g`);
    if (m > 0) parts.push(`${m}p`);
    if (s > 0) parts.push(`${s}s`);
    const label = parts.join(' ');

    if (
      !DEFAULT_PRESETS.some((p) => p.seconds === total) &&
      !customPresets.some((p) => p.seconds === total)
    ) {
      setCustomPresets((prev) => [...prev, {label, seconds: total}]);
    }
    selectDuration(total);
  };

  // Main countdown interval loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (!endTimeRef.current) return;
      const msLeft = endTimeRef.current - Date.now();
      const secsLeft = Math.max(0, Math.ceil(msLeft / 1000));

      setRemainingSeconds((prev) => {
        if (secsLeft !== prev && secsLeft > 0 && tickEnabled && !isMuted) {
          soundEngine.playTick(volume);
        }
        return secsLeft;
      });

      if (secsLeft <= 0) {
        setIsRunning(false);
        setIsFinished(true);
        endTimeRef.current = null;
        if (!isMuted) {
          soundEngine.startAlarmLoop(soundProfile, volume);
        }
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isRunning, tickEnabled, isMuted, soundProfile, volume]);

  // Update document title with live countdown
  useEffect(() => {
    const {hrs, mins, secs, hasHours} = formatTimeParts(remainingSeconds);
    const timeStr = hasHours ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`;
    if (isFinished) {
      document.title = `🔔 HẾT GIỜ! — ChronoMint`;
    } else if (isRunning) {
      document.title = `(${timeStr}) Đang đếm ngược — ChronoMint`;
    } else {
      document.title = `ChronoMint — Đồng Hồ Đếm Ngược Tối Giản`;
    }
  }, [remainingSeconds, isRunning, isFinished]);

  // Keyboard shortcuts: Space to start/pause, R to reset, F to toggle fullscreen, Escape to exit fullscreen
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        toggleStartPause();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (isFullscreen) exitFullscreen();
        else enterFullscreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleStartPause, handleReset, isFullscreen, enterFullscreen, exitFullscreen]);

  const {hrs, mins, secs, hasHours} = formatTimeParts(remainingSeconds);
  const progressPercent =
    totalSeconds > 0
      ? Math.min(100, Math.max(0, ((totalSeconds - remainingSeconds) / totalSeconds) * 100))
      : 0;

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${theme.pageBg} ${theme.textPrimary}`}
    >
      {/* PURE FULLSCREEN MODE: Shows ONLY the clock in the center of the screen */}
      {isFullscreen && (
        <div
          onDoubleClick={exitFullscreen}
          className={`fixed inset-0 z-50 flex items-center justify-center p-6 select-none transition-colors duration-200 ${theme.pageBg} ${theme.textPrimary}`}
        >
          {/* Subtle corner exit button that stays completely invisible unless hovered in top-right corner */}
          <button
            type="button"
            onClick={exitFullscreen}
            aria-label="Thoát toàn màn hình"
            title="Thoát toàn màn hình (Esc hoặc nhấp đúp nền)"
            className={`fixed top-4 right-4 z-50 p-2.5 rounded-xl opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity duration-150 ${
              theme.isDark
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-black/5 text-slate-700 hover:bg-black/10'
            }`}
          >
            <Minimize2 className="w-5 h-5" />
          </button>

          {/* ONLY THE CLOCK depending on selected view mode */}
          {viewMode === 'centered-large' ? (
            <div
              onClick={toggleStartPause}
              title="Nhấp để Bắt đầu / Tạm dừng (Esc để thoát toàn màn hình)"
              style={{color: isFinished ? theme.accent : undefined}}
              className={`cursor-pointer font-[family-name:var(--font-mono)] font-bold tabular-nums tracking-tight leading-none text-center ${
                hasHours
                  ? 'text-[clamp(4rem,16vw,14rem)]'
                  : 'text-[clamp(5.5rem,23vw,18rem)]'
              }`}
            >
              {hasHours ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`}
            </div>
          ) : viewMode === 'dial-only' ? (
            <div
              onClick={() => {
                if (isRunning || isFinished) toggleStartPause();
              }}
              title="Nhấp để Bắt đầu / Tạm dừng (Esc để thoát toàn màn hình)"
            >
              <AnalogDial
                remainingSeconds={remainingSeconds}
                totalSeconds={totalSeconds}
                isRunning={isRunning}
                onSelectSeconds={selectDuration}
                showCenterDigital={showKnobDigital}
                size="fullscreen"
                theme={theme}
              />
            </div>
          ) : (
            /* Hybrid mode in fullscreen: pure Analog Dial + Digital Clock side-by-side with zero UI chrome */
            <div
              onClick={toggleStartPause}
              title="Nhấp để Bắt đầu / Tạm dừng (Esc để thoát toàn màn hình)"
              className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 cursor-pointer"
            >
              <AnalogDial
                remainingSeconds={remainingSeconds}
                totalSeconds={totalSeconds}
                isRunning={isRunning}
                onSelectSeconds={selectDuration}
                showCenterDigital={showKnobDigital}
                size="large"
                theme={theme}
              />
              <div
                style={{color: isFinished ? theme.accent : undefined}}
                className={`font-[family-name:var(--font-mono)] font-bold tabular-nums tracking-tight leading-none ${
                  hasHours
                    ? 'text-[clamp(3.5rem,9vw,7.5rem)]'
                    : 'text-[clamp(4.5rem,12vw,9.5rem)]'
                }`}
              >
                {hasHours ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Navigation Bar (Strict 3-Zone Contract) */}
      <header
        className={`flex items-center justify-between gap-8 px-6 py-4 backdrop-blur-md border-b sticky top-0 z-30 transition-colors duration-200 ${
          theme.isDark
            ? 'bg-[#181C20]/85 border-white/10'
            : 'bg-white/85 border-slate-200/80'
        }`}
      >
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#timer-stage"
          className={`text-lg font-bold tracking-tight whitespace-nowrap shrink-0 ${theme.textPrimary}`}
        >
          ChronoMint
        </a>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          className={`hidden md:flex items-center gap-6 text-sm font-medium ${theme.textSecondary}`}
        >
          <a
            href="#timer-stage"
            className={`hover:${theme.textPrimary} transition-colors whitespace-nowrap shrink-0`}
          >
            Đồng hồ
          </a>
          <a
            href="#theme-selector"
            className={`hover:${theme.textPrimary} transition-colors whitespace-nowrap shrink-0`}
          >
            Giao diện
          </a>
          <a
            href="#quick-presets"
            className={`hover:${theme.textPrimary} transition-colors whitespace-nowrap shrink-0`}
          >
            Mốc chọn nhanh
          </a>
          <a
            href="#custom-time"
            className={`hover:${theme.textPrimary} transition-colors whitespace-nowrap shrink-0`}
          >
            Tùy chỉnh
          </a>
          <a
            href="#sound-alert"
            className={`hover:${theme.textPrimary} transition-colors whitespace-nowrap shrink-0`}
          >
            Âm báo
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={enterFullscreen}
            style={{backgroundColor: theme.accent}}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 min-h-[40px]"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Toàn màn hình</span>
          </button>
        </div>
      </header>

      {/* Main Content Container (1440px Desktop Presence) */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Alarm Notification Banner when Time is Up */}
        {isFinished && (
          <div
            role="alert"
            style={{backgroundColor: theme.accent}}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl text-white shadow-md"
          >
            <div className="flex items-center gap-3.5">
              <Bell className="w-6 h-6 shrink-0" />
              <div>
                <p className="text-base font-bold">
                  Đã hết thời gian hẹn giờ!
                </p>
                <p className="text-sm text-white/90">
                  Mốc thời gian {Math.floor(totalSeconds / 60)} phút{' '}
                  {totalSeconds % 60 > 0 ? `${totalSeconds % 60} giây` : ''} đã
                  hoàn tất.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleReset}
                style={{color: theme.accent}}
                className="px-5 py-2.5 rounded-xl bg-white text-sm font-bold hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
              >
                Tắt chuông & Đặt lại
              </button>
            </div>
          </div>
        )}

        {/* Primary Timer Stage */}
        <section
          id="timer-stage"
          className={`${theme.cardBg} rounded-3xl border ${theme.cardBorder} p-6 sm:p-10 transition-colors duration-200`}
        >
          {/* Stage Toolbar: Display Mode Switcher & Theme Bar */}
          <div
            className={`flex flex-wrap items-center justify-between gap-4 pb-6 border-b ${
              theme.isDark ? 'border-white/10' : 'border-slate-100'
            }`}
          >
            <div>
              <h1
                className={`text-xl sm:text-2xl font-bold tracking-tight ${theme.textPrimary}`}
              >
                Đồng hồ hẹn giờ đếm ngược
              </h1>
              <p className={`text-sm mt-0.5 ${theme.textMuted}`}>
                Chọn nhanh 5, 15, 30 phút hoặc kéo trực tiếp trên mặt đồng hồ để
                đặt giờ
              </p>
            </div>

            {/* Interactive Segmented Display Switcher */}
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border ${theme.subtleBg} ${theme.cardBorder}`}
            >
              <button
                type="button"
                onClick={() => setViewMode('centered-large')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                  viewMode === 'centered-large'
                    ? `${theme.cardBg} ${theme.textPrimary} shadow-xs`
                    : `${theme.textSecondary} hover:${theme.textPrimary}`
                }`}
              >
                Số lớn giữa màn hình
              </button>
              <button
                type="button"
                onClick={() => setViewMode('hybrid')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                  viewMode === 'hybrid'
                    ? `${theme.cardBg} ${theme.textPrimary} shadow-xs`
                    : `${theme.textSecondary} hover:${theme.textPrimary}`
                }`}
              >
                Mặt đồng hồ & Số
              </button>
              <button
                type="button"
                onClick={() => setViewMode('dial-only')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                  viewMode === 'dial-only'
                    ? `${theme.cardBg} ${theme.textPrimary} shadow-xs`
                    : `${theme.textSecondary} hover:${theme.textPrimary}`
                }`}
              >
                Chỉ mặt đồng hồ
              </button>
            </div>
          </div>

          {/* Theme Picker Strip ("Thêm theme cho giao diện đồng hồ") */}
          <div
            id="theme-selector"
            className={`flex flex-wrap items-center justify-between gap-3 py-4 border-b ${
              theme.isDark ? 'border-white/10' : 'border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Palette className={`w-4 h-4 ${theme.textMuted}`} />
              <span className={`text-xs font-semibold ${theme.textSecondary}`}>
                Chủ đề đồng hồ (Theme):
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(TIMER_THEMES) as ThemeId[]).map((id) => {
                const t = TIMER_THEMES[id];
                const isSelected = themeId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setThemeId(id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                      isSelected
                        ? `${theme.textPrimary} border-current ${theme.subtleBg}`
                        : `${theme.textSecondary} border-transparent hover:${theme.subtleBg}`
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${t.swatchColors[0]} 50%, ${t.swatchColors[1]} 50%)`,
                      }}
                    />
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Display Area depending on ViewMode */}
          {viewMode === 'centered-large' && (
            <div className="py-10 sm:py-16 flex flex-col items-center justify-center text-center">
              <div
                className={`flex items-center gap-2 text-xs font-medium mb-3 ${theme.textMuted}`}
              >
                <span>CHẾ ĐỘ HIỂN THỊ SỐ LỚN CHÍNH GIỮA MÀN HÌNH</span>
                <span aria-hidden="true">·</span>
                <span>
                  {isRunning
                    ? 'Đang chạy'
                    : isFinished
                    ? 'Hết giờ'
                    : 'Sẵn sàng'}
                </span>
              </div>

              {/* Monumental Centered Digital Readout */}
              <div
                onClick={toggleStartPause}
                title="Nhấp vào số để Bắt đầu / Tạm dừng"
                style={{color: isFinished ? theme.accent : undefined}}
                className={`cursor-pointer select-none font-[family-name:var(--font-mono)] font-bold tabular-nums tracking-tight leading-none my-2 transition-colors ${
                  hasHours
                    ? 'text-[clamp(3.5rem,11vw,8.5rem)]'
                    : 'text-[clamp(4.75rem,16vw,11.5rem)]'
                } ${theme.textPrimary}`}
              >
                {hasHours ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`}
              </div>

              {/* Progress Track */}
              <div
                className={`w-full max-w-xl h-2.5 rounded-full overflow-hidden mt-6 ${theme.subtleBg}`}
              >
                <div
                  className="h-full transition-transform duration-200 origin-left"
                  style={{
                    backgroundColor: theme.accent,
                    transform: `scaleX(${Math.max(
                      0,
                      remainingSeconds / Math.max(1, totalSeconds)
                    )})`,
                  }}
                />
              </div>

              <div
                className={`mt-4 flex items-center gap-3 text-xs ${theme.textMuted}`}
              >
                <span>
                  Đã trôi qua:{' '}
                  <strong
                    className={`font-[family-name:var(--font-mono)] tabular-nums ${theme.textPrimary}`}
                  >
                    {Math.round(progressPercent)}%
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={enterFullscreen}
                  style={{color: theme.accent}}
                  className="font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Chỉ hiện đồng hồ toàn màn hình</span>
                </button>
              </div>
            </div>
          )}

          {viewMode === 'hybrid' && (
            <div className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left / Center-Left: Tactile Analog Timer with Active Theme */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center">
                <AnalogDial
                  remainingSeconds={remainingSeconds}
                  totalSeconds={totalSeconds}
                  isRunning={isRunning}
                  onSelectSeconds={selectDuration}
                  showCenterDigital={showKnobDigital}
                  size="normal"
                  theme={theme}
                />
                <div
                  className={`mt-4 flex items-center gap-3 text-xs ${theme.textMuted}`}
                >
                  <span>Nhấp hoặc kéo trên vạch số để đặt nhanh số phút</span>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => setShowKnobDigital((v) => !v)}
                    className={`${theme.textSecondary} font-medium hover:${theme.textPrimary} underline underline-offset-2`}
                  >
                    {showKnobDigital ? 'Hiện núm kim loại' : 'Hiện số ở tâm'}
                  </button>
                </div>
              </div>

              {/* Right / Center-Right: Large Centered Digital Readout & Controls */}
              <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left justify-center">
                <div
                  className={`flex items-center gap-2 text-xs font-medium ${theme.textMuted}`}
                >
                  <span>THỜI GIAN CÒN LẠI</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Tổng mốc: {Math.floor(totalSeconds / 60)} phút{' '}
                    {totalSeconds % 60 > 0 ? `${totalSeconds % 60} giây` : ''}
                  </span>
                </div>

                <div
                  onClick={toggleStartPause}
                  title="Nhấp để Bắt đầu / Tạm dừng"
                  style={{color: isFinished ? theme.accent : undefined}}
                  className={`cursor-pointer select-none font-[family-name:var(--font-mono)] font-bold tabular-nums tracking-tight leading-none mt-2 mb-5 ${
                    hasHours
                      ? 'text-5xl sm:text-6xl xl:text-7xl'
                      : 'text-6xl sm:text-7xl xl:text-8xl'
                  } ${theme.textPrimary}`}
                >
                  {hasHours ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`}
                </div>

                {/* Progress Bar */}
                <div
                  className={`w-full max-w-md h-2 rounded-full overflow-hidden mb-6 ${theme.subtleBg}`}
                >
                  <div
                    className="h-full transition-transform duration-200 origin-left"
                    style={{
                      backgroundColor: theme.accent,
                      transform: `scaleX(${Math.max(
                        0,
                        remainingSeconds / Math.max(1, totalSeconds)
                      )})`,
                    }}
                  />
                </div>

                {/* Fine Stepper Adjustments (-5m, -1m, +1m, +5m, +30s) */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-2">
                  {[
                    {label: '-5 phút', delta: -300},
                    {label: '-1 phút', delta: -60},
                    {label: '+1 phút', delta: 60},
                    {label: '+5 phút', delta: 300},
                    {label: '+30 giây', delta: 30},
                  ].map((adj) => (
                    <button
                      key={adj.label}
                      type="button"
                      onClick={() => adjustBySeconds(adj.delta)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${theme.subtleBg} ${theme.textSecondary} hover:opacity-80 transition-opacity whitespace-nowrap shrink-0 min-h-[36px] font-[family-name:var(--font-mono)] tabular-nums`}
                    >
                      {adj.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'dial-only' && (
            <div className="py-8 flex flex-col items-center justify-center">
              <AnalogDial
                remainingSeconds={remainingSeconds}
                totalSeconds={totalSeconds}
                isRunning={isRunning}
                onSelectSeconds={selectDuration}
                showCenterDigital={showKnobDigital}
                size="large"
                theme={theme}
              />
              <div
                className={`mt-5 flex flex-wrap items-center justify-center gap-3 text-xs ${theme.textMuted}`}
              >
                <span
                  className={`font-[family-name:var(--font-mono)] tabular-nums text-sm font-semibold ${theme.textPrimary}`}
                >
                  {hasHours ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`}
                </span>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setShowKnobDigital((v) => !v)}
                  className={`${theme.textSecondary} font-medium hover:${theme.textPrimary} underline underline-offset-2`}
                >
                  {showKnobDigital
                    ? 'Đổi tâm về núm xoay kim loại'
                    : 'Hiện số điện tử ở tâm đồng hồ'}
                </button>
              </div>
            </div>
          )}

          {/* Primary Action Bar (Start/Pause, Reset, Mute, Fullscreen Clock Only) */}
          <div
            className={`pt-6 border-t flex flex-wrap items-center justify-between gap-4 ${
              theme.isDark ? 'border-white/10' : 'border-slate-100'
            }`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={toggleStartPause}
                style={{backgroundColor: theme.accent}}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-xs whitespace-nowrap shrink-0 min-h-[48px]"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Tạm dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>
                      {isFinished ? 'Bắt đầu lại' : 'Bắt đầu đếm ngược'}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold ${theme.subtleBg} ${theme.textPrimary} hover:opacity-80 transition-opacity whitespace-nowrap shrink-0 min-h-[48px]`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Đặt lại</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const nextMuted = !isMuted;
                  setIsMuted(nextMuted);
                  if (nextMuted) soundEngine.stopAlarmLoop();
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 min-h-[44px] ${
                  isMuted
                    ? `${theme.cardBorder} ${theme.subtleBg} ${theme.textMuted}`
                    : `${theme.cardBorder} ${theme.cardBg} ${theme.textPrimary}`
                }`}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Đã tắt tiếng</span>
                  </>
                ) : (
                  <>
                    <Volume2
                      className="w-4 h-4"
                      style={{color: theme.accent}}
                    />
                    <span>Chuông báo: Bật</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={enterFullscreen}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border ${theme.cardBorder} ${theme.cardBg} ${theme.textPrimary} hover:${theme.subtleBg} transition-colors whitespace-nowrap shrink-0 min-h-[44px]`}
              >
                <Maximize2 className="w-4 h-4" />
                <span>Full màn hình (Chỉ hiện đồng hồ)</span>
              </button>
            </div>
          </div>
        </section>

        {/* Bottom 3-Column Utility Grid: Quick Presets (5/15/30m), Custom Time, & Sound Alert Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Column 1: Quick Preset Buttons (5 phút, 15 phút, 30 phút & extras) */}
          <section
            id="quick-presets"
            className={`lg:col-span-5 ${theme.cardBg} rounded-3xl border ${theme.cardBorder} p-6 flex flex-col justify-between transition-colors duration-200`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-base font-bold ${theme.textPrimary}`}>
                  Mốc thời gian chọn nhanh
                </h2>
                <span className={`text-xs ${theme.textMuted}`}>
                  1 chạm để đặt
                </span>
              </div>

              {/* Primary Featured Presets: 5 phút, 15 phút, 30 phút */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {DEFAULT_PRESETS.filter((p) => p.featured).map((preset) => {
                  const isSelected = totalSeconds === preset.seconds;
                  return (
                    <button
                      key={preset.seconds}
                      type="button"
                      onClick={() => selectDuration(preset.seconds)}
                      style={
                        isSelected
                          ? {
                              backgroundColor: theme.accent,
                              borderColor: theme.accent,
                            }
                          : undefined
                      }
                      className={`flex flex-col items-center justify-center py-4 px-3 rounded-2xl border text-center transition-colors min-h-[76px] ${
                        isSelected
                          ? 'text-white shadow-xs'
                          : `${theme.subtleBg} ${theme.cardBorder} ${theme.textPrimary} hover:opacity-85`
                      }`}
                    >
                      <span className="text-xl font-bold font-[family-name:var(--font-mono)] tabular-nums">
                        {preset.seconds / 60}
                      </span>
                      <span
                        className={`text-xs font-medium mt-0.5 ${
                          isSelected ? 'text-white/90' : theme.textSecondary
                        }`}
                      >
                        phút
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Secondary Presets */}
              <p className={`text-xs font-medium mb-2.5 ${theme.textMuted}`}>
                Mốc bổ sung & Pomodoro
              </p>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_PRESETS.filter((p) => !p.featured)
                  .concat(customPresets)
                  .map((preset) => {
                    const isSelected = totalSeconds === preset.seconds;
                    return (
                      <button
                        key={`${preset.label}-${preset.seconds}`}
                        type="button"
                        onClick={() => selectDuration(preset.seconds)}
                        style={
                          isSelected
                            ? {backgroundColor: theme.accent}
                            : undefined
                        }
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[40px] font-[family-name:var(--font-mono)] tabular-nums ${
                          isSelected
                            ? 'text-white'
                            : `${theme.subtleBg} ${theme.textSecondary} hover:opacity-80`
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div
              className={`mt-6 pt-4 border-t flex items-center justify-between text-xs ${
                theme.isDark ? 'border-white/10' : 'border-slate-100'
              } ${theme.textMuted}`}
            >
              <span>Phím tắt: Space (Chạy/Dừng) · F (Full)</span>
              <span>Phím R (Đặt lại)</span>
            </div>
          </section>

          {/* Column 2: Custom Duration Input ("Tùy chỉnh thời gian theo ý muốn") */}
          <section
            id="custom-time"
            className={`lg:col-span-4 ${theme.cardBg} rounded-3xl border ${theme.cardBorder} p-6 flex flex-col justify-between transition-colors duration-200`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-base font-bold ${theme.textPrimary}`}>
                  Tùy chỉnh thời gian
                </h2>
                <Clock className={`w-4 h-4 ${theme.textMuted}`} />
              </div>

              <form onSubmit={handleApplyCustomTime} className="space-y-4">
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label
                      htmlFor="input-hours"
                      className={`block text-xs font-medium mb-1.5 ${theme.textSecondary}`}
                    >
                      Giờ
                    </label>
                    <input
                      id="input-hours"
                      type="number"
                      min={0}
                      max={99}
                      value={customHours}
                      onChange={(e) => setCustomHours(e.target.value)}
                      className={`w-full h-12 px-3 rounded-xl ${theme.subtleBg} border ${theme.cardBorder} text-center font-[family-name:var(--font-mono)] text-lg font-bold tabular-nums ${theme.textPrimary} focus:outline-none`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="input-minutes"
                      className={`block text-xs font-medium mb-1.5 ${theme.textSecondary}`}
                    >
                      Phút
                    </label>
                    <input
                      id="input-minutes"
                      type="number"
                      min={0}
                      max={999}
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      className={`w-full h-12 px-3 rounded-xl ${theme.subtleBg} border ${theme.cardBorder} text-center font-[family-name:var(--font-mono)] text-lg font-bold tabular-nums ${theme.textPrimary} focus:outline-none`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="input-seconds"
                      className={`block text-xs font-medium mb-1.5 ${theme.textSecondary}`}
                    >
                      Giây
                    </label>
                    <input
                      id="input-seconds"
                      type="number"
                      min={0}
                      max={59}
                      value={customSeconds}
                      onChange={(e) => setCustomSeconds(e.target.value)}
                      className={`w-full h-12 px-3 rounded-xl ${theme.subtleBg} border ${theme.cardBorder} text-center font-[family-name:var(--font-mono)] text-lg font-bold tabular-nums ${theme.textPrimary} focus:outline-none`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="submit"
                    style={{backgroundColor: theme.accent}}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 min-h-[44px]"
                  >
                    <Check className="w-4 h-4" />
                    <span>Áp dụng ngay</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCustomPreset}
                    className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-semibold ${theme.subtleBg} ${theme.textSecondary} hover:opacity-80 transition-opacity whitespace-nowrap shrink-0 min-h-[44px]`}
                    title="Lưu thành nút chọn nhanh"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Lưu mốc</span>
                  </button>
                </div>
              </form>
            </div>

            <div
              className={`mt-6 pt-4 border-t flex items-center justify-between ${
                theme.isDark ? 'border-white/10' : 'border-slate-100'
              }`}
            >
              <span className={`text-xs ${theme.textMuted}`}>
                Chỉnh nhanh từng phút:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustBySeconds(-60)}
                  className={`w-9 h-9 rounded-lg ${theme.subtleBg} hover:opacity-80 flex items-center justify-center ${theme.textSecondary}`}
                  aria-label="Giảm 1 phút"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustBySeconds(60)}
                  className={`w-9 h-9 rounded-lg ${theme.subtleBg} hover:opacity-80 flex items-center justify-center ${theme.textSecondary}`}
                  aria-label="Tăng 1 phút"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Column 3: Sound Notification Settings ("Thông báo bằng âm thanh khi hết thời gian") */}
          <section
            id="sound-alert"
            className={`lg:col-span-3 ${theme.cardBg} rounded-3xl border ${theme.cardBorder} p-6 flex flex-col justify-between transition-colors duration-200`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-base font-bold ${theme.textPrimary}`}>
                  Âm thanh báo hết giờ
                </h2>
                <SlidersHorizontal className={`w-4 h-4 ${theme.textMuted}`} />
              </div>

              {/* Sound Profile Selector */}
              <div className="space-y-1.5 mb-4">
                {SOUND_PROFILES.map((item) => {
                  const selected = soundProfile === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSoundProfile(item.id);
                        setIsMuted(false);
                        soundEngine.playChime(item.id, volume);
                      }}
                      style={
                        selected ? {borderColor: theme.accent} : undefined
                      }
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs transition-colors min-h-[42px] border ${
                        selected
                          ? `${theme.subtleBg} ${theme.textPrimary} font-bold`
                          : `${theme.subtleBg}/60 ${theme.textSecondary} hover:${theme.subtleBg} font-medium border-transparent`
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {selected && (
                        <span
                          style={{color: theme.accent}}
                          className="text-[11px] font-semibold shrink-0 ml-2"
                        >
                          Đang chọn
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Volume & Ticking Controls */}
              <div
                className={`space-y-3 pt-2 border-t ${
                  theme.isDark ? 'border-white/10' : 'border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${theme.textSecondary}`}>
                    Âm lượng chuông
                  </span>
                  <span
                    className={`font-[family-name:var(--font-mono)] tabular-nums font-semibold ${theme.textPrimary}`}
                  >
                    {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    if (val > 0) setIsMuted(false);
                  }}
                  style={{accentColor: theme.accent}}
                  aria-label="Âm lượng chuông báo"
                  className="w-full cursor-pointer"
                />

                <label
                  className={`flex items-center justify-between text-xs cursor-pointer pt-1 ${theme.textSecondary}`}
                >
                  <span>Tiếng tích tắc mỗi giây</span>
                  <input
                    type="checkbox"
                    checked={tickEnabled}
                    onChange={(e) => setTickEnabled(e.target.checked)}
                    style={{accentColor: theme.accent}}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <div
              className={`mt-5 pt-4 border-t ${
                theme.isDark ? 'border-white/10' : 'border-slate-100'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setIsMuted(false);
                  soundEngine.playChime(soundProfile, volume);
                }}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold ${theme.subtleBg} ${theme.textPrimary} hover:opacity-85 transition-opacity whitespace-nowrap shrink-0 min-h-[42px]`}
              >
                <Bell
                  className="w-3.5 h-3.5"
                  style={{color: theme.accent}}
                />
                <span>Nghe thử âm báo</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
