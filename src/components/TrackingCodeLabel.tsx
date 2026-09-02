"use client";

import { useState } from "react";

interface TrackingCodeLabelProps {
  value: string;
  label?: string;
  className?: string;
  /** Show print button (seller package labels). */
  printable?: boolean;
  /** Seller sees write-on-package instructions; couriers see code only. */
  variant?: "seller" | "courier";
  shopName?: string | null;
  productName?: string;
  quantity?: number;
  orderRef?: string;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Display a system tracking code (QR upgrade later). */
export function TrackingCodeLabel({
  value,
  label,
  className = "",
  printable = false,
  variant = "courier",
  shopName,
  productName,
  quantity,
  orderRef,
}: TrackingCodeLabelProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert("Could not copy — select and copy the code manually.");
    }
  }

  function handlePrint() {
    const win = window.open("", "_blank", "noopener,noreferrer,width=420,height=640");
    if (!win) {
      window.alert("Allow pop-ups to print the tracking label.");
      return;
    }

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Tracking ${escapeHtml(value)}</title>
  <style>
    @page { margin: 8mm; size: 100mm 150mm; }
    body {
      font-family: ui-sans-serif, system-ui, sans-serif;
      margin: 0;
      padding: 16px;
      color: #111;
      background: #fff;
    }
    .label {
      border: 2px solid #111;
      border-radius: 8px;
      padding: 16px;
      max-width: 360px;
      margin: 0 auto;
      background: #fff;
    }
    .brand { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #555; }
    .shop { font-size: 18px; font-weight: 700; margin-top: 4px; }
    .meta { margin-top: 12px; font-size: 13px; line-height: 1.45; }
    .meta strong { display: inline-block; min-width: 4.5rem; color: #444; font-weight: 600; }
    .code {
      margin-top: 16px;
      padding: 12px;
      border: 2px dashed #111;
      border-radius: 8px;
      text-align: center;
    }
    .human {
      font-family: ui-monospace, monospace;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.08em;
      word-break: break-all;
    }
    .hint { margin-top: 12px; font-size: 12px; color: #444; text-align: center; line-height: 1.4; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="brand">ShegerShop package</div>
    <div class="shop">${escapeHtml(shopName || "Seller")}</div>
    <div class="meta">
      ${productName ? `<div><strong>Item</strong> ${escapeHtml(productName)}</div>` : ""}
      ${quantity != null ? `<div><strong>Qty</strong> ${quantity}</div>` : ""}
      ${orderRef ? `<div><strong>Order</strong> #${escapeHtml(orderRef)}</div>` : ""}
    </div>
    <div class="code">
      <div class="human">${escapeHtml(value)}</div>
    </div>
    <p class="hint">Write this tracking code clearly on the package</p>
  </div>
  <p class="no-print" style="text-align:center;margin-top:16px">
    <button onclick="window.print()" style="padding:8px 16px;font-size:14px;cursor:pointer">Print label</button>
  </p>
  <script>window.onload = function () { setTimeout(function () { window.print(); }, 250); };</script>
</body>
</html>`);
    win.document.close();
  }

  if (!value) return null;

  const isSeller = variant === "seller";

  return (
    <div
      className={`inline-flex w-full max-w-md flex-col items-stretch gap-2 ${className}`}
    >
      {label ? (
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </p>
      ) : null}

      <div className="rounded-lg border-2 border-zinc-300 bg-white px-4 py-3 shadow-sm">
        <p className="break-all text-center font-mono text-lg font-bold tracking-widest text-zinc-900">
          {value}
        </p>
      </div>

      {isSeller ? (
        <p className="text-xs leading-relaxed text-zinc-600">
          Write this code clearly on the package before handoff. Each order item
          gets a unique ShegerShop tracking code.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {isSeller ? (
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            {copied ? "Copied" : "Copy code"}
          </button>
        ) : null}
        {printable ? (
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Print label
          </button>
        ) : null}
      </div>
    </div>
  );
}
