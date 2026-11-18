import { copyFile, mkdir, open, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const source = join(dirname(resolve(process.argv[1])), 'entry.png');
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const output = join(outputDir, 'entry.png');

try {
  const info = await stat(source).catch(() => null);
  if (!info?.isFile()) throw new Error('entry.png is missing or is not a regular file');
  if (info.size > 1024 * 1024) throw new Error(`entry.png is too large (${info.size} bytes; maximum is 1048576)`);

  const file = await open(source, 'r');
  const signature = Buffer.alloc(8);
  try {
    await file.read(signature, 0, 8, 0);
  } finally {
    await file.close();
  }
  const png = signature.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = signature[0] === 255 && signature[1] === 216 && signature[2] === 255;
  if (!png && !jpeg) throw new Error('entry.png is not a PNG or JPEG image');

  await mkdir(outputDir, { recursive: true });
  await copyFile(source, output);
  console.log(`Wrote ${info.size} bytes to ${output}`);
} catch (error) {
  console.error(`Cannot create entry image: ${error.message}`);
  process.exitCode = 1;
}
