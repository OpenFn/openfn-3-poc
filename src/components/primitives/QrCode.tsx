import { useMemo } from "react";
import QRCode from "qrcode";

interface Props {
  /** What the code holds, e.g. an `otpauth://` URI. */
  value: string;
  /** What the code is for, read out in place of the image. */
  label: string;
}

/**
 * A QR code image: black on white with a four-module quiet zone whatever the
 * theme, so a phone can read it on a dark page. Nothing for an empty value.
 */
export default function QrCode({ value, label }: Props) {
  const src = useMemo(() => {
    if (!value) return null;
    const { size, data } = QRCode.create(value).modules;
    let path = "";
    data.forEach((on, i) => {
      if (on) path += `M${i % size} ${Math.floor(i / size)}h1v1h-1z`;
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 ${size + 8} ${size + 8}" shape-rendering="crispEdges"><rect x="-4" y="-4" width="100%" height="100%" fill="white"/><path d="${path}" fill="black"/></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, [value]);
  if (!src) return null;
  return <img src={src} alt={label} className="h-44 w-44" data-ui="qr-code" />;
}
