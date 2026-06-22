import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { parseDomainName } from '@namefi-astra/utils';
import type { ImageModel } from '../../types/generation';
import type {
  LogoStyle,
  LogoTextTreatmentInput,
  LogoType,
  LogoTypographyInput,
} from '../../types/logo-options';

export interface LogoImageParams {
  basePrompt: string;
  domain: NamefiNormalizedDomain;
  logoType: LogoType;
  style: LogoStyle;
  colorPalette?: string[];
  textTreatment?: LogoTextTreatmentInput;
  typography?: LogoTypographyInput;
  model: ImageModel;
}

type DomainTextInfo = {
  fullDomain: string;
  registrableDomain: string;
  brandLabel: string;
  tld: string;
  subdomain?: string;
};

function getDomainTextInfo(domain: NamefiNormalizedDomain): DomainTextInfo {
  const fallbackLabels = domain.split('.');
  const fallbackBrand = fallbackLabels[0] || domain;
  const fallbackTld = fallbackLabels.slice(1).join('.');

  const parsed = parseDomainName(domain);
  if (!parsed.valid) {
    return {
      fullDomain: domain,
      registrableDomain: domain,
      brandLabel: fallbackBrand,
      tld: fallbackTld,
    };
  }

  const tld = parsed.publicSuffix;
  const registrableDomain = parsed.publicSuffixPlusOne;
  const tldSuffix = tld ? `.${tld}` : '';
  const brandLabel =
    tldSuffix && registrableDomain.endsWith(tldSuffix)
      ? registrableDomain.slice(0, -tldSuffix.length)
      : registrableDomain;
  const tldLabels = tld ? tld.split('.').length : 0;
  const subdomainLabels = parsed.labels.slice(
    0,
    Math.max(parsed.labels.length - (tldLabels + 1), 0),
  );

  return {
    fullDomain: domain,
    registrableDomain,
    brandLabel: brandLabel || fallbackBrand,
    tld,
    subdomain: subdomainLabels.length ? subdomainLabels.join('.') : undefined,
  };
}

function buildTextTreatmentInstructions(
  treatment: LogoTextTreatmentInput | undefined,
  info: DomainTextInfo,
) {
  const fullDomainText = `Use the exact text "${info.fullDomain}" when rendering the domain.`;
  const tldHint = info.tld ? `.${info.tld}` : '';
  const dotRules = [
    'The dot before the TLD is mandatory whenever the TLD appears.',
    'Never render a naked TLD; use the leading dot, for example ".ai" instead of "ai".',
    'Never replace the real TLD with another TLD, and never add spaces around the dot.',
  ];

  switch (treatment) {
    case 'full-domain':
      return [
        'Text treatment: Full Domain.',
        fullDomainText,
        'Set the domain on a single line with no line breaks or stacking.',
        'If the domain is long, keep it one line by reducing font size, using condensed letterforms, tightening tracking/kerning, or placing the wordmark on a gentle arc/curve.',
        'Do not split the TLD onto a new line under any circumstances.',
        'Keep the dot visible and the TLD legible.',
        ...dotRules,
      ];
    case 'tld-subtle':
      return [
        'Text treatment: TLD Subtle.',
        `Primary wordmark is "${info.brandLabel}" with "${tldHint}" secondary, smaller, or lighter.`,
        'Keep the dot aligned with the baseline and fully visible.',
        ...dotRules,
      ];
    case 'tld-highlight':
      return [
        'Text treatment: TLD Highlight.',
        `Primary wordmark is "${info.brandLabel}" and "${tldHint}" (or the dot) becomes a deliberate accent.`,
        'Keep the TLD readable while using color, shape, or weight for emphasis.',
        ...dotRules,
      ];
    case 'stacked-domain':
      return [
        'Text treatment: Stacked Domain.',
        `Stack "${info.brandLabel}" on the first line and "${tldHint}" on the second line.`,
        'Preserve the leading dot on the second line and keep alignment clean.',
        ...dotRules,
      ];
    default:
      return [
        'Text treatment: Choose the strongest lockup for the brand.',
        fullDomainText,
        'If you include the domain, treat the dot and TLD as intentional design elements.',
        ...dotRules,
      ];
  }
}

function buildColorInstructions(colorPalette: string[] | undefined) {
  if (!colorPalette?.length) {
    return [
      'Color plan:',
      '- Use a high-contrast role-based palette.',
      '- Choose a soft, subtle, colorful gradient canvas that supports the logo colors.',
      '- Prefer medium-low background saturation: softened, muted, or dusted color classes are usually better than intense edge-to-edge saturated fields, but the background should not become washed out or nearly white.',
      '- Use 2-3 softly blended background stops plus an optional gentle accent, chosen freely for the brand rather than from a fixed recipe.',
      '- Make the background feel polished, playful, and intentionally colorful, but quieter than the logo.',
      '- Make the gradient clearly but quietly multi-color at thumbnail size while preserving a clean focal area for the logo.',
      '- Keep the background low-detail and behind the logo.',
      '- Add a barely visible fine grain/noise layer to soften the gradient and reduce banding; it must not read as heavy texture, speckles, dust, paper, or a pattern.',
      '- Maintain strong contrast with the primary text, mark, dot, and TLD.',
      '- Do not let background color relationships make the logo blend into the canvas.',
    ].join('\n');
  }

  return [
    'Color plan:',
    ...colorPalette.map((color) => `- ${color}`),
    '- Use the Background base and Background gradient accents as a soft, subtle, colorful gradient canvas.',
    '- Prefer medium-low background saturation: softened, muted, or dusted color classes are usually better than intense edge-to-edge saturated fields, but the background should not become washed out or nearly white.',
    '- Use 2-3 softly blended background stops plus an optional gentle accent, chosen freely from the logo palette, brand personality, domain meaning, and selected style.',
    '- Make the background feel polished, playful, and intentionally colorful, but quieter than the logo.',
    '- Make the gradient clearly but quietly multi-color at thumbnail size while preserving a clean focal area for the logo.',
    '- Keep the gradient low-detail and behind the logo.',
    '- Add a barely visible fine grain/noise layer to soften the gradient and reduce banding; it must not read as heavy texture, speckles, dust, paper, or a pattern.',
    '- The background must never compete with the mark, wordmark, dot, or TLD.',
    '- Maintain strong contrast between the background and the primary text/wordmark, main mark/accent, and TLD/dot treatment.',
    '- Place the most visually active background regions away from fine text or small TLD details when needed.',
    '- Do not let background color relationships make the logo blend into the canvas.',
  ].join('\n');
}

function buildTypographyInstructions(
  typography: LogoTypographyInput | undefined,
  style: LogoStyle,
) {
  switch (typography) {
    case 'sans-serif':
      return 'Typography: Clean sans serif with balanced proportions and simple forms.';
    case 'serif':
      return 'Typography: Refined serif with elegant terminals and balanced contrast.';
    case 'slab-serif':
      return 'Typography: Bold slab serif with sturdy, rectangular serifs.';
    case 'monospace':
      return 'Typography: Monospace or mono-inspired with technical precision.';
    case 'script':
      return 'Typography: Script or hand-lettered style with smooth, confident strokes.';
    default:
      return `Typography: Choose a distinctive, brand-appropriate style (avoid generic/default fonts). Suggested direction for ${style}: ${style === 'luxury' ? 'high-contrast serif or sleek minimalist sans' : style === 'classic' ? 'refined serif or traditional sans' : style === 'bold' ? 'heavy geometric sans or slab serif' : style === 'innovative' ? 'geometric or neo-grotesque sans' : style === 'retro' ? 'vintage display or slab serif' : style === 'fun-playful' ? 'rounded or playful display' : style === 'warm-inviting' ? 'humanist or rounded sans' : style === 'confidence' ? 'authoritative serif or balanced sans' : style === 'joy' ? 'friendly rounded sans' : style === 'peace' ? 'soft, airy sans or light serif' : style === 'purity' ? 'clean minimalist sans' : style === 'trust' ? 'stable humanist sans or classic serif' : 'bespoke letterforms aligned with the mood'}.`;
  }
}

function buildLogoTypeInstructions(logoType: LogoType, forceWordmark: boolean) {
  const base = forceWordmark
    ? 'Include a wordmark in the final lockup as specified.'
    : 'Include a wordmark if it strengthens the identity.';
  switch (logoType) {
    case 'wordmark':
      return `${base} Wordmark is the primary element; focus on typographic craft.`;
    case 'letter-mark':
      return `${base} Use the first letter or initials from the brand label as the mark, with optional supporting wordmark.`;
    case 'mascot':
      return `${base} If using a mascot, keep it stylized and logo-like (not illustrative).`;
    case 'image-icon':
      return `${base} Pair a recognizable object, product, tool, or concrete symbol with the wordmark for balance.`;
    case 'abstract-icon':
      return `${base} Use a refined non-literal geometric or metaphorical mark paired with the wordmark.`;
    default:
      return base;
  }
}

export const enhanceLogoPrompt = ({
  basePrompt,
  domain,
  logoType,
  style,
  colorPalette,
  textTreatment,
  typography,
  model,
}: LogoImageParams) => {
  const domainInfo = getDomainTextInfo(domain);
  const forceWordmark =
    textTreatment !== undefined && textTreatment !== 'let-ai-choose';
  const textTreatmentLines = buildTextTreatmentInstructions(
    textTreatment,
    domainInfo,
  );

  return `${basePrompt}

Brand text guide:
- Full domain: ${domainInfo.fullDomain}
- Registrable domain: ${domainInfo.registrableDomain}
- Brand label: ${domainInfo.brandLabel}${domainInfo.tld ? ` (TLD: ${domainInfo.tld})` : ''}
${domainInfo.subdomain ? `- Subdomain prefix: ${domainInfo.subdomain}` : ''}
- Preserve hyphens, spelling, and dots exactly as provided.

${textTreatmentLines.join('\n')}
${buildTypographyInstructions(typography, style)}
${buildLogoTypeInstructions(logoType, forceWordmark)}
${buildColorInstructions(colorPalette)}

Logo craftsmanship:
- Prioritize a logo feel: clean vector-like shapes, strong geometry, and clear negative space.
- Avoid illustrative scenes, photorealism, heavy texture, or 3D effects.
- Typography should feel bespoke and cohesive with the selected style (${style}); avoid generic or repetitive fonts.
- Professional kerning and optical alignment are essential.

Ensure the design is professional, scalable, and works well in various contexts.

Background styling:
- Use the color plan's soft, subtle, colorful gradient canvas behind the logo.
- Use 2-3 softly blended background stops plus an optional gentle accent.
- Prefer medium-low background saturation: softened, muted, or dusted color classes are usually better than intense edge-to-edge saturated fields, but the background should not become washed out or nearly white.
- Make the background feel polished, playful, and intentionally colorful, but quieter than the logo.
- Make the gradient clearly but quietly multi-color at thumbnail size while preserving a clean focal area for the logo.
- Add a barely visible fine grain/noise layer to soften the gradient and reduce banding; it must not read as heavy texture, speckles, dust, paper, or a pattern.
- Keep the background low-detail and visually quiet.
- Do not let the gradient reduce text, dot, TLD, or mark contrast.
- The background should enhance the logo and never overpower it.

${
  model === 'gemini-2.5-flash-image' || model === 'gemini-3-pro-image-preview'
    ? `
REQUIREMENTS:
- Output a single square image at 1024x1024 resolution.
- Produce ONLY the logo (no mockups, products, scenes, people, or environments).
- Background: soft, subtle, colorful gradient canvas from the color plan, visually complementary and non-distracting, with barely visible fine grain and strong logo contrast.
- No watermarks or additional decorative elements beyond the simple background.
- Center the logo with balanced padding; leave adequate breathing room around it.
- If the logo includes the brand name text, render it cleanly; otherwise, render only the mark.
- Return exactly one image as output.`
    : ''
}`;
};

export const logoGenerationSystemPrompt =
  'You are an AI assistant that generates professional logo designs. Focus on clean, logo-like marks and accurate typography. Use the image_generation tool to create a logo based on the given prompt.';
