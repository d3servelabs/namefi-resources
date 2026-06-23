import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { parseDomainName } from '@namefi-astra/utils';
import type { ImageModel } from '../../types/generation';
import {
  LOGO_BACKGROUND_TREATMENTS,
  LOGO_COLOR_TREATMENTS,
} from '../../types/logo-schemas';
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
  logoColorTreatment?: keyof typeof LOGO_COLOR_TREATMENTS;
  backgroundTreatment?: keyof typeof LOGO_BACKGROUND_TREATMENTS;
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

function buildWordmarkColorMapInstructions(
  logoColorTreatment: keyof typeof LOGO_COLOR_TREATMENTS | undefined,
  info: DomainTextInfo,
) {
  const label = info.brandLabel;
  const tld = info.tld ? `.${info.tld}` : 'the TLD';
  const shared = [
    'Wordmark color map:',
    `- Pre-dot brand label: "${label}".`,
    `- Dot/TLD unit: "${tld}".`,
    '- Use color to explain hierarchy or meaning, not to decorate arbitrary letters.',
    '- Keep the palette limited and harmonious: one dominant text color plus one or two supporting colors at most.',
    '- Preserve strong figure/ground contrast for every colored text part.',
    '- Do not rely on color alone for structure; support colored chunks with weight, spacing, case, custom letter shape, or alignment when useful.',
  ];

  switch (logoColorTreatment) {
    case 'semantic-word-split':
      return [
        ...shared,
        `- Split "${label}" into meaningful word units, morphemes, or conceptual chunks and color at least two pre-dot chunks differently using harmonized Logo neutral/ink, Logo primary, or Logo secondary roles.`,
        '- Use analogous, tonal, or clearly brand-related hues; do not alternate colors letter-by-letter.',
        `- ${tld} may use Logo accent/TLD/dot color, but the TLD must not be the only colored text element.`,
      ].join('\n');
    case 'tonal-wordmark-pair':
      return [
        ...shared,
        `- Divide "${label}" into two readable pre-dot chunks and set them in two related dark/chromatic ink colors, such as Logo neutral/ink plus a deeper or richer Logo primary/secondary value.`,
        '- Keep both chunks restrained, mature, and high-contrast; this should feel like a professional two-ink wordmark, not playful multicolor lettering.',
        `- ${tld} can be a quieter accent or one of the two ink colors, but the pre-dot wordmark must visibly use the tonal pair.`,
      ].join('\n');
    case 'letterform-accent-system':
      return [
        ...shared,
        `- Keep most of "${label}" in a strong chromatic ink, then apply Logo primary, secondary, or accent color to selected pre-dot letterform details such as counters, crossbars, dots, stems, swashes, ligatures, or custom cuts.`,
        '- The colored details must appear inside the brand label before the dot, not only in the TLD.',
        '- Use 1-3 deliberate details, not scattered confetti.',
      ].join('\n');
    case 'split-wordmark-accent':
      return [
        ...shared,
        `- Apply Logo primary, secondary, or accent color to one meaningful pre-dot segment or letter detail inside "${label}".`,
        `- ${tld} may also be accented, but it must not be the only colored text element for this treatment.`,
        '- Keep the split based on meaning, rhythm, or typographic structure; avoid random individual letters.',
      ].join('\n');
    case 'gradient-wordmark-controlled':
      return [
        ...shared,
        `- Apply the controlled color transition to "${label}" or one meaningful pre-dot chunk of it, not merely to the icon or TLD.`,
        '- Use a restrained two-hue or tonal gradient with one consistent direction; avoid rainbow ramps and low-contrast pastel text.',
        `- ${tld} can be solid ink or a compact accent so the suffix remains crisp.`,
      ].join('\n');
    case 'brand-color-wordmark':
      return [
        ...shared,
        `- Set "${label}" in Logo primary brand color or a strong chromatic ink, not default black.`,
        '- If a secondary text color is used, place it on a meaningful pre-dot chunk or letter detail before using it on the TLD.',
        `- ${tld} can echo the accent, but the brand label should still carry the main brand color.`,
      ].join('\n');
    case 'accented-tld-dot':
      return [
        ...shared,
        `- Use this restrained treatment only when "${tld}" is the intended text accent.`,
        `- Set "${label}" in a chromatic high-contrast ink and set the dot/TLD in Logo accent/TLD/dot color.`,
        '- Do not add other competing bright chunks.',
      ].join('\n');
    case 'one-color-classic':
      return [
        ...shared,
        `- Set "${label}" and "${tld}" in one deliberate foreground color.`,
        '- The single color should be an intentional brand decision, not a default fallback.',
      ].join('\n');
    default:
      return [
        ...shared,
        `- If color appears in text, prefer meaningful pre-dot chunks or crafted letter details before defaulting to only coloring "${tld}".`,
        '- Avoid making the entire pre-dot label one dark color plus a colored TLD unless the resolved treatment specifically calls for that restrained hierarchy.',
      ].join('\n');
  }
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
      '- Define distinct foreground roles: logo neutral/ink, logo primary brand color, logo secondary brand color, and logo accent/TLD/dot color.',
      '- Treat logo neutral/ink as a designed palette-derived ink color for text, not default black; use pure black only when the logo color treatment deliberately calls for it.',
      '- The foreground logo should carry intentional brand color unless the resolved logo color treatment is one-color-classic.',
      '- Do not rely on the background as the only colorful element of the identity.',
      '- Interpret all palette entries as flat vector colors, not material, lighting, metallic, glossy, chrome, bevel, embossed, or 3D effects.',
      '- Choose a soft, subtle, colorful gradient canvas that supports the logo colors.',
      '- Prefer medium-low background saturation: softened, muted, or dusted color classes are usually better than intense edge-to-edge saturated fields, but the background should not become washed out or nearly white.',
      '- Preserve contrast with a clean focal zone behind the logo rather than by washing out the whole canvas.',
      '- Keep the clean focal zone only as large as the logo footprint plus breathing room; surrounding areas should carry clear palette color.',
      '- The clean focal zone can be lighter, but it should still be lightly tinted by the palette rather than neutral white, gray, or cream.',
      '- If the wordmark is dark or near-black, the background can carry more visible palette color because contrast is already strong.',
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
    '- Treat Logo neutral/ink as a designed palette-derived ink color for text, not default black; use pure black only when the logo color treatment deliberately calls for it.',
    '- Apply Logo neutral/ink, Logo primary brand color, Logo secondary brand color, and Logo accent/TLD/dot color as distinct foreground roles according to the resolved logo color treatment.',
    '- The foreground logo should carry intentional brand color unless the resolved logo color treatment is one-color-classic.',
    '- Do not rely on the background as the only colorful element of the identity.',
    '- Interpret all palette entries as flat vector colors, not material, lighting, metallic, glossy, chrome, bevel, embossed, or 3D effects.',
    '- Use the Background base and Background gradient accents as a soft, subtle, colorful gradient canvas.',
    '- Prefer medium-low background saturation: softened, muted, or dusted color classes are usually better than intense edge-to-edge saturated fields, but the background should not become washed out or nearly white.',
    '- Preserve contrast with a clean focal zone behind the logo rather than by washing out the whole canvas.',
    '- Keep the clean focal zone only as large as the logo footprint plus breathing room; surrounding areas should carry clear palette color.',
    '- The clean focal zone can be lighter, but it should still be lightly tinted by the palette rather than neutral white, gray, or cream.',
    '- If the wordmark is dark or near-black, the background can carry more visible palette color because contrast is already strong.',
    '- Use 2-3 softly blended background stops plus an optional gentle accent, chosen freely from the logo palette, brand personality, domain meaning, and selected style.',
    '- The background accents should visibly echo, complement, or harmonize with the wordmark, mark, dot, or TLD colors instead of feeling unrelated.',
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

function buildLogoColorTreatmentInstructions(
  logoColorTreatment: keyof typeof LOGO_COLOR_TREATMENTS | undefined,
) {
  if (!logoColorTreatment) {
    return [
      'Logo color treatment:',
      '- Choose a professional foreground color treatment that fits the brand and logo type.',
      '- The domain wordmark should have intentional color: use a chromatic dark ink, brand color, TLD/dot accent, split accent, or controlled text gradient unless a one-color logo is clearly intentional.',
      '- Do not default the domain wordmark to plain black.',
      '- The foreground logo should carry brand color unless a one-color logo is clearly intentional.',
      '- Avoid accidental monochrome: do not make mark, wordmark, dot, and TLD all the same color by default.',
      '- Avoid defaulting to one dark pre-dot wordmark plus one colored TLD; use richer pre-dot color logic when the brand label supports it.',
    ].join('\n');
  }

  const shared = [
    `- Resolved treatment: ${logoColorTreatment} (${LOGO_COLOR_TREATMENTS[logoColorTreatment]}).`,
    '- Apply this treatment to the foreground logo itself, not the background.',
    '- Maintain strong contrast and exact text legibility.',
    '- Do not default the domain wordmark to plain black; use palette-derived chromatic ink or brand color unless the treatment intentionally selects a stark one-color logo.',
    '- Prefer meaningful pre-dot wordmark color structure over TLD-only color unless the resolved treatment is accented-tld-dot.',
    '- Use controlled brand color roles; avoid arbitrary rainbow coloring.',
  ];

  switch (logoColorTreatment) {
    case 'one-color-classic':
      return [
        'Logo color treatment:',
        ...shared,
        '- Use one intentional solid foreground logo color for mark, wordmark, dot, and TLD.',
        '- This should feel like a deliberate primary one-color logo, not a default or unfinished version.',
      ].join('\n');
    case 'neutral-wordmark-color-mark':
      return [
        'Logo color treatment:',
        ...shared,
        '- Set the wordmark in Logo neutral/ink as a designed chromatic ink, not default black.',
        '- Make the mark/symbol visibly carry Logo primary brand color, with optional secondary/accent detail.',
        '- Do not reduce the mark to the same color as the wordmark.',
      ].join('\n');
    case 'brand-color-wordmark':
      return [
        'Logo color treatment:',
        ...shared,
        '- Set the domain wordmark itself in Logo primary brand color or a dark chromatic Logo neutral/ink.',
        '- Use Logo accent/TLD/dot color for the dot, TLD, or one precise typographic detail when it improves recognition.',
        '- If there is a mark, keep it supportive; the colored domain text should remain the main identity signal.',
      ].join('\n');
    case 'duotone-mark':
      return [
        'Logo color treatment:',
        ...shared,
        '- Set the wordmark in Logo neutral/ink as a designed chromatic ink, not default black.',
        '- Render the mark/monogram with Logo primary brand color plus Logo secondary brand color.',
        '- Keep the two mark colors distinct enough to read at thumbnail size.',
      ].join('\n');
    case 'accented-tld-dot':
      return [
        'Logo color treatment:',
        ...shared,
        '- Set the main wordmark in Logo neutral/ink as a designed chromatic ink, not default black.',
        '- Make the dot and/or TLD use Logo accent/TLD/dot color as a clear deliberate accent.',
        '- The accent must be visible, not merely a tiny nearly-matching shade.',
      ].join('\n');
    case 'split-wordmark-accent':
      return [
        'Logo color treatment:',
        ...shared,
        '- Set most of the wordmark in Logo neutral/ink as a designed chromatic ink, not default black.',
        '- Apply Logo primary or accent color to a meaningful pre-dot word segment or letter detail; the dot/TLD can echo it but cannot be the only colored text element.',
        '- The split must feel designed and restrained, not randomly colored letters.',
      ].join('\n');
    case 'semantic-word-split':
      return [
        'Logo color treatment:',
        ...shared,
        '- Use color to separate meaningful pre-dot word units or morphemes in the brand label.',
        '- Use harmonized Logo neutral/ink, Logo primary, and/or Logo secondary colors with clear hierarchy; avoid equal-intensity rainbow chunks.',
        '- The dot/TLD may be a small accent, but the main text diversity must happen before the dot.',
      ].join('\n');
    case 'tonal-wordmark-pair':
      return [
        'Logo color treatment:',
        ...shared,
        '- Use two related dark/chromatic ink colors across meaningful pre-dot wordmark chunks.',
        '- Keep the pair analogous, tonal, or close in value so it feels mature, premium, and cohesive.',
        '- The dot/TLD can be quieter or accented, but the two-ink structure must be visible in the brand label.',
      ].join('\n');
    case 'letterform-accent-system':
      return [
        'Logo color treatment:',
        ...shared,
        '- Keep the wordmark readable in strong chromatic ink while applying brand color to selected pre-dot letterform details.',
        '- Color selected strokes, counters, crossbars, dots, swashes, ligatures, or custom cuts inside the brand label.',
        '- Use only a few deliberate details; do not scatter colored letters randomly.',
      ].join('\n');
    case 'gradient-wordmark-controlled':
      return [
        'Logo color treatment:',
        ...shared,
        '- Apply a subtle Logo primary-to-secondary or primary-to-accent color transition to the pre-dot domain wordmark itself or one meaningful pre-dot chunk.',
        '- Preserve exact domain spelling and crisp readability; the gradient should be controlled and typographic, not noisy or rainbow-like.',
        '- Keep the dot and TLD highly legible, either in the same controlled gradient family or in a solid accent/ink color.',
      ].join('\n');
    case 'gradient-mark-solid-wordmark':
      return [
        'Logo color treatment:',
        ...shared,
        '- Set the wordmark in a solid Logo neutral/ink color as designed chromatic ink, not default black.',
        '- Render the mark with a controlled Logo primary-to-secondary or primary-to-accent gradient.',
        '- Keep any gradient out of small text unless it remains sharply legible.',
      ].join('\n');
    case 'multicolor-symbol-neutral-wordmark':
      return [
        'Logo color treatment:',
        ...shared,
        '- Set the wordmark in Logo neutral/ink as a designed chromatic ink, not default black.',
        '- Let the symbol carry 2-3 controlled brand colors from primary, secondary, and accent roles.',
        '- Keep the symbol color distribution simple and logo-like, not illustrative clutter.',
      ].join('\n');
    case 'badge-fill-reverse':
      return [
        'Logo color treatment:',
        ...shared,
        '- Use a colored badge, filled mark, or compact container as part of the foreground logo.',
        '- Use reversed/high-contrast text or symbol treatment only inside that filled element.',
        '- Keep the badge/container simple and scalable; it must not become a mockup or background panel.',
      ].join('\n');
    case 'mascot-palette':
      return [
        'Logo color treatment:',
        ...shared,
        '- Apply multiple controlled brand colors to the mascot, character, or concrete object.',
        '- Keep the wordmark restrained and readable in Logo neutral/ink as a designed chromatic ink or one brand accent.',
        '- Mascot/object color should be simplified like a logo, not a detailed illustration.',
      ].join('\n');
    default:
      return ['Logo color treatment:', ...shared].join('\n');
  }
}

function buildBackgroundTreatmentInstructions(
  backgroundTreatment: keyof typeof LOGO_BACKGROUND_TREATMENTS | undefined,
) {
  if (!backgroundTreatment) {
    return [
      'Background treatment:',
      '- Choose one gradient composition that fits the brand and palette.',
      '- Vary placement, direction, and color balance; do not use a generic pale corner wash.',
      '- Treat the background as gradient color placement only; do not add separate rings, paths, symbols, or decorative background graphics.',
    ].join('\n');
  }

  return [
    'Background treatment:',
    `- Resolved treatment: ${backgroundTreatment} (${LOGO_BACKGROUND_TREATMENTS[backgroundTreatment]}).`,
    '- Use this treatment to control the gradient layout, direction, and color placement; place the palette colors in specific regions of the canvas.',
    '- The treatment describes gradient color placement only; do not render separate rings, orbit paths, geometric marks, symbols, or decorative background graphics.',
    '- Keep the canvas light-to-mid value overall; one area may be richer or more colorful, but never make the full canvas dark or heavily saturated.',
    '- The background should have a distinct palette identity without competing with the logo.',
    '- Preserve a clean focal area behind the wordmark, dot, TLD, and mark; keep it tight to the logo footprint plus breathing room and let the surrounding field carry more visible color.',
    '- The clean focal area can be lighter, but it should still be palette-tinted rather than neutral white, gray, or cream.',
    '- Do not use the same generic pale corner wash for every domain.',
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
      return `${base} Wordmark is the primary element; focus on typographic craft and intentional foreground color treatment, not a generic font-only rendering.`;
    case 'letter-mark':
      return `${base} Use the first letter or initials from the brand label as a substantial mark, with optional supporting wordmark.`;
    case 'mascot':
      return `${base} If using a mascot, keep it stylized, substantial, and logo-like (not illustrative).`;
    case 'image-icon':
      return `${base} Pair a substantial recognizable object, product, tool, or concrete symbol with the wordmark for balance.`;
    case 'abstract-icon':
      return `${base} Use a substantial refined non-literal geometric or metaphorical mark paired with the wordmark.`;
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
  logoColorTreatment,
  backgroundTreatment,
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
${buildLogoColorTreatmentInstructions(logoColorTreatment)}
${buildWordmarkColorMapInstructions(logoColorTreatment, domainInfo)}
${buildBackgroundTreatmentInstructions(backgroundTreatment)}

Logo craftsmanship:
- Prioritize a logo feel: clean vector-like shapes, strong geometry, and clear negative space.
- Avoid illustrative scenes, photorealism, heavy texture, material rendering, metallic/chrome finishes, bevels, embossed depth, shadows that create dimensionality, or 3D effects.
- Typography should feel bespoke and cohesive with the selected style (${style}); avoid generic or repetitive fonts.
- Professional kerning and optical alignment are essential.

Ensure the design is professional, scalable, and works well in various contexts.

Background styling:
- Use the color plan's colorful but low-detail gradient canvas behind the logo.
- Use 2-3 softly blended background stops plus an optional gentle accent.
- Prefer medium-low background saturation: softened, muted, or dusted color classes are usually better than intense edge-to-edge saturated fields, but the background should not become washed out or nearly white.
- Make the background feel polished, playful, and intentionally colorful, but quieter than the logo.
- Make the gradient clearly but quietly multi-color at thumbnail size while preserving a clean focal area for the logo.
- Place the background colors according to the resolved background treatment so the layout has a distinct visual identity.
- Do not add separate background rings, paths, symbols, frames, shapes, or decorative graphics; background treatment is gradient placement only.
- Preserve contrast with local placement and a clean focal zone, not by making the entire background near-white.
- Keep the clean focal zone tight to the logo footprint plus breathing room; surrounding areas should carry clear palette color.
- The focal zone can be lighter, but it should still be palette-tinted rather than neutral white, gray, or cream.
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
- Background: colorful but low-detail gradient canvas from the color plan, visually complementary and non-distracting, with barely visible fine grain and strong logo contrast.
- No watermarks or additional decorative elements beyond the simple background.
- Center the logo with balanced padding; leave adequate breathing room around it.
- If the logo includes the brand name text, render it cleanly; otherwise, render only the mark.
- Return exactly one image as output.`
    : ''
}`;
};

export const logoGenerationSystemPrompt =
  'You are an AI assistant that generates professional logo designs. Focus on clean, logo-like marks and accurate typography. Use the image_generation tool to create a logo based on the given prompt.';
