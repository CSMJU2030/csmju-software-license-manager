import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans, Noto_Sans_Thai } from "next/font/google";
import { CsmjuAppShell, type NavItem } from "@/csmju";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

const DISPLAY_NAME = "CS Software License Manager";

const NAV: NavItem[] = [
  {
    label: "ภาพรวม",
    labelEn: "Overview",
    href: "/",
    icon: "dashboard",
  },
{
  label: "ใบอนุญาตซอฟต์แวร์",
  labelEn: "Software Licenses",
  href: "/software-licenses",
  icon: "description",
},
{
  label: "ใกล้หมดอายุ",
  labelEn: "Expiring",
  href: "/software-licenses/expiring",
  icon: "event",
},
];

const CORE_HUB_WEB_URL = process.env.CORE_HUB_WEB_URL;

type RootLayoutProps = Readonly<{ children: ReactNode }>;

export const metadata: Metadata = {
  title: {
    template: `%s · ${DISPLAY_NAME} · CSMJU`,
    default: `${DISPLAY_NAME} · CSMJU`,
  },
};

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="th"
      className={`${jakarta.variable} ${notoSansThai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-on-surface">
        <CsmjuAppShell
          displayName={DISPLAY_NAME}
          nav={NAV}
          user={{
            initials: "AD",
            roleLabel: "ผู้ดูแลระบบ",
          }}
          coreHubUrl={CORE_HUB_WEB_URL}
        >
          {children}
        </CsmjuAppShell>
      </body>
    </html>
  );
}