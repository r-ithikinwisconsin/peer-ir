"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/cn";

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const MAX_PHOTOS = 5;
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

interface UploadedPhoto {
  path: string;
  url: string;
}

interface Props {
  onChange: (paths: string[]) => void;
  userId: string;
}

export function PhotoUploader({ onChange, userId }: Props) {
  const [items, setItems] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const groupId = useRef<string>(randomId());

  const upload = useCallback(
    async (files: File[]) => {
      setError(null);
      const remaining = MAX_PHOTOS - items.length;
      if (remaining <= 0) {
        setError(`Up to ${MAX_PHOTOS} photos`);
        return;
      }
      const accepted = files
        .filter((f) => ACCEPTED.includes(f.type))
        .slice(0, remaining);
      if (accepted.length === 0) {
        setError("JPG, PNG, WebP, or HEIC only");
        return;
      }
      const oversized = accepted.find((f) => f.size > MAX_BYTES);
      if (oversized) {
        setError(`${oversized.name} is over 8MB`);
        return;
      }

      setUploading(true);
      const supabase = createClient();
      const nextItems = [...items];
      try {
        for (const file of accepted) {
          const ext = EXT_BY_MIME[file.type] ?? "jpg";
          const index = nextItems.length;
          const path = `${userId}/${groupId.current}/${index}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("case-photos")
            .upload(path, file, {
              contentType: file.type,
              upsert: false,
            });
          if (upErr) {
            setError(upErr.message);
            break;
          }
          const { data } = supabase.storage
            .from("case-photos")
            .getPublicUrl(path);
          nextItems.push({ path, url: data.publicUrl });
        }
        setItems(nextItems);
        onChange(nextItems.map((i) => i.path));
      } finally {
        setUploading(false);
      }
    },
    [items, onChange, userId],
  );

  function openPicker() {
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length) void upload(files);
  }

  async function remove(idx: number) {
    const target = items[idx];
    if (!target) return;
    const supabase = createClient();
    await supabase.storage.from("case-photos").remove([target.path]);
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    onChange(next.map((i) => i.path));
    setError(null);
  }

  const atLimit = items.length >= MAX_PHOTOS;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((item, idx) => (
          <div
            key={item.path}
            className="relative aspect-square overflow-hidden rounded-md border border-border bg-chip-bg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={`Photo ${idx + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => void remove(idx)}
              className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              aria-label={`Remove photo ${idx + 1}`}
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        ))}
        {!atLimit && (
          <button
            type="button"
            onClick={openPicker}
            disabled={uploading}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-chip-bg text-text-muted transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60",
            )}
          >
            {uploading ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              <>
                <ImagePlus size={22} />
                <span className="text-[11px] font-medium uppercase tracking-wider">
                  Add
                </span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        onChange={onFileChange}
        className="hidden"
      />
      <p className="text-xs text-text-muted">
        Up to {MAX_PHOTOS} photos, 8MB each. De-identify first — no faces, names, or dates.
      </p>
      {error && (
        <p className="rounded-md bg-[#fef2f2] p-2 text-xs text-[#b91c1c]">
          {error}
        </p>
      )}
    </div>
  );
}
