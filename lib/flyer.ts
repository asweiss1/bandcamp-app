import type { PromoShow } from "@/lib/promo";

export type FlyerFormat = "letter" | "tabloid" | "square" | "story" | "cover";
export type FlyerTemplate = "ink" | "paper" | "pine";

export const FLYER_FORMATS: { id: FlyerFormat; label: string; width: number; height: number; printable: boolean }[] = [
  { id: "letter", label: "Letter", width: 1275, height: 1650, printable: true },
  { id: "tabloid", label: "11×17", width: 1650, height: 2550, printable: true },
  { id: "square", label: "Instagram post", width: 1080, height: 1080, printable: false },
  { id: "story", label: "Story", width: 1080, height: 1920, printable: false },
  { id: "cover", label: "Facebook cover", width: 1920, height: 1008, printable: false },
];

export const FLYER_TEMPLATES: { id: FlyerTemplate; label: string; bg: string; fg: string; accent: string; muted: string }[] = [
  { id: "ink", label: "Ink", bg: "#1b1612", fg: "#fffaf3", accent: "#e2a322", muted: "#d9cbb8" },
  { id: "paper", label: "Paper", bg: "#f6f1e7", fg: "#1b1612", accent: "#c4492c", muted: "#5c5348" },
  { id: "pine", label: "Pine", bg: "#1f3d34", fg: "#fffaf3", accent: "#e7d7b1", muted: "#d5e0d8" },
];

export function formatSpec(id: FlyerFormat) {
  return FLYER_FORMATS.find((item) => item.id === id) ?? FLYER_FORMATS[2];
}

export function templateSpec(id: FlyerTemplate) {
  return FLYER_TEMPLATES.find((item) => item.id === id) ?? FLYER_TEMPLATES[0];
}

export function monogram(name: string) {
  const parts = name.replace(/^the\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((part) => part[0] ?? "").join("");
  return (letters || name.slice(0, 2)).toUpperCase();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function sampleAccent(image: CanvasImageSource, width: number, height: number) {
  const canvas = document.createElement("canvas");
  const size = 24;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, width, height, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 16) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    if (max < 40 || min > 230 || max - min < 18) continue;
    r += red;
    g += green;
    b += blue;
    count += 1;
  }
  if (count < 4) return null;
  const hex = (n: number) => Math.round(n / count).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export function drawFlyer(
  ctx: CanvasRenderingContext2D,
  show: PromoShow,
  format: FlyerFormat,
  template: FlyerTemplate,
  images: Record<string, CanvasImageSource | undefined>,
  accentOverride: string | null,
  fonts: { display: string; sans: string } = {
    display: "Fraunces, Georgia, serif",
    sans: "Outfit, sans-serif",
  },
) {
  const spec = formatSpec(format);
  const palette = templateSpec(template);
  const accent = accentOverride ?? palette.accent;
  const { width, height } = spec;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, width, Math.max(12, Math.round(height * 0.012)));

  const wide = width > height * 1.2;
  const pad = Math.round(width * (wide ? 0.06 : 0.08));
  const column = wide ? Math.round(width * 0.62) : width - pad * 2;
  let y = pad + Math.round(height * 0.02);

  const acts = show.marks.filter((mark) => mark.role !== "Room");
  const markSize = Math.round(Math.min(width, height) * (wide ? 0.16 : format === "square" ? 0.16 : 0.18));

  function paintMark(mark: PromoShow["marks"][number], x: number, top: number) {
    const image = mark.src ? images[mark.id] : undefined;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + markSize / 2, top + markSize / 2, markSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (image) {
      ctx.drawImage(image, x, top, markSize, markSize);
    } else {
      ctx.fillStyle = accent;
      ctx.fillRect(x, top, markSize, markSize);
      ctx.fillStyle = palette.bg;
      ctx.font = `700 ${Math.round(markSize * 0.34)}px ${fonts.display}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(monogram(mark.name), x + markSize / 2, top + markSize / 2 + 2);
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(x + markSize / 2, top + markSize / 2, markSize / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  if (!wide) {
    const row = acts.length > 0 ? acts : show.marks.slice(0, 1);
    const gap = 18;
    const total = row.length * markSize + (row.length - 1) * gap;
    let x = pad + Math.max(0, (column - total) / 2);
    for (const mark of row) {
      paintMark(mark, x, y);
      x += markSize + gap;
    }
    y += markSize + Math.round(pad * 0.55);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = accent;
  ctx.font = `600 ${Math.round(width * (wide ? 0.018 : 0.028))}px ${fonts.sans}`;
  const kicker = `${show.city.toUpperCase()} · ${show.when.toUpperCase()}`;
  ctx.fillText(kicker, pad, y);
  y += Math.round(width * 0.05);

  ctx.fillStyle = palette.fg;
  const titleSize = Math.round(width * (wide ? 0.055 : format === "cover" ? 0.07 : 0.078));
  ctx.font = `560 ${titleSize}px ${fonts.display}`;
  const titleLines = wrap(ctx, show.title, column);
  for (const line of titleLines.slice(0, 3)) {
    ctx.fillText(line, pad, y);
    y += titleSize * 1.05;
  }
  y += Math.round(pad * 0.35);

  ctx.fillStyle = palette.fg;
  ctx.font = `560 ${Math.round(width * (wide ? 0.028 : 0.04))}px ${fonts.display}`;
  ctx.fillText(show.dateLabel, pad, y);
  y += Math.round(width * 0.055);

  ctx.fillStyle = palette.muted;
  ctx.font = `500 ${Math.round(width * (wide ? 0.02 : 0.028))}px ${fonts.sans}`;
  const lineupLines = show.lineup.split("\n").flatMap((line) => wrap(ctx, line, column));
  for (const line of lineupLines.slice(0, wide ? 4 : 6)) {
    ctx.fillText(line, pad, y);
    y += Math.round(width * 0.038);
  }
  y += Math.round(pad * 0.25);

  ctx.fillStyle = palette.fg;
  ctx.font = `600 ${Math.round(width * (wide ? 0.026 : 0.034))}px ${fonts.sans}`;
  ctx.fillText(show.venueName, pad, y);
  y += Math.round(width * 0.04);
  ctx.fillStyle = palette.muted;
  ctx.font = `460 ${Math.round(width * (wide ? 0.018 : 0.024))}px ${fonts.sans}`;
  for (const line of wrap(ctx, show.address, column).slice(0, 2)) {
    ctx.fillText(line, pad, y);
    y += Math.round(width * 0.032);
  }

  const facts = [show.age, show.cover, show.music].filter(Boolean) as string[];
  y += Math.round(pad * 0.35);
  let factX = pad;
  ctx.font = `600 ${Math.round(width * 0.02)}px ${fonts.sans}`;
  for (const fact of facts) {
    const boxW = ctx.measureText(fact).width + 28;
    if (factX + boxW > pad + column) {
      factX = pad;
      y += Math.round(width * 0.05);
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(factX, y, boxW, Math.round(width * 0.038));
    ctx.fillStyle = palette.fg;
    ctx.fillText(fact, factX + 14, y + Math.round(width * 0.01));
    factX += boxW + 12;
  }

  if (wide) {
    const room = show.marks.find((mark) => mark.role === "Room") ?? show.marks[0];
    const hero = Math.round(height * 0.42);
    const x = width - pad - hero;
    const top = Math.round(height * 0.18);
    if (room) paintMark({ ...room, role: room.role }, x, top);
    const extra = acts.slice(0, 3);
    extra.forEach((mark, index) => {
      paintMark(mark, x + index * (markSize * 0.72), top + hero + 24);
    });
  }

  ctx.fillStyle = palette.muted;
  ctx.font = `500 ${Math.round(width * 0.016)}px ${fonts.sans}`;
  const footer = show.useImages
    ? "Sample flyer · logos used with permission"
    : "Sample flyer · text only until every band and the venue allow photos";
  ctx.fillText(footer, pad, height - pad);
}
