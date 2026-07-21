import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "곰곰이 Codex 프로젝트 운영실",
  description:
    "Codex 토큰 작업량, 프로젝트 우선순위, 최근 활동과 운영 리소스를 보는 개인 대시보드",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg"
  }
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
