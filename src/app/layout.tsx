import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Utsav Planner ✨ Plain-Language Indian Celebration Planner",
  description:
    "Living, priority-aware celebration and event planner for weddings, birthdays, and colony festivals across India.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-[#FAF8F5] text-[#111111] antialiased selection:bg-[#FF6B35]/20 selection:text-[#111111]">
        {children}
      </body>
    </html>
  );
}
