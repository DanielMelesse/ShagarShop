import sharp from "sharp";
import path from "path";

const BRAND = "#16a34a";

async function icon(size: number, out: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="${BRAND}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-weight="700" font-size="${Math.round(size * 0.38)}">S</text>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(out);
}

async function main() {
  const publicDir = path.join(process.cwd(), "public");
  await icon(192, path.join(publicDir, "icon-192.png"));
  await icon(512, path.join(publicDir, "icon-512.png"));
  console.log("Generated public/icon-192.png and icon-512.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
