import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VitalStock",
  description: "Control de inventario para productos saludables",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700;800;900&family=DM+Sans:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-vs-bg font-body antialiased">{children}</body>
    </html>
  );
}
