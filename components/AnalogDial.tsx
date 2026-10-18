'use client';

import React, {useRef, useState, useCallback} from 'react';
import {TIMER_THEMES, TimerTheme} from '@/lib/themes';

interface AnalogDialProps {
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
  onSelectSeconds: (seconds: number) => void;
  showCenterDigital?: boolean;
  size?: 'normal' | 'large' | 'fullscreen';
  theme?: TimerTheme;
}

export default function AnalogDial({
  remainingSeconds,
  totalSeconds,
  isRunning,
  onSelectSeconds,
  showCenterDigital = false,
  size = 'normal',
  theme = TIMER_THEMES.mint,
}: AnalogDialProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // The physical dial represents 60 minutes (3600 seconds) around 360 degrees.
  // 0 is at top (12 o'clock), numbers 5, 10, 15...55 go clockwise.
  const MAX_DIAL_SECONDS = 3600;
  const clampedSeconds = Math.min(
    MAX_DIAL_SECONDS,
    Math.max(0, remainingSeconds)
  );
  const fraction = clampedSeconds / MAX_DIAL_SECONDS;
  const angleDeg = fraction * 360;

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;

      // Angle from 12 o'clock clockwise (0 to 360)
      let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
      if (deg < 0) deg += 360;

      // Snap to nearest 1 minute when dragging
      const rawMinutes = Math.round((deg / 360) * 60);
      const minutes = Math.max(
        1,
        Math.min(60, rawMinutes === 0 ? 60 : rawMinutes)
      );
      onSelectSeconds(minutes * 60);
    },
    [onSelectSeconds]
  );

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isRunning) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || isRunning) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
  };

  // SVG Geometry constants (viewBox 0 0 400 400, center 200,200)
  const cx = 200;
  const cy = 200;
  const sectorRadius = 112;

  const round3 = (n: number) => Math.round(n * 1000) / 1000;

  // Build SVG path for the countdown sector from 0 deg (top) clockwise to angleDeg
  const getSectorPath = (deg: number) => {
    if (deg <= 0.05) return '';
    if (deg >= 359.95) {
      return `M ${cx} ${cy - sectorRadius} A ${sectorRadius} ${sectorRadius} 0 1 1 ${
        cx - 0.01
      } ${cy - sectorRadius} Z`;
    }
    const rad = ((deg - 90) * Math.PI) / 180;
    const x = round3(cx + sectorRadius * Math.cos(rad));
    const y = round3(cy + sectorRadius * Math.sin(rad));
    const largeArcFlag = deg > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${cx} ${
      cy - sectorRadius
    } A ${sectorRadius} ${sectorRadius} 0 ${largeArcFlag} 1 ${x} ${y} Z`;
  };

  // Pointer needle / raised tab at the leading edge of the sector
  const pointerRad = ((angleDeg - 90) * Math.PI) / 180;
  const pointerOuterR = 122;
  const pointerX = round3(cx + pointerOuterR * Math.cos(pointerRad));
  const pointerY = round3(cy + pointerOuterR * Math.sin(pointerRad));

  const formatShortDigital = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remSecs = secs % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  const sizeClasses =
    size === 'fullscreen'
      ? 'w-[min(84vw,80vh)] h-[min(84vw,80vh)] max-w-[680px] max-h-[680px]'
      : size === 'large'
      ? 'w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] lg:w-[460px] lg:h-[460px]'
      : 'w-[290px] h-[290px] sm:w-[350px] sm:h-[350px]';

  return (
    <div
      className={`relative select-none flex items-center justify-center ${sizeClasses}`}
    >
      {/* Soft ambient floor shadow matching physical product photography */}
      <div
        aria-hidden="true"
        className={`absolute -bottom-4 inset-x-10 h-8 rounded-full blur-xl pointer-events-none ${
          theme.isDark ? 'bg-black/50' : 'bg-slate-900/15'
        }`}
      />

      <svg
        ref={svgRef}
        viewBox="0 0 400 400"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`w-full h-full drop-shadow-sm transition-transform duration-150 ${
          !isRunning ? 'cursor-pointer active:scale-[0.995]' : 'cursor-default'
        }`}
        role="slider"
        aria-label="Mặt đồng hồ hẹn giờ (nhấp hoặc kéo để chỉnh số phút)"
        aria-valuemin={0}
        aria-valuemax={60}
        aria-valuenow={Math.ceil(remainingSeconds / 60)}
      >
        <defs>
          {/* Outer casing gradient */}
          <linearGradient id="bezelOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.bezelOuter[0]} />
            <stop offset="55%" stopColor={theme.bezelOuter[1]} />
            <stop offset="100%" stopColor={theme.bezelOuter[2]} />
          </linearGradient>

          {/* Inner bezel rim highlight/shadow */}
          <linearGradient id="bezelInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.bezelInner[0]} />
            <stop offset="50%" stopColor={theme.bezelInner[1]} />
            <stop offset="100%" stopColor={theme.bezelInner[2]} />
          </linearGradient>

          {/* Recessed dial face subtle inner shadow */}
          <radialGradient id="dialFaceGrad" cx="48%" cy="46%" r="54%">
            <stop offset="0%" stopColor={theme.dialFace[0]} />
            <stop offset="82%" stopColor={theme.dialFace[1]} />
            <stop offset="95%" stopColor={theme.dialFace[2]} />
            <stop offset="100%" stopColor={theme.dialFace[3]} />
          </radialGradient>

          {/* Countdown disk gradient */}
          <linearGradient id="sectorDiskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.sectorGrad[0]} />
            <stop offset="100%" stopColor={theme.sectorGrad[1]} />
          </linearGradient>

          {/* Brushed metallic silver center knob */}
          <linearGradient id="metalKnobRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6E8E6" />
            <stop offset="50%" stopColor="#9FA4A1" />
            <stop offset="100%" stopColor="#6D7270" />
          </linearGradient>

          <linearGradient id="metalKnobFace" x1="15%" y1="15%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#F3F4F3" />
            <stop offset="35%" stopColor="#B8BDBB" />
            <stop offset="50%" stopColor="#E2E5E4" />
            <stop offset="70%" stopColor="#8E9491" />
            <stop offset="100%" stopColor="#C8CDCB" />
          </linearGradient>

          <filter id="knobShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="4"
              floodColor="#0F172A"
              floodOpacity="0.28"
            />
          </filter>

          <filter id="pointerShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="2"
              floodColor="#000000"
              floodOpacity="0.3"
            />
          </filter>
        </defs>

        {/* Outer Casing */}
        <circle cx={cx} cy={cy} r="192" fill="url(#bezelOuterGrad)" />
        <circle cx={cx} cy={cy} r="174" fill="url(#bezelInnerGrad)" />

        {/* Recessed Dial Face */}
        <circle cx={cx} cy={cy} r="168" fill="url(#dialFaceGrad)" />

        {/* Subtle vertical slot step at 12 o'clock where the disk emerges */}
        <line
          x1={cx}
          y1={cy - 166}
          x2={cx}
          y2={cy - 32}
          stroke={theme.slotLineColor}
          strokeWidth="1.5"
        />

        {/* Curved direction arrow between 0 and 5 (0 -> 5) */}
        <path
          d="M 213 55 A 146 146 0 0 1 241 61"
          fill="none"
          stroke={theme.tickColor}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <polygon points="244,62 237,57 239,64" fill={theme.tickColor} />

        {/* Remaining Time Sector */}
        {clampedSeconds > 0 && (
          <path d={getSectorPath(angleDeg)} fill="url(#sectorDiskGrad)" />
        )}

        {/* 60 Minute Tick Marks & 5-Minute Numbers */}
        {Array.from({length: 60}).map((_, i) => {
          const isMajor = i % 5 === 0;
          const deg = i * 6;
          const rad = ((deg - 90) * Math.PI) / 180;

          const tickOuter = 113;
          const tickInner = isMajor ? 82 : 98;

          const x1 = round3(cx + tickInner * Math.cos(rad));
          const y1 = round3(cy + tickInner * Math.sin(rad));
          const x2 = round3(cx + tickOuter * Math.cos(rad));
          const y2 = round3(cy + tickOuter * Math.sin(rad));

          const numRadius = 142;
          const nx = round3(cx + numRadius * Math.cos(rad));
          const ny = round3(cy + numRadius * Math.sin(rad));

          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={theme.tickColor}
                strokeWidth={isMajor ? 2.4 : 1.25}
                strokeLinecap="round"
              />
              {isMajor && (
                <text
                  x={nx}
                  y={ny}
                  fill={theme.numberColor}
                  fontSize="22"
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${deg}, ${nx}, ${ny})`}
                  className="font-[family-name:var(--font-mono)] tracking-tight"
                >
                  {i}
                </text>
              )}
            </g>
          );
        })}

        {/* Raised Pointer Rib on the Active Edge */}
        {clampedSeconds > 0 && (
          <line
            x1={cx}
            y1={cy}
            x2={pointerX}
            y2={pointerY}
            stroke={theme.pointerStroke}
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#pointerShadow)"
          />
        )}

        {/* Center Metallic Knob or Digital Readout Overlay */}
        {showCenterDigital ? (
          <g filter="url(#knobShadow)">
            <circle
              cx={cx}
              cy={cy}
              r="52"
              fill="#18222F"
              stroke="url(#metalKnobRim)"
              strokeWidth="4"
            />
            <text
              x={cx}
              y={cy - 2}
              fill="#FFFFFF"
              fontSize={remainingSeconds >= 3600 ? '17' : '22'}
              fontWeight="700"
              textAnchor="middle"
              dominantBaseline="central"
              className="font-[family-name:var(--font-mono)] tabular-nums"
            >
              {formatShortDigital(remainingSeconds)}
            </text>
            <text
              x={cx}
              y={cy + 20}
              fill="#94A3B8"
              fontSize="9.5"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {isRunning ? 'ĐANG CHẠY' : 'TẠM DỪNG'}
            </text>
          </g>
        ) : (
          <g filter="url(#knobShadow)">
            <circle cx={cx} cy={cy} r="36" fill="url(#metalKnobRim)" />
            <circle cx={cx} cy={cy} r="32" fill="url(#metalKnobFace)" />
            <circle
              cx={cx}
              cy={cy}
              r="29"
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity="0.45"
              strokeWidth="0.75"
            />
          </g>
        )}
      </svg>

      {/* Overflow indicator if user sets custom duration > 60 minutes (hidden in pure fullscreen) */}
      {totalSeconds > 3600 && size !== 'fullscreen' && (
        <div className="absolute bottom-3 px-2.5 py-1 rounded-md bg-slate-900/85 text-white text-xs font-medium font-[family-name:var(--font-mono)] tabular-nums shadow-sm">
          +{Math.floor(remainingSeconds / 3600)} giờ hiển thị trên mặt 60p
        </div>
      )}
    </div>
  );
}
