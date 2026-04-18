// Generates icon-192.png, icon-512.png, and apple-touch-icon.png
// from the SVG in /public/favicon.svg using sharp.
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#4f46e5"/>
  <path d="M128 320h64v64h-64zM224 224h64v160h-64zM320 144h64v240h-64z" fill="#ffffff"/>
</svg>`;

async function emit(size, name) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  await writeFile(`public/${name}`, buf);
  console.log(`wrote public/${name} (${size}x${size})`);
}

await emit(192, "icon-192.png");
await emit(512, "icon-512.png");
await emit(180, "apple-touch-icon.png");
