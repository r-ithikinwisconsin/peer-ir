"use client";

import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props {
  urls: string[];
}

export function PhotoCarousel({ urls }: Props) {
  const [index, setIndex] = useState(0);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const handle = () => {
      const w = el.clientWidth;
      if (w === 0) return;
      setIndex(Math.round(el.scrollLeft / w));
    };
    el.addEventListener("scroll", handle, { passive: true });
    return () => el.removeEventListener("scroll", handle);
  }, []);

  function scrollTo(i: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
  }

  const multiple = urls.length > 1;

  return (
    <>
      <div className="group relative overflow-hidden rounded-lg bg-surface shadow-card">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setZoomIndex(i)}
              className="relative aspect-[4/3] w-full flex-none cursor-zoom-in snap-center bg-chip-bg"
              aria-label={`Zoom photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>

        {multiple && (
          <>
            <button
              type="button"
              onClick={() => scrollTo(Math.max(0, index - 1))}
              disabled={index === 0}
              className="absolute left-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-0 md:opacity-100"
              aria-label="Previous photo"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => scrollTo(Math.min(urls.length - 1, index + 1))}
              disabled={index === urls.length - 1}
              className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-0 md:opacity-100"
              aria-label="Next photo"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {urls.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollTo(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index ? "w-5 bg-white" : "w-1.5 bg-white/60",
                  )}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <PhotoLightbox
        urls={urls}
        index={zoomIndex}
        onClose={() => setZoomIndex(null)}
        onChange={setZoomIndex}
      />
    </>
  );
}

interface LightboxProps {
  urls: string[];
  index: number | null;
  onClose: () => void;
  onChange: (i: number) => void;
}

function PhotoLightbox({ urls, index, onClose, onChange }: LightboxProps) {
  const open = index !== null;
  const current = index ?? 0;
  const multiple = urls.length > 1;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && current > 0) onChange(current - 1);
      if (e.key === "ArrowRight" && current < urls.length - 1)
        onChange(current + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, current, urls.length, onChange]);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/90 data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center outline-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            Photo {current + 1} of {urls.length}
          </DialogPrimitive.Title>
          {open && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urls[current]}
                alt={`Photo ${current + 1}`}
                className="max-h-[100vh] max-w-[100vw] object-contain p-4"
              />
              <DialogPrimitive.Close
                aria-label="Close"
                className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
              >
                <X size={20} />
              </DialogPrimitive.Close>
              {multiple && (
                <>
                  <button
                    type="button"
                    onClick={() => onChange(Math.max(0, current - 1))}
                    disabled={current === 0}
                    className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 disabled:opacity-30"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChange(Math.min(urls.length - 1, current + 1))
                    }
                    disabled={current === urls.length - 1}
                    className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 disabled:opacity-30"
                    aria-label="Next photo"
                  >
                    <ChevronRight size={22} />
                  </button>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-sm text-white backdrop-blur">
                    {current + 1} / {urls.length}
                  </div>
                </>
              )}
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
