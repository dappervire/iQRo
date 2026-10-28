// Resolusi cetak: 300 titik (piksel) per inci.
export const DPI = 300;
const MM_PER_INCI = 25.4;

// 100 mm → 1181 px pada 300 DPI.
export function mmKePx(mm: number): number {
  return Math.round((mm / MM_PER_INCI) * DPI);
}
