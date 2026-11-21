// Entry program for news-image-20261121 (round 1, main account).
// It ships one file, "news-image entry.png", to the grader's output
// directory. Before it copies anything it proves the file is the poster
// this competition grades: a real PNG, 1024 by 1024, under the 1 MiB cap.
// Anything else fails loudly instead of entering a wrong image.
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const POSTER_NAME = "news-image entry.png";
const EXPECTED_WIDTH = 1024;
const EXPECTED_HEIGHT = 1024;
const MAX_BYTES = 1048576;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function die(reason) {
  throw new Error("entry refused: " + reason);
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const srcPath = join(here, POSTER_NAME);

  const info = statSync(srcPath);
  if (info.size === 0) die(POSTER_NAME + " is empty");
  if (info.size > MAX_BYTES) {
    die(POSTER_NAME + " is " + info.size + " bytes, over the 1 MiB cap");
  }

  const bytes = readFileSync(srcPath);
  for (let i = 0; i < PNG_MAGIC.length; i++) {
    if (bytes[i] !== PNG_MAGIC[i]) die(POSTER_NAME + " is not a PNG file");
  }
  // A truncated file can still carry a valid header, so refuse anything
  // too short to hold the IHDR chunk before reading its dimensions.
  if (bytes.length < 24) die(POSTER_NAME + " is too short to be a complete PNG");
  // PNG header layout: width lives at bytes 16-19, height at 20-23,
  // both big-endian 32-bit.
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== EXPECTED_WIDTH || height !== EXPECTED_HEIGHT) {
    die(POSTER_NAME + " is " + width + "x" + height + ", expected 1024x1024");
  }
  // The file must end with the IEND chunk, or it was cut off mid-write.
  const IEND_TAIL = [0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82];
  const tail = bytes.subarray(bytes.length - IEND_TAIL.length);
  for (let i = 0; i < IEND_TAIL.length; i++) {
    if (tail[i] !== IEND_TAIL[i]) die(POSTER_NAME + " has no IEND trailer (truncated?)");
  }

  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, "entry.png");
  writeFileSync(target, bytes);

  // A second run must produce the same bytes, so read the copy back and
  // compare it with the source before reporting success.
  const back = readFileSync(target);
  if (!back.equals(bytes)) die(target + " does not match the source poster");
  console.log("wrote " + target + " (" + bytes.length + " bytes)");
}

main();
