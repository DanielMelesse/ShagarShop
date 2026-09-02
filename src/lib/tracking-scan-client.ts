import type {
  TrackingScanAction,
  TrackingScanPackage,
} from "@/lib/tracking-scan";

export async function lookupTrackingCode(
  code: string,
): Promise<
  | { ok: true; package: TrackingScanPackage }
  | { ok: false; error: string }
> {
  const res = await fetch(
    `/api/tracking/scan?code=${encodeURIComponent(code)}`,
    { credentials: "same-origin" },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: typeof data.error === "string" ? data.error : "Could not look up code.",
    };
  }
  return { ok: true, package: data.package as TrackingScanPackage };
}

export async function applyTrackingScan(
  code: string,
  action: TrackingScanAction,
): Promise<
  | { ok: true; package: TrackingScanPackage }
  | { ok: false; error: string }
> {
  const res = await fetch("/api/tracking/scan", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, action }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: typeof data.error === "string" ? data.error : "Could not update package.",
    };
  }
  return { ok: true, package: data.package as TrackingScanPackage };
}
