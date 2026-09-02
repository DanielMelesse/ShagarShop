"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { normalizeTrackingCode } from "@/lib/tracking-code";

interface TrackingCodeScannerProps {
  onScan: (code: string) => void;
  disabled?: boolean;
  className?: string;
}

/** Mobile-friendly camera scan + manual tracking code entry. */
export function TrackingCodeScanner({
  onScan,
  disabled = false,
  className = "",
}: TrackingCodeScannerProps) {
  const regionId = useId().replace(/:/g, "");
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const [manual, setManual] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraSupported, setCameraSupported] = useState(true);

  const submitManual = useCallback(() => {
    const code = normalizeTrackingCode(manual);
    if (!code) return;
    onScan(code);
  }, [manual, onScan]);

  useEffect(() => {
    if (!cameraOn || disabled) return;

    let cancelled = false;
    setCameraError("");

    void (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode(regionId, { verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 260, height: 160 },
            aspectRatio: 1,
          },
          (decoded) => {
            const code = normalizeTrackingCode(decoded);
            if (!code) return;
            void scanner.stop().then(() => {
              scannerRef.current = null;
              setCameraOn(false);
              onScan(code);
            });
          },
          () => {
            /* scan miss — ignore */
          },
        );
      } catch (err) {
        if (cancelled) return;
        setCameraSupported(false);
        setCameraOn(false);
        setCameraError(
          err instanceof Error
            ? err.message
            : "Could not open the camera. Type the code instead.",
        );
      }
    })();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        void scanner.stop().catch(() => undefined);
      }
    };
  }, [cameraOn, disabled, onScan, regionId]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950">
        <div
          id={regionId}
          className={`min-h-[220px] w-full ${cameraOn ? "block" : "hidden"}`}
        />
        {!cameraOn ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 py-10 text-center text-zinc-300">
            <p className="text-sm">Use your phone camera to scan a label or QR code.</p>
            {cameraSupported ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => setCameraOn(true)}
                className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Open camera
              </button>
            ) : (
              <p className="text-xs text-zinc-400">
                Camera unavailable — enter the code manually below.
              </p>
            )}
          </div>
        ) : (
          <div className="border-t border-zinc-800 p-3">
            <button
              type="button"
              onClick={() => {
                const scanner = scannerRef.current;
                scannerRef.current = null;
                if (scanner) void scanner.stop().catch(() => undefined);
                setCameraOn(false);
              }}
              className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Close camera
            </button>
          </div>
        )}
      </div>

      {cameraError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {cameraError}
        </p>
      ) : null}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <label htmlFor={`${regionId}-manual`} className="text-sm font-medium text-zinc-800">
          Or type tracking code
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id={`${regionId}-manual`}
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="SHG-BIGB-12345678"
            value={manual}
            disabled={disabled}
            onChange={(e) => setManual(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitManual();
            }}
            className="min-w-0 flex-1 rounded-xl border border-zinc-300 px-4 py-3 font-mono text-sm tracking-wide text-zinc-900 outline-none ring-brand-500 focus:ring-2"
          />
          <button
            type="button"
            disabled={disabled || !manual.trim()}
            onClick={submitManual}
            className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            Look up
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Read the code written on the package, or scan when QR labels are enabled.
        </p>
      </div>
    </div>
  );
}
