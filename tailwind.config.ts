import type { Config } from "tailwindcss";

/**
 * 设计语言：参考 Odessia.com 的暖色编辑风（warm editorial）
 *  - 暖白画布 cream (#faf7f2)，配赭石/陶土红主色
 *  - 深棕墨色 ink，柔暖灰 muted，发丝级暖色描边
 *  - 优雅衬线展示字（Fraunces / Noto Serif SC）+ 干净无衬线正文
 */
const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 主色：陶土赭红（terracotta / clay）
        brand: {
          DEFAULT: "#b94d2c", // 陶土红
          dark: "#8a3520",
          soft: "#f6ebe3", // 浅暖底
        },
        // 辅助暖色：赭黄（ochre），用于点缀/评分
        ochre: {
          DEFAULT: "#c08a3e",
          soft: "#f4ead6",
        },
        ink: "#242220", // 暖深棕墨
        muted: "#6b6357", // 暖中灰
        line: "#e7e0d6", // 暖色发丝线
        canvas: "#faf7f2", // 暖白画布
        cream: "#fbfaf7", // 纯卡片白（暖调）
      },
      fontFamily: {
        // 展示字：优雅衬线（标题/价格/封面文字）。
        // CSS 按字形回退：拉丁走 Fraunces，中文自动落到 Noto Serif SC。
        display: [
          "var(--font-display)",
          "Fraunces",
          '"Noto Serif SC"',
          "Georgia",
          "serif",
        ],
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          "Arial",
          "sans-serif",
        ],
      },
      maxWidth: {
        h5: "480px",
      },
      boxShadow: {
        card: "0 10px 40px -12px rgba(58, 36, 24, 0.14)",
        bar: "0 -8px 32px -8px rgba(58, 36, 24, 0.10)",
        soft: "0 2px 12px -4px rgba(58, 36, 24, 0.08)",
      },
      borderRadius: {
        xl2: "22px",
        xl3: "28px",
      },
      letterSpacing: {
        tightish: "-0.01em",
        display: "-0.02em",
      },
    },
  },
  plugins: [],
};

export default config;
