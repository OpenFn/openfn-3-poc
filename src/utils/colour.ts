/**
 * Whether dark text reads better than white on a `#rrggbb` background, by
 * WCAG relative luminance. Anything that isn't a 6-digit hex counts as dark,
 * so it keeps white text.
 */
export function prefersDarkText(background: string): boolean {
  const m = /^#([0-9a-f]{6})$/i.exec(background);
  if (!m) return false;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1]!.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  // Where black and white text have equal contrast.
  return luminance > 0.179;
}
