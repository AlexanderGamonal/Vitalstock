import type { Metadata } from "next";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

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
        <meta name="theme-color" content="#4a7c59" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-vs-bg font-body antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
