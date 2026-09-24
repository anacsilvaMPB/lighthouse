import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Lighthouse, by Ana Silva",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>{children}</body>
    </html>
  );
}
