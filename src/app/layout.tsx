import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Just In Form",
  description:
    "Cours de sport en video, nutrition et coaching en ligne avec Justine.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-creme text-anthracite">
        {children}
      </body>
    </html>
  );
}
