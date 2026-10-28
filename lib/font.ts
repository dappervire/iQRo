import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

// Dipakai di layout.tsx (halaman) dan nanti di canvas template (font.style.fontFamily).
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

// Khusus angka teknis (mm, DPI, persen, px).
export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});
