/** biome-ignore-all lint/performance/noImgElement: <explanation> */
import { ImageResponse } from 'next/og';
import { proxyUnauthenticatedClient } from '@/utils/trpc/server';
import { config } from '@/lib/env';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/jpeg';

async function loadGoogleFont(font: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font.split(' ').join('+')}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/,
  );

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.status === 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error('failed to load font data');
}

export default async function Image({
  params,
}: {
  params: { domain: string; generationId: string };
}) {
  const { domain, generationId } = params;

  try {
    // Fetch the generation data
    const generation =
      await proxyUnauthenticatedClient.ai.getGenerationById.query({
        id: generationId,
      });

    if (!generation) {
      // Fallback design if generation not found
      return new ImageResponse(
        <div
          tw="flex flex-col w-full h-full items-center justify-center"
          style={{
            background:
              'radial-gradient(ellipse at top left, #064e3b 0%, #134e4a 30%, #171717 70%)',
          }}
        >
          <div tw="flex flex-col items-center text-center text-white">
            <h1 tw="text-6xl font-bold mb-4">{domain}</h1>
            <p tw="text-lg opacity-75 mt-2">Generation not found</p>
          </div>
        </div>,
        { ...size },
      );
    }

    // Use QR code API service that works in edge runtime
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
      `https://${domain}?utm_source=namefi&utm_medium=og_image&utm_campaign=jain`,
    )}&bgcolor=FFFFFF&color=171717&margin=12&ecc=H`;

    return new ImageResponse(
      <div
        tw="flex w-full h-full"
        style={{
          background:
            'radial-gradient(ellipse at top left, #064e3b 0%, #134e4a 30%, #171717 70%)',
        }}
      >
        {/* Left side - Main generated image */}
        <div tw="flex items-center justify-center w-3/4 p-8">
          <img
            src={generation.url}
            tw="max-w-full max-h-full rounded-xl"
            alt="Generated content"
          />
        </div>

        {/* Right side - QR Code and text */}
        <div tw="flex flex-col items-center justify-center w-1/4 p-8">
          <div tw="flex flex-col items-center text-center">
            <div tw="text-white text-lg font-medium mb-6">Scan to visit</div>
            <img
              src={qrCodeUrl}
              tw="w-48 h-48 mb-6 rounded-lg"
              alt={`QR code for ${domain}`}
            />
            <div tw="text-white text-xl font-bold mb-6">{domain}</div>
            <img
              src={`${config.FIRST_PARTY_DEPLOYMENT_URL}/jain-with-namefi.svg`}
              tw="h-9"
              alt="Just AI'ng with NameFi"
            />
          </div>
        </div>
      </div>,
      {
        ...size,
        fonts: [
          {
            name: 'Roboto Slab',
            data: await loadGoogleFont('Roboto Slab'),
            style: 'normal',
          },
        ],
      },
    );
  } catch (error) {
    console.error('Error fetching generation:', error);

    // Fallback design for errors
    return new ImageResponse(
      <div
        tw="flex flex-col w-full h-full items-center justify-center"
        style={{
          background:
            'radial-gradient(ellipse at top left, #064e3b 0%, #134e4a 30%, #171717 70%)',
        }}
      >
        <div tw="flex flex-col items-center text-center text-white">
          <h1 tw="text-6xl font-bold mb-4">{domain}</h1>
          <p tw="text-lg opacity-75 mt-2">Unable to load</p>
        </div>
      </div>,
      { ...size },
    );
  }
}
