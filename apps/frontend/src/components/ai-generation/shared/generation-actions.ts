import { toast } from 'sonner';
import { buildGenerationShareUrl, downloadImageFromUrl } from './gallery-utils';

type ResolveLinkArgs = {
  id?: string | null;
  fallbackUrl?: string | null;
};

export const resolveGenerationLink = ({
  id,
  fallbackUrl,
}: ResolveLinkArgs): string | null => {
  if (id) {
    const url = buildGenerationShareUrl(id);
    if (url) return url;
  }

  if (fallbackUrl) return fallbackUrl;
  return null;
};

const sanitizeBasename = (input: string) => {
  const trimmed = input.trim().toLowerCase();
  const replacedWhitespace = trimmed.replace(/\s+/g, '-');
  const cleaned = replacedWhitespace.replace(/[^a-z0-9-_]/g, '');
  return cleaned.replace(/-+/g, '-') || 'generation';
};

export const buildDownloadFilename = (base: string, extension = 'png') => {
  const sanitized = sanitizeBasename(base);
  const normalizedExtension = extension.startsWith('.')
    ? extension
    : `.${extension}`;
  return `${sanitized}${normalizedExtension}`;
};

type CopyGenerationLinkOptions = {
  id?: string | null;
  fallbackUrl?: string | null;
  successMessage?: string;
  successDescription?: string;
  errorMessage?: string;
  errorDescription?: string;
  unavailableMessage?: string;
  unavailableDescription?: string;
  missingLinkMessage?: string;
  missingLinkDescription?: string;
};

export const copyGenerationLink = async ({
  id,
  fallbackUrl,
  successMessage = 'Link copied to clipboard',
  successDescription = 'You can now share this generation with others',
  errorMessage = 'Failed to copy link',
  errorDescription = 'Please try again',
  unavailableMessage = 'Clipboard unavailable',
  unavailableDescription = 'Copying is not supported in this environment.',
  missingLinkMessage = 'Unable to copy link',
  missingLinkDescription = 'A shareable link is not available for this generation.',
}: CopyGenerationLinkOptions): Promise<boolean> => {
  const link = resolveGenerationLink({ id, fallbackUrl });

  if (!link) {
    toast.error(missingLinkMessage, {
      description: missingLinkDescription,
    });
    return false;
  }

  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    toast.error(unavailableMessage, {
      description: unavailableDescription,
    });
    return false;
  }

  try {
    await navigator.clipboard.writeText(link);
    toast.success(successMessage, {
      description: successDescription,
    });
    return true;
  } catch {
    toast.error(errorMessage, {
      description: errorDescription,
    });
    return false;
  }
};

type DownloadGenerationAssetOptions = {
  url?: string | null;
  filename: string;
  errorMessage?: string;
  errorDescription?: string;
};

export const downloadGenerationAsset = async ({
  url,
  filename,
  errorMessage = 'Failed to download image',
  errorDescription = 'Please try again',
}: DownloadGenerationAssetOptions): Promise<boolean> => {
  if (!url) return false;

  try {
    await downloadImageFromUrl(url, filename);
    return true;
  } catch {
    toast.error(errorMessage, {
      description: errorDescription,
    });
    return false;
  }
};
