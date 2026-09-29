import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastContext";
import { Navbar } from "@/components/navigation/Navbar";

export const metadata: Metadata = {
  title: "EXPO CHINA 2026 — Captación y Sorteo",
  description: "Sistema operativo para captación y sorteo de estadía en Mar de las Pampas — Expo China 2026",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-background text-gray-100 antialiased selection:bg-cyan-500 selection:text-black flex flex-col">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
