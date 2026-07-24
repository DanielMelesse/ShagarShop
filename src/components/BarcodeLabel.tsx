"use client";

import { useEffect, useRef } from "react";

interface BarcodeLabelProps {
  value: string;
  label?: string;
  className?: string;
}

/** Lightweight barcode bars + readable code (no extra npm dependency). */
export function BarcodeLabel({ value, label, className = "" }: BarcodeLabelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const code = value.toUpperCase();
    const barWidth = 2;
    const height = 48;
    let x = 0;
    // Start/stop guards
    const pattern: number[] = [1, 1, 1, 1];
    for (let i = 0; i < code.length; i++) {
      const n = code.charCodeAt(i);
      pattern.push((n % 3) + 1, ((n >> 2) % 2) + 1, ((n >> 4) % 3) + 1);
    }
    pattern.push(1, 1, 1, 1);

    const width = pattern.reduce((sum, w) => sum + w * barWidth, 0) + 8;
    canvas.width = width;
    canvas.height = height + 18;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111";
    let dark = true;
    x = 4;
    for (const w of pattern) {
      if (dark) ctx.fillRect(x, 4, w * barWidth, height);
      x += w * barWidth;
      dark = !dark;
    }
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(code, width / 2, height + 16);
  }, [value]);

  return (
    <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
      {label ? (
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </p>
      ) : null}
      <canvas ref={canvasRef} className="max-w-full rounded border border-zinc-200 bg-white" />
      <p className="font-mono text-xs font-semibold tracking-wider text-zinc-800">{value}</p>
    </div>
  );
}
