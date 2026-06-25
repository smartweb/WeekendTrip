import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Noto_Serif_SC } from "next/font/google";
import "@/styles/globals.css";

// 优雅衬线展示字（标题/价格/封面）— 对应 Odessia 的 ABC Oracle / Optima Nova 气质
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  variable: "--font-display-sc",
  weight: ["500", "600", "700"],
  preload: false,
});

// 干净无衬线正文
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "周末亲子游 · 酒店+机票组合",
  description: "北上广深出发，精选全国亲子游目的地，酒店+往返机票一站预订。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#faf7f2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      className={`${fraunces.variable} ${notoSerifSC.variable} ${inter.variable}`}
    >
      <body>
        <div className="h5-shell">{children}</div>
      </body>
    </html>
  );
}
