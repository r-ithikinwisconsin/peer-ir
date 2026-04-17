const PUBLIC_BUCKET = "case-photos";

export function buildCasePhotoUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_INTERNAL_URL ??
    "";
  const trimmed = base.replace(/\/+$/, "");
  const encoded = path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${trimmed}/storage/v1/object/public/${PUBLIC_BUCKET}/${encoded}`;
}
