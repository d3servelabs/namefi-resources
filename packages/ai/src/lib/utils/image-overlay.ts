import qrcode from 'qrcode';
import sharp from 'sharp';

export interface ImageOverlayConfig {
  domain: string;
  imageBuffer: Buffer;
  logoPath?: string;
  qrCode?: {
    url: string;
    size?: number;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  };
  nameFiLogo?: {
    size?: number;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    url: string;
  };
}

export interface OverlayResult {
  success: boolean;
  processedImage?: Buffer;
  error?: Error;
}

/**
 * Generate QR code buffer
 */
async function generateQrCode(url: string, size = 150): Promise<Buffer> {
  try {
    const qrBuffer = await qrcode.toBuffer(url, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrBuffer;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error}`);
  }
}

/**
 * Load and resize logo from URL
 */
async function loadAndResizeLogo(logoUrl: string, size = 100): Promise<Buffer> {
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch logo from URL: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const logoBuffer = Buffer.from(arrayBuffer);

    const resizedLogo = await sharp(logoBuffer)
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
    return resizedLogo;
  } catch (error) {
    throw new Error(`Failed to load logo from ${logoUrl}: ${error}`);
  }
}

/**
 * Calculate position coordinates for overlay elements
 */
function calculatePosition(
  imageWidth: number,
  imageHeight: number,
  elementWidth: number,
  elementHeight: number,
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left',
  padding = 20,
): { left: number; top: number } {
  const positions = {
    'bottom-right': {
      left: imageWidth - elementWidth - padding,
      top: imageHeight - elementHeight - padding,
    },
    'bottom-left': {
      left: padding,
      top: imageHeight - elementHeight - padding,
    },
    'top-right': {
      left: imageWidth - elementWidth - padding,
      top: padding,
    },
    'top-left': {
      left: padding,
      top: padding,
    },
  };

  return positions[position];
}

/**
 * Add overlays to marketing image
 */
export async function addImageOverlays(
  config: ImageOverlayConfig,
): Promise<OverlayResult> {
  try {
    let processedImage = sharp(config.imageBuffer);
    const { width, height } = await processedImage.metadata();

    if (!(width && height)) {
      throw new Error('Unable to get image dimensions');
    }

    const overlays: sharp.OverlayOptions[] = [];

    // Add QR code if configured
    if (config.qrCode) {
      const qrSize = config.qrCode.size || 150;
      const qrUrl = `${config.qrCode.url}?utm_campaign=jain`;
      const qrBuffer = await generateQrCode(qrUrl, qrSize);

      const qrPosition = calculatePosition(
        width,
        height,
        qrSize,
        qrSize,
        config.qrCode.position || 'bottom-right',
      );

      overlays.push({
        input: qrBuffer,
        left: qrPosition.left,
        top: qrPosition.top,
      });
    }

    // Add NameFi logo if configured
    if (config.nameFiLogo) {
      const logoSize = config.nameFiLogo.size || 100;
      const logoPosition = config.nameFiLogo.position || 'bottom-left';

      const logoBuffer = await loadAndResizeLogo(
        config.nameFiLogo.url,
        logoSize,
      );
      const { width: logoWidth, height: logoHeight } =
        await sharp(logoBuffer).metadata();

      if (!(logoWidth && logoHeight)) {
        throw new Error('Unable to get logo dimensions');
      }

      const nameFiPosition = calculatePosition(
        width,
        height,
        logoWidth,
        logoHeight,
        logoPosition,
      );

      overlays.push({
        input: logoBuffer,
        left: nameFiPosition.left,
        top: nameFiPosition.top,
      });
    }

    // Apply all overlays
    if (overlays.length > 0) {
      processedImage = processedImage.composite(overlays);
    }

    const finalBuffer = await processedImage.jpeg({ quality: 90 }).toBuffer();

    return {
      success: true,
      processedImage: finalBuffer,
    };
  } catch (error) {
    console.error('Failed to add image overlays:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error('Unknown overlay error'),
    };
  }
}

/**
 * Default configuration for marketing image overlays
 */
export function createDefaultOverlayConfig(
  domain: string,
  imageBuffer: Buffer,
  nameFiLogoUrl: string,
): ImageOverlayConfig {
  return {
    domain,
    imageBuffer,
    qrCode: {
      url: `https://${domain}`,
      size: 150,
      position: 'bottom-right',
    },
    nameFiLogo: {
      size: 200,
      position: 'bottom-left',
      url: nameFiLogoUrl,
    },
  };
}
