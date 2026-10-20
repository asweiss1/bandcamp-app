"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  FLYER_FORMATS,
  FLYER_TEMPLATES,
  drawFlyer,
  formatSpec,
  sampleAccent,
  type FlyerFormat,
  type FlyerTemplate,
} from "@/lib/flyer";
import { promoFromBill, promoFromBooking, type PromoShow } from "@/lib/promo";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PromoStudio({ kind, id }: { kind: "booking" | "bill"; id: string }) {
  const { snapshot } = useApp();
  const show = useMemo(
    () => (kind === "booking" ? promoFromBooking(snapshot, id) : promoFromBill(snapshot, id)),
    [snapshot, kind, id],
  );
  const [open, setOpen] = useState(false);
  if (!show) return null;
  return (
    <section className="grid gap-3">
      <Button type="button" className="h-11 w-fit" onClick={() => setOpen(true)}>
        Make a flyer
      </Button>
      {open ? <Studio show={show} /> : null}
    </section>
  );
}

function Studio({ show }: { show: PromoShow }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<FlyerFormat>("square");
  const [template, setTemplate] = useState<FlyerTemplate>("ink");
  const spec = formatSpec(format);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    async function paint() {
      await document.fonts.ready;
      const loaded = await loadMarks(show);
      if (cancelled || !canvas) return;
      const usable: Record<string, HTMLImageElement> = {};
      for (const [id, image] of Object.entries(loaded)) {
        if (image) usable[id] = image;
      }
      const drawn = Object.keys(usable).length > 0
        ? show
        : { ...show, useImages: false, marks: show.marks.map((mark) => ({ ...mark, src: null })) };
      const first = show.marks.map((mark) => (mark.src ? usable[mark.id] : undefined)).find(Boolean) ?? null;
      const accent = first ? sampleAccent(first, first.naturalWidth || 64, first.naturalHeight || 64) : null;
      const root = getComputedStyle(document.documentElement);
      const display = root.getPropertyValue("--font-fraunces").trim() || "Fraunces";
      const sans = root.getPropertyValue("--font-outfit").trim() || "Outfit";
      try {
        await document.fonts.load(`560 48px ${display}`);
        await document.fonts.load(`500 24px ${sans}`);
      } catch {
        /* canvas still falls back to Georgia and sans-serif */
      }
      if (cancelled) return;
      const current = formatSpec(format);
      canvas.width = current.width;
      canvas.height = current.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawFlyer(ctx, drawn, format, template, usable, accent, {
        display: `${display}, Georgia, serif`,
        sans: `${sans}, sans-serif`,
      });
    }
    void paint();
    return () => {
      cancelled = true;
    };
  }, [show, format, template]);

  const footer = show.useImages
    ? "Sample flyer · logos used with permission"
    : "Sample flyer · text only until every band and the venue allow photos";

  async function pngBlob() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  async function downloadPng() {
    const blob = await pngBlob();
    if (!blob) return;
    saveBlob(blob, `${slug(show.title)}.png`);
  }

  async function downloadPdf() {
    const canvas = canvasRef.current;
    if (!canvas || !spec.printable) return;
    const { jsPDF } = await import("jspdf");
    const page = spec.id === "tabloid" ? ([11, 17] as [number, number]) : "letter";
    const pdf = new jsPDF({ orientation: "portrait", unit: "in", format: page });
    const width = spec.id === "tabloid" ? 11 : 8.5;
    const height = spec.id === "tabloid" ? 17 : 11;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, width, height);
    pdf.save(`${slug(show.title)}.pdf`);
  }

  async function share() {
    const blob = await pngBlob();
    if (!blob) return;
    const file = new File([blob], `${slug(show.title)}.png`, { type: "image/png" });
    const payload = { files: [file], title: show.title, text: show.caption };
    if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(payload))) {
      try {
        await navigator.share(payload);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    saveBlob(blob, file.name);
    toast.message("Image saved. Sharing from this browser needs the phone share sheet.");
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(show.caption);
      toast.success("Caption copied");
    } catch {
      toast.error("Copy the caption from the box.");
    }
  }

  return (
    <div id="promo-studio" className="grid gap-4 rounded-2xl border bg-card p-4">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Flyer</p>
        <h2 className="mt-1 font-display text-3xl">{show.title}</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FLYER_FORMATS.map((item) => (
          <Chip key={item.id} pressed={format === item.id} onClick={() => setFormat(item.id)}>
            {item.label}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FLYER_TEMPLATES.map((item) => (
          <Chip key={item.id} pressed={template === item.id} onClick={() => setTemplate(item.id)}>
            {item.label}
          </Chip>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        id="flyer-canvas"
        aria-label={`${show.title} flyer`}
        className="h-auto w-full rounded-xl border bg-ink"
      />
      <p className="text-sm text-muted-foreground">{footer}</p>
      <div className="flex flex-wrap gap-2">
        {spec.printable ? (
          <Button type="button" className="h-10" onClick={() => void downloadPdf()}>
            Download PDF
          </Button>
        ) : null}
        <Button type="button" variant="secondary" className="h-10" onClick={() => void downloadPng()}>
          Download PNG
        </Button>
        <Button type="button" variant="outline" className="h-10" onClick={() => void share()}>
          Share
        </Button>
      </div>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Caption</span>
        <textarea readOnly value={show.caption} className="min-h-36 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" />
      </label>
      <Button type="button" variant="outline" className="h-10 w-fit" onClick={() => void copyCaption()}>
        Copy caption
      </Button>
    </div>
  );
}

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium",
        pressed ? "border-ink bg-ink text-cream" : "bg-sand",
      )}
    >
      {children}
    </button>
  );
}

function slug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "flyer";
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function loadMarks(show: PromoShow) {
  return Promise.all(
    show.marks.map(async (mark) => {
      const image = mark.src && mark.src.startsWith("data:image/") ? await loadImage(mark.src) : null;
      return [mark.id, image] as const;
    }),
  ).then((pairs) => Object.fromEntries(pairs));
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}
