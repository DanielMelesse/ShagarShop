"use client";

import { useEffect, useRef } from "react";

interface BarcodeLabelProps {
  value: string;
  label?: string;
  className?: string;
  /** Show print button (seller package labels). */
  printable?: boolean;
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

function clearSvg(svg: SVGSVGElement) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
}

/** Draw a readable barcode pattern into an SVG (sync — always visible). */
function drawFallbackBarcode(svg: SVGSVGElement, value: string) {
  const code = value.toUpperCase();
  const barWidth = 2;
  const height = 56;
  const pattern: number[] = [2, 1, 1, 2];
  for (let i = 0; i < code.length; i++) {
    const n = code.charCodeAt(i);
    pattern.push((n % 3) + 1, ((n >> 2) % 2) + 1, ((n >> 4) % 3) + 1, 1);
  }
  pattern.push(2, 1, 1, 2);

  const barsWidth = pattern.reduce((sum, w) => sum + w * barWidth, 0);
  const width = Math.max(barsWidth + 16, 160);
  const totalHeight = height + 24;

  clearSvg(svg);
  svg.setAttribute("viewBox", `0 0 ${width} ${totalHeight}`);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(totalHeight));
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `Barcode ${code}`);
  svg.removeAttribute("aria-hidden");

  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("width", String(width));
  bg.setAttribute("height", String(totalHeight));
  bg.setAttribute("fill", "#ffffff");
  svg.appendChild(bg);

  let x = 8;
  let dark = true;
  for (const w of pattern) {
    if (dark) {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", "4");
      rect.setAttribute("width", String(w * barWidth));
      rect.setAttribute("height", String(height));
      rect.setAttribute("fill", "#111111");
      svg.appendChild(rect);
    }
    x += w * barWidth;
    dark = !dark;
  }

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", String(width / 2));
  text.setAttribute("y", String(height + 18));
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("font-family", "ui-monospace, SFMono-Regular, Menlo, monospace");
  text.setAttribute("font-size", "11");
  text.setAttribute("fill", "#111111");
  text.textContent = code;
  svg.appendChild(text);
}

/** Try Code128 via jsbarcode on a temp SVG; only swap if it produced bars. */
async function tryUpgradeToJsBarcode(
  svg: SVGSVGElement,
  value: string,
): Promise<boolean> {
  try {
    const mod = (await import("jsbarcode")) as {
      default?: unknown;
      (el: SVGSVGElement, v: string, o: object): void;
    };
    const JsBarcode =
      typeof mod === "function"
        ? mod
        : typeof mod.default === "function"
          ? mod.default
          : null;
    if (typeof JsBarcode !== "function") return false;

    const temp = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    (JsBarcode as (el: SVGSVGElement, v: string, o: object) => void)(temp, value, {
      format: "CODE128",
      width: 1.8,
      height: 56,
      displayValue: true,
      fontSize: 12,
      margin: 8,
      background: "#ffffff",
      lineColor: "#111111",
      xmlDocument: document,
    });

    if (temp.querySelectorAll("rect").length < 5) return false;

    const width = temp.getAttribute("width") || "320";
    const height = temp.getAttribute("height") || "86";
    clearSvg(svg);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute(
      "viewBox",
      temp.getAttribute("viewBox") || `0 0 ${parseFloat(width)} ${parseFloat(height)}`,
    );
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", `Barcode ${value}`);
    while (temp.firstChild) {
      svg.appendChild(temp.firstChild);
    }
    return true;
  } catch {
    return false;
  }
}

/** Visible barcode + optional print-ready package label. */
export function BarcodeLabel({
  value,
  label,
  className = "",
  printable = false,
  shopName,
  productName,
  quantity,
  orderRef,
}: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !value) return;

    // Always paint a visible barcode immediately (no blank state).
    drawFallbackBarcode(svg, value);

    let cancelled = false;
    void (async () => {
      const upgraded = await tryUpgradeToJsBarcode(svg, value);
      if (cancelled) return;
      // If upgrade failed, keep the fallback that is already on screen.
      if (!upgraded && svg.childNodes.length === 0) {
        drawFallbackBarcode(svg, value);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value]);

  function handlePrint() {
    const svg = svgRef.current;
    if (!svg || svg.childNodes.length === 0) {
      window.alert("Barcode is still loading — try again in a moment.");
      return;
    }

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    if (!clone.getAttribute("width")) clone.setAttribute("width", "320");
    if (!clone.getAttribute("height")) clone.setAttribute("height", "90");
    const svgHtml = new XMLSerializer().serializeToString(clone);

    const win = window.open("", "_blank", "noopener,noreferrer,width=420,height=640");
    if (!win) {
      window.alert("Allow pop-ups to print the barcode label.");
      return;
    }

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Package label ${escapeHtml(value)}</title>
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
    .code { margin-top: 16px; text-align: center; }
    .code svg {
      max-width: 100%;
      height: auto;
      background: #fff;
      border: 1px solid #ddd;
    }
    .human {
      margin-top: 8px;
      font-family: ui-monospace, monospace;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.06em;
      word-break: break-all;
    }
    .hint { margin-top: 12px; font-size: 11px; color: #666; text-align: center; }
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
      <div><strong>Code</strong> ${escapeHtml(value)}</div>
    </div>
    <div class="code">
      ${svgHtml}
      <div class="human">${escapeHtml(value)}</div>
    </div>
    <p class="hint">Unique to this shop &amp; order item · Stick on package</p>
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

  return (
    <div
      className={`inline-flex w-full max-w-md flex-col items-stretch gap-2 ${className}`}
    >
      {label ? (
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </p>
      ) : null}

      <div className="rounded-lg border-2 border-zinc-300 bg-white p-3 shadow-sm">
        <svg
          ref={svgRef}
          className="mx-auto block h-auto min-h-[72px] w-full max-w-full bg-white"
        />
      </div>

      <p className="break-all font-mono text-sm font-semibold tracking-wider text-zinc-900">
        {value}
      </p>

      {printable ? (
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex w-fit items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Print barcode label
        </button>
      ) : null}
    </div>
  );
}
