import qrcode, { type QRCodeToBufferOptions } from 'qrcode';
import sharp, { type RGBA } from 'sharp';

// Constants
const QR_CORNER_RADIUS = 4;
const TEXT_QR_SPACING = 16;
const TEXT_FONT_SIZE = 12;
const TEXT_Y_OFFSET = 5;
const QR_TEXT = 'Scan to visit';
const BACKGROUND_COLOR = '#171717';
const FOREGROUND_COLOR = '#FFFFFF';

const hexToRgb = (hex: string): RGBA => {
  if (!hex.startsWith('#') || hex.length !== 7) {
    return { r: 255, g: 255, b: 255, alpha: 1 }; // Default to white
  }

  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
    alpha: 1,
  };
};

export interface ImageOverlayConfig {
  domain: string;
  imageBuffer: Buffer;
  footer: {
    height: number;
    horizontalPadding: number;
    backgroundColor: string;
    qrCode: {
      targetUrl: string;
      options: QRCodeToBufferOptions;
    };
    nameFiLogo: {
      srcUrl: string;
      width: number;
    };
  };
}

export interface OverlayResult {
  success: boolean;
  processedImage?: Buffer;
  error?: Error;
}

/**
 * Create a rounded rectangle mask
 */
const createRoundedMask = async (
  width: number,
  height: number,
  radius: number,
): Promise<Buffer> => {
  const maskSvg = `<svg width="${width}" height="${height}">
    <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white"/>
  </svg>`;

  return sharp(Buffer.from(maskSvg)).png().toBuffer();
};

/**
 * Generate text as an image buffer with Inter font
 */
const generateTextImage = async (
  text: string,
  fontSize: number,
  color: string,
): Promise<Buffer> => {
  const textSvg = `<svg width="200" height="50" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500&amp;display=swap');
      </style>
    </defs>
    <text x="0" y="${fontSize + TEXT_Y_OFFSET}" 
          font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" 
          font-weight="500" 
          font-size="${fontSize}" 
          fill="${color}">
      ${text}
    </text>
  </svg>`;

  return sharp(Buffer.from(textSvg)).png().trim().toBuffer();
};

/**
 * Generate QR code buffer with rounded corners
 */
const generateQrCode = async (
  url: string,
  options: QRCodeToBufferOptions,
): Promise<Buffer> => {
  try {
    const qrBuffer = await qrcode.toBuffer(url, options);
    const { width, height } = await sharp(qrBuffer).metadata();
    const mask = await createRoundedMask(width, height, QR_CORNER_RADIUS);

    return sharp(qrBuffer)
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error}`);
  }
};

/**
 * Load and resize logo from URL
 */
const loadAndResizeLogo = async (
  logoUrl: string,
  width: number,
): Promise<Buffer> => {
  const response = await fetch(logoUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch logo from URL: ${response.statusText}`);
  }

  const logoBuffer = Buffer.from(await response.arrayBuffer());

  return sharp(logoBuffer)
    .resize(width, null, { fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer();
};

/**
 * Add overlays to marketing image - creates a footer with logo and QR code
 */
export const addImageOverlays = async (
  config: ImageOverlayConfig,
): Promise<OverlayResult> => {
  try {
    const { width, height } = await sharp(config.imageBuffer).metadata();
    if (!width || !height) {
      throw new Error('Unable to get image dimensions');
    }

    const {
      footer: {
        height: footerHeight,
        horizontalPadding,
        backgroundColor,
        nameFiLogo,
        qrCode,
      },
    } = config;

    // Parse background color
    const bgColor = hexToRgb(backgroundColor);

    // Extend image with footer
    const extendedImage = await sharp(config.imageBuffer)
      .extend({ bottom: footerHeight, background: bgColor })
      .toBuffer();

    const composites = [];

    // Load and position logo
    if (nameFiLogo) {
      const logoBuffer = await loadAndResizeLogo(
        nameFiLogo.srcUrl,
        nameFiLogo.width,
      );
      const { height: logoHeight } = await sharp(logoBuffer).metadata();

      composites.push({
        input: logoBuffer,
        left: horizontalPadding,
        top: height + Math.floor((footerHeight - logoHeight) / 2),
      });
    }

    // Generate and position QR code with text
    if (qrCode) {
      const qrBuffer = await generateQrCode(qrCode.targetUrl, qrCode.options);
      const { width: qrWidth, height: qrHeight } =
        await sharp(qrBuffer).metadata();

      // Generate "Scan to visit" text
      const textColor =
        backgroundColor === BACKGROUND_COLOR
          ? FOREGROUND_COLOR
          : BACKGROUND_COLOR;
      const textBuffer = await generateTextImage(
        QR_TEXT,
        TEXT_FONT_SIZE,
        textColor,
      );
      const { width: textWidth, height: textHeight } =
        await sharp(textBuffer).metadata();

      // Calculate positions
      const qrLeft = width - qrWidth - horizontalPadding;
      const qrTop = height + Math.floor((footerHeight - qrHeight) / 2);
      const textLeft = qrLeft - textWidth - TEXT_QR_SPACING;
      const textTop = height + Math.floor((footerHeight - textHeight) / 2);

      composites.push(
        { input: textBuffer, left: textLeft, top: textTop },
        { input: qrBuffer, left: qrLeft, top: qrTop },
      );
    }

    // Apply composites and return result
    const finalImage =
      composites.length > 0
        ? sharp(extendedImage).composite(composites)
        : sharp(extendedImage);

    const processedImage = await finalImage.jpeg({ quality: 100 }).toBuffer();

    return { success: true, processedImage };
  } catch (error) {
    console.error('Failed to add image overlays:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error('Unknown overlay error'),
    };
  }
};

/**
 * Default configuration for marketing image overlays with footer
 */
export const createDefaultOverlayConfig = (
  domain: string,
  imageBuffer: Buffer,
  nameFiLogoUrl: string,
): ImageOverlayConfig => ({
  domain,
  imageBuffer,
  footer: {
    height: 104,
    horizontalPadding: 32,
    backgroundColor: BACKGROUND_COLOR,
    qrCode: {
      targetUrl: `https://${domain}?utm_source=namefi-jain`,
      options: {
        width: 72,
        margin: 3,
        errorCorrectionLevel: 'H',
        color: {
          dark: BACKGROUND_COLOR,
          light: FOREGROUND_COLOR,
        },
      },
    },
    nameFiLogo: {
      srcUrl: nameFiLogoUrl,
      width: 229,
    },
  },
});
