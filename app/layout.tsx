import { Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ReactLenis } from "@/utils/lenis";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  variable: "--font-instrument-serif",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ReactLenis root>
        <body className={`${instrumentSerif.variable} antialiased`}>
          {children}
        </body>
      </ReactLenis>
    </html>
  );
}
