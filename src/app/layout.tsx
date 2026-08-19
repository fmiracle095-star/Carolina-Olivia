import type { Metadata } from "next";
import "@/src/index.css";

export const metadata: Metadata = {
  title: "Carolina Olivia AI Portal",
  description: "Year 2050 Operations Interface",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
