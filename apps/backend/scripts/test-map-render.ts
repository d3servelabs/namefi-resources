import { writeFileSync } from 'node:fs';
import { renderLoginLocationMap } from '../src/lib/login-notification/login-location-map';

async function main() {
  const cases = [
    { name: 'paris', lat: 48.8566, lng: 2.3522, isAlert: false },
    {
      name: 'mountain-view',
      lat: 37.386051,
      lng: -122.083851,
      isAlert: true,
    },
    { name: 'invalid-nan', lat: Number.NaN, lng: 0, isAlert: false },
    { name: 'out-of-range', lat: 91, lng: 0, isAlert: false },
  ];
  for (const c of cases) {
    const result = await renderLoginLocationMap({
      lat: c.lat,
      lng: c.lng,
      isAlert: c.isAlert,
    });
    if (result === null) {
      console.log(`${c.name.padEnd(16)} -> null (rejected)`);
      continue;
    }
    const head = result.png.subarray(0, 8);
    const isPng =
      head[0] === 0x89 &&
      head[1] === 0x50 &&
      head[2] === 0x4e &&
      head[3] === 0x47;
    console.log(
      `${c.name.padEnd(16)} -> ${result.png.length} bytes, ${result.width}x${result.height}, magic=${head.toString('hex')}, isPng=${isPng}, mime=${result.contentType}, filename=${result.filename}`,
    );
    writeFileSync(`/tmp/${c.name}.png`, result.png);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
