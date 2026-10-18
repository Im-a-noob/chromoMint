export type ThemeId = 'mint' | 'obsidian' | 'cobalt' | 'forest' | 'coral';

export interface TimerTheme {
  id: ThemeId;
  name: string;
  isDark: boolean;
  // Page & Surface colors
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  subtleBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  // Analog Dial SVG Colors
  bezelOuter: [string, string, string];
  bezelInner: [string, string, string];
  dialFace: [string, string, string, string];
  sectorGrad: [string, string];
  pointerStroke: string;
  tickColor: string;
  numberColor: string;
  slotLineColor: string;
  swatchColors: [string, string];
}

export const TIMER_THEMES: Record<ThemeId, TimerTheme> = {
  mint: {
    id: 'mint',
    name: 'Bạc hà & Cam đỏ',
    isDark: false,
    pageBg: 'bg-[#F4F5F3]',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200/80',
    subtleBg: 'bg-[#F4F5F3]',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-500',
    accent: '#E8531E',
    accentHover: '#D64815',
    bezelOuter: ['#CBE4D5', '#B5D6C3', '#94BDA6'],
    bezelInner: ['#8AB29B', '#A8CCB8', '#D3E9DC'],
    dialFace: ['#FFFFFF', '#F8FAF9', '#ECEFEE', '#DDE3E0'],
    sectorGrad: ['#F25C27', '#DF4612'],
    pointerStroke: '#E8531E',
    tickColor: '#1E293B',
    numberColor: '#18222F',
    slotLineColor: '#CBD5D0',
    swatchColors: ['#B5D6C3', '#E8531E'],
  },
  obsidian: {
    id: 'obsidian',
    name: 'Đen Carbon & Hổ phách',
    isDark: true,
    pageBg: 'bg-[#0F1214]',
    cardBg: 'bg-[#181C20]',
    cardBorder: 'border-white/10',
    subtleBg: 'bg-[#22272C]',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-400',
    accent: '#F59E0B',
    accentHover: '#D97706',
    bezelOuter: ['#3F444A', '#2A2E33', '#1B1E22'],
    bezelInner: ['#16181B', '#25292E', '#3A3F45'],
    dialFace: ['#22262A', '#1D2024', '#181B1E', '#131619'],
    sectorGrad: ['#FBBF24', '#EA580C'],
    pointerStroke: '#F59E0B',
    tickColor: '#E2E8F0',
    numberColor: '#F8FAFC',
    slotLineColor: '#333940',
    swatchColors: ['#2A2E33', '#F59E0B'],
  },
  cobalt: {
    id: 'cobalt',
    name: 'Xanh Bắc Âu',
    isDark: false,
    pageBg: 'bg-[#F0F4F8]',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200/80',
    subtleBg: 'bg-[#E8EEF5]',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-500',
    accent: '#2563EB',
    accentHover: '#1D4ED8',
    bezelOuter: ['#D3E2F2', '#B8CFE8', '#94B4D8'],
    bezelInner: ['#84A6CC', '#ABC5E2', '#DCEAF7'],
    dialFace: ['#FFFFFF', '#F7FAFC', '#EDF2F7', '#DFEAFA'],
    sectorGrad: ['#3B82F6', '#1D4ED8'],
    pointerStroke: '#2563EB',
    tickColor: '#0F172A',
    numberColor: '#0F172A',
    slotLineColor: '#CBD5E1',
    swatchColors: ['#B8CFE8', '#2563EB'],
  },
  forest: {
    id: 'forest',
    name: 'Kem Ấm & Rừng Thông',
    isDark: false,
    pageBg: 'bg-[#F6F3EC]',
    cardBg: 'bg-[#FCFBF8]',
    cardBorder: 'border-[#E5DEC9]',
    subtleBg: 'bg-[#EFEAD8]',
    textPrimary: 'text-[#1C241E]',
    textSecondary: 'text-[#4A554C]',
    textMuted: 'text-[#6E786F]',
    accent: '#15803D',
    accentHover: '#166534',
    bezelOuter: ['#E8DFCE', '#D8CBB5', '#BDAE93'],
    bezelInner: ['#B2A287', '#CFC1A9', '#EDE5D6'],
    dialFace: ['#FFFDF9', '#FAF6EE', '#F2ECE1', '#E6DEC8'],
    sectorGrad: ['#22C55E', '#15803D'],
    pointerStroke: '#15803D',
    tickColor: '#1C241E',
    numberColor: '#1C241E',
    slotLineColor: '#D6CEBE',
    swatchColors: ['#D8CBB5', '#15803D'],
  },
  coral: {
    id: 'coral',
    name: 'Hồng Đào & San Hô',
    isDark: false,
    pageBg: 'bg-[#F9F3F2]',
    cardBg: 'bg-white',
    cardBorder: 'border-rose-200/60',
    subtleBg: 'bg-[#F3E8E6]',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-500',
    accent: '#E11D48',
    accentHover: '#BE123C',
    bezelOuter: ['#F4DAD8', '#E7C1BE', '#D1A19D'],
    bezelInner: ['#C4928E', '#DFB6B3', '#F7E2E0'],
    dialFace: ['#FFFFFF', '#FDF8F8', '#F7EDED', '#EBDCDC'],
    sectorGrad: ['#FB7185', '#E11D48'],
    pointerStroke: '#E11D48',
    tickColor: '#27171A',
    numberColor: '#27171A',
    slotLineColor: '#E2CECD',
    swatchColors: ['#E7C1BE', '#E11D48'],
  },
};
