"use client";

import { useEffect, useRef, useState } from "react";
import { isValidPackageBarcode, normalizePackageBarcode } from "@/lib/barcode";

interface PackageBarcodeAssignProps {
  productName: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (barcode: string) => void;
}

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

function getBarcodeDetector():
  | (new (options?: { formats?: string[] }) => BarcodeDetectorLike)
  | null {
  if (typeof window === "undefined") return null;
  const Detector = (
    window as unknown as {
      BarcodeDetector?: new (options?: {
        formats?: string[];
      }) => BarcodeDetectorLike;
    }
  ).BarcodeDetector;
  return Detector ?? null;
}

export function PackageBarcodeAssign({
  productName,
  busy = false,
  onCancel,
  onConfirm,
}: PackageBarcodeAssignProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanSupported, setScanSupported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setScanSupported(Boolean(getBarcodeDetector()));
    inputRef.current?.focus();
    return () => stopCamera();
  }, []);

  function stopCamera() {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function startCamera() {
    setError("");
    const Detector = getBarcodeDetector();
    if (!Detector) {
      setError("Camera scan is not supported in this browser. Type or use a USB scanner.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setScanning(true);
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      const detector = new Detector({
        formats: ["code_128", "code_39", "ean_13", "ean_8", "qr_code", "upc_a", "upc_e"],
      });

      const tick = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(() => void tick());
          return;
        }
        try {
          const results = await detector.detect(videoRef.current);
          const raw = results[0]?.rawValue;
          if (raw) {
            const normalized = normalizePackageBarcode(raw);
            setCode(normalized);
            stopCamera();
            inputRef.current?.focus();
            return;
          }
        } catch {
          // keep scanning
        }
        rafRef.current = requestAnimationFrame(() => void tick());
      };
      rafRef.current = requestAnimationFrame(() => void tick());
    } catch {
      setError("Could not open the camera. Allow camera access or type the barcode.");
      stopCamera();
    }
  }

  function submit() {
    const normalized = normalizePackageBarcode(code);
    if (!isValidPackageBarcode(normalized)) {
      setError("Enter a valid barcode (4–48 letters, numbers, - or _).");
      return;
    }
    onConfirm(normalized);
  }

  return (
    <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
      <p className="text-sm font-semibold text-zinc-900">Assign package barcode</p>
      <p className="mt-1 text-sm text-zinc-600">
        Scan or type the barcode on the package for{" "}
        <span className="font-medium text-zinc-800">{productName}</span>, then mark it
        ready for courier pickup.
      </p>

      <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        Package barcode
      </label>
      <input
        ref={inputRef}
        type="text"
        value={code}
        disabled={busy}
        autoComplete="off"
        spellCheck={false}
        placeholder="Scan with USB scanner or type code"
        onChange={(e) => {
          setCode(e.target.value);
          setError("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none ring-brand-500 focus:ring-2"
      />

      {scanning ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-black">
          <video ref={videoRef} muted playsInline className="max-h-56 w-full object-cover" />
          <button
            type="button"
            onClick={stopCamera}
            className="w-full bg-zinc-900/80 py-2 text-sm text-white"
          >
            Stop camera
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {scanSupported ? (
          <button
            type="button"
            disabled={busy || scanning}
            onClick={() => void startCamera()}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            Scan with camera
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy || !code.trim()}
          onClick={submit}
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save & ready for delivery"}
        </button>
      </div>
    </div>
  );
}
