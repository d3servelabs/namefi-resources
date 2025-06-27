import qrcode from 'qrcode';
import sharp from 'sharp';

export interface ImageOverlayConfig {
  domain: string;
  imageBuffer: Buffer;
  logoPath?: string;
  footer?: {
    enabled: boolean;
    padding?: number;
    qrCode?: {
      url: string;
      size?: number;
    };
    nameFiLogo?: {
      size?: number;
      url: string;
    };
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
    // Generate QR code with more margin to prevent cropping
    const qrMargin = 4; // Increased margin
    const qrBuffer = await qrcode.toBuffer(url, {
      width: size,
      margin: qrMargin,
      errorCorrectionLevel: 'H', // Medium error correction for better readability
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
 * Add overlays to marketing image - now creates a footer instead of overlaying
 */
export async function addImageOverlays(
  config: ImageOverlayConfig,
): Promise<OverlayResult> {
  try {
    const metadata = await sharp(config.imageBuffer).metadata();
    const width = metadata.width;
    const height = metadata.height;

    if (!width || !height) {
      throw new Error('Unable to get image dimensions');
    }

    // If footer is disabled or no logo/QR code is configured, return original image
    const hasFooterContent = config.footer?.nameFiLogo || config.footer?.qrCode;
    const footerEnabled = config.footer?.enabled !== false; // Default to true

    if (!footerEnabled || !hasFooterContent) {
      const finalBuffer = await sharp(config.imageBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();
      return {
        success: true,
        processedImage: finalBuffer,
      };
    }

    const footerConfig = config.footer || { enabled: true };
    const horizontalPadding = footerConfig.padding || 20;
    const verticalPadding = 5; // Further reduced vertical padding

    // Load logo if configured - increased default size
    let logoHeight = 0;
    let logoBuffer = null;
    if (footerConfig.nameFiLogo) {
      const logoSize = footerConfig.nameFiLogo.size || 150; // Increased from 100
      logoBuffer = await loadAndResizeLogo(
        footerConfig.nameFiLogo.url,
        logoSize,
      );
      const logoMeta = await sharp(logoBuffer).metadata();
      logoHeight = logoMeta.height || logoSize;
    }

    // Calculate footer height first to ensure everything fits
    const maxContentHeight = Math.max(logoHeight, 100); // Use logo height or default
    const footerHeight = maxContentHeight + verticalPadding * 2; // Minimal padding

    // Generate QR code if configured
    let qrBuffer = null;
    let qrSize = 0;
    if (footerConfig.qrCode) {
      // Increase QR code size for better visibility
      qrSize = Math.min(maxContentHeight * 0.8, 120); // Max 120px, 80% of logo height
      const qrUrl = `${footerConfig.qrCode.url}?utm_campaign=jain`;
      // Generate QR code with better quality settings
      qrBuffer = await generateQrCode(qrUrl, qrSize);
    }

    const extendedImage = await sharp(config.imageBuffer)
      .extend({
        bottom: footerHeight,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toBuffer();

    // Now add the logo and QR code to the extended image
    let finalImage = sharp(extendedImage);
    const composites = [];

    if (logoBuffer) {
      const logoTop = height + Math.floor((footerHeight - logoHeight) / 2);
      composites.push({
        input: logoBuffer,
        left: horizontalPadding,
        top: logoTop, // Center vertically in footer
      });
    }

    if (qrBuffer) {
      const qrLeft = width - qrSize - horizontalPadding;
      const qrTop = height + Math.floor((footerHeight - qrSize) / 2);
      composites.push({
        input: qrBuffer,
        left: qrLeft,
        top: qrTop, // Center vertically in footer
      });
    }

    if (composites.length > 0) {
      finalImage = finalImage.composite(composites);
    }

    const result = await finalImage.jpeg({ quality: 90 }).toBuffer();

    return {
      success: true,
      processedImage: result,
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
 * Default configuration for marketing image overlays with footer
 */
export function createDefaultOverlayConfig(
  domain: string,
  imageBuffer: Buffer,
  nameFiLogoUrl: string,
): ImageOverlayConfig {
  return {
    domain,
    imageBuffer,
    footer: {
      enabled: true,
      padding: 20, // Horizontal padding
      qrCode: {
        url: `https://${domain}`,
        size: 150, // This will be resized to match logo height
      },
      nameFiLogo: {
        size: 150, // Increased logo size for better visibility
        url: nameFiLogoUrl,
      },
    },
  };
}
