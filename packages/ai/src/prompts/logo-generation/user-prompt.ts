import {
  LOGO_STYLES,
  LOGO_TEXT_TREATMENTS,
  LOGO_TYPES,
  LOGO_TYPOGRAPHY,
  type LogoStyleInput,
  type LogoTextTreatmentInput,
  type LogoTypographyInput,
  type LogoTypeInput,
} from '../../types/logo-options';

export interface LogoAnalysisParams {
  brandName: string;
  description?: string;
  logoType?: LogoTypeInput;
  logoStyle?: LogoStyleInput;
  textTreatment?: LogoTextTreatmentInput;
  typography?: LogoTypographyInput;
}

export const logoAnalysisUserPrompt = ({
  brandName,
  description,
  logoType,
  logoStyle,
  textTreatment,
  typography,
}: LogoAnalysisParams) => {
  const typeName =
    logoType && LOGO_TYPES[logoType as keyof typeof LOGO_TYPES]?.name;
  const styleName =
    logoStyle && LOGO_STYLES[logoStyle as keyof typeof LOGO_STYLES]?.name;
  const textTreatmentName =
    textTreatment &&
    LOGO_TEXT_TREATMENTS[textTreatment as keyof typeof LOGO_TEXT_TREATMENTS]
      ?.name;
  const typographyName =
    typography &&
    LOGO_TYPOGRAPHY[typography as keyof typeof LOGO_TYPOGRAPHY]?.name;
  const describeSelection = (
    value: string | undefined,
    name: string | undefined,
  ) =>
    name
      ? `${name}${value === 'let-ai-choose' ? ' (delegated)' : ''}`
      : undefined;

  return `Brand Name: ${brandName}
${description ? `Brand Description: ${description}` : ''}
${describeSelection(logoType, typeName) ? `User's Type Selection: ${describeSelection(logoType, typeName)}` : ''}
${describeSelection(logoStyle, styleName) ? `User's Style Selection: ${describeSelection(logoStyle, styleName)}` : ''}
${describeSelection(textTreatment, textTreatmentName) ? `User's Text Treatment Selection: ${describeSelection(textTreatment, textTreatmentName)}` : ''}
${describeSelection(typography, typographyName) ? `User's Typography Selection: ${describeSelection(typography, typographyName)}` : ''}

Create ONE complete logo strategy for the domain.

Selection rules:
- If a user selection is a concrete option, respect it.
- If a user selection is "Let AI Choose (delegated)", choose exactly one resolved option from the finite list supplied in the system instructions.
- Do not default to any repeated safe visual pattern; make delegated choices intentional and brand-specific.
- For delegated choices, consider all available options and pick the most distinctive fit for the domain, description, audience, and desired brand signal.
- Prefer a memorable, differentiated direction over a generic modern SaaS identity.

Logo type classification rules for delegated choices:
- Use wordmark when custom typography is the main brand asset and an icon would be decorative or redundant.
- Use letter-mark when the brand label is short, acronym-like, initial-driven, or the strongest mark idea is built from letters/initials. Do not label a monogram or initial-based mark as abstract-icon.
- Use image-icon when a recognizable object, tool, product, place, ingredient, or concrete symbol from the domain is the strongest memory cue.
- Use mascot when a character, helper, companion, bot, or personality-led figure is the strongest memory cue.
- Use abstract-icon only when the best mark is genuinely non-literal geometry or metaphorical form, not a concrete object, mascot, or monogram.

Domain and TLD rules:
- Preserve the exact domain spelling, dots, hyphens, numbers, and TLD.
- The dot before the TLD is mandatory whenever the TLD appears.
- Never render a naked TLD like "ai", "com", "io", or "app" when the intended text is ".ai", ".com", ".io", or ".app".
- Never replace the real TLD with another TLD.
- Never add spaces around the dot.
- If rendering the full domain, render it exactly once.
- If using tld-subtle, the dot and TLD must remain visible and legible, just quieter.
- If using tld-highlight, the dot and/or TLD must become a deliberate accent.
- If using stacked-domain, the second line must include the leading dot, such as ".ai", not "ai".
- No slogans, no taglines, no fake microtext, no extra words.

Domain interpretation:
- Use the domain and description as brand signals.
- If no description is provided, infer only lightly from the domain tokens.
- Do not invent company facts, geography, awards, certifications, customers, or product claims.

Color and background strategy:
- Provide a high-contrast palette with clear roles.
- The palette must include 4 entries in this format:
  "Background base: color name or hex - purpose"
  "Background gradient accents: 2-3 color names or hexes - purpose"
  "Primary text/wordmark: color name or hex - purpose"
  "Main mark/accent/TLD: color name or hex - purpose"
- Choose the background from the palette, not from the style label.
- The background should be a soft, subtle, colorful gradient canvas that supports the logo colors.
- Prefer medium-low background saturation: softened, muted, or dusted color classes are usually better than intense edge-to-edge saturated fields, but the background should not become washed out or nearly white.
- Use 2-3 softly blended background stops plus an optional gentle accent, chosen freely for the brand rather than from a fixed recipe.
- Make the background feel polished, playful, and intentionally colorful, but quieter than the logo.
- Tie the background colors to the logo palette, brand personality, domain meaning, and selected style so the image feels designed as one system.
- Vary hue and luminance enough to show clear but quiet color movement while keeping the background atmospheric and low-contrast.
- The background gradient must stay low-detail and behind the logo.
- Add a barely visible fine grain/noise layer to soften the gradient and reduce banding; it must not read as heavy texture, speckles, dust, paper, or a pattern.
- The background must never compete with the mark, wordmark, dot, or TLD.
- Ensure strong contrast between the primary text/wordmark and background, the main mark/accent and background, and the TLD/dot treatment and background.
- Keep a clear contrast zone behind the wordmark, mark, dot, and TLD so the logo remains the focal point.
- Place the most visually active background regions away from fine text or small TLD details when needed.
- Do not let background color relationships make the logo blend into the canvas.

Typography strategy:
- Choose a typography option that creates visual distinction, not just readability.
- Describe custom creative lettering: weight, contrast, rhythm, shape, spacing, and personality.
- If script is chosen, readability and exact spelling still win.
- If monospace is chosen, make it feel intentional and brand-specific, not generic code text.

Create one logo strategy:
1. brandAttributes: 3-6 concise brand attributes.
2. targetAudience: likely audience and market position.
3. visualIdentity: form, style, typography, color, contrast, and background logic.
4. colorPalette: role-based palette as specified above.
5. logoConcept:
   - type: resolved finite option ID.
   - style: resolved finite option ID.
   - textTreatment: resolved finite option ID.
   - typography: resolved finite option ID.
   - concept: concise explanation of why this direction fits.
   - prompt: final image-generation prompt for gpt-image-2.

The final image-generation prompt must be structured in this order:

Visible text:
- Exact text to render.
- Explicitly state that the dot before the TLD is mandatory whenever the TLD appears.
- Spelling and punctuation rules.
- TLD treatment.
- No extra text.

Design direction:
- Logo type.
- Style.
- Creative typography direction.
- One visual metaphor or mark idea.
- Palette roles and contrast.

Background:
- Use a soft, subtle, colorful gradient canvas derived from the palette; it should feel polished, playful, and intentionally designed, but quieter than the logo.
- Name the background base and 2-3 gradient accent colors.
- Keep the gradient low-detail and behind the logo.
- Use 2-3 softly blended stops plus an optional gentle accent; avoid making every stop equally saturated or visually loud.
- Add barely visible fine grain/noise to soften banding, not as a decorative texture.
- Make the gradient clearly but quietly multi-color at thumbnail size, while preserving a clean focal area for the logo.
- Maintain strong contrast with the primary text, mark, dot, and TLD.

Composition:
- Single final logo only.
- Centered, balanced clear space.
- Flat vector-style logo master.
- No mockup environment.

Avoid:
- No variations, no grids, no mockups, no wall signs, no business cards, no merchandise.
- No photorealism, no 3D, no bevel, no chrome, no glossy effects.
- No muddy low-contrast background and no harsh over-saturated background that overpowers the logo.
- No missing TLD dot, no naked TLD, no wrong TLD, no spaces around the dot.
- No watermarks, signatures, slogans, fake tiny text, copied brand references, or trademarked styles.`;
};
