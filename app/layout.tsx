import type {Metadata} from 'next';
import {Plus_Jakarta_Sans, JetBrains_Mono} from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'ChronoMint — Đồng Hồ Đếm Ngược Tối Giản',
  description:
    'Đồng hồ hẹn giờ đếm ngược tối giản với mặt đồng hồ trực quan, chế độ hiển thị số lớn chính giữa màn hình, mốc chọn nhanh 5/15/30 phút, tùy chỉnh thời gian và chuông báo âm thanh.',
  openGraph: {
    title: 'ChronoMint — Đồng Hồ Đếm Ngược Tối Giản',
    description:
      'Đồng hồ hẹn giờ đếm ngược tối giản với mặt đồng hồ trực quan, chế độ hiển thị số lớn chính giữa màn hình, mốc chọn nhanh 5/15/30 phút, tùy chỉnh thời gian và chuông báo âm thanh.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChronoMint — Đồng Hồ Đếm Ngược Tối Giản',
    description:
      'Đồng hồ hẹn giờ đếm ngược tối giản với mặt đồng hồ trực quan, chế độ hiển thị số lớn chính giữa màn hình, mốc chọn nhanh 5/15/30 phút, tùy chỉnh thời gian và chuông báo âm thanh.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="vi" className={`${jakarta.variable} ${jetbrainsMono.variable}`}>
      <body
        suppressHydrationWarning
        className="font-[family-name:var(--font-jakarta)] antialiased bg-[#F4F5F3] text-slate-900 selection:bg-[#E8531E]/15 selection:text-[#E8531E]"
      >
        {children}
      </body>
    </html>
  );
}
