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
- Use wordmark only when custom typography is the main brand asset and an icon would be decorative or redundant. Do not choose wordmark merely because the input is a domain name.
- Use letter-mark when the brand label is short, acronym-like, initial-driven, or the strongest mark idea is built from letters/initials. Do not label a monogram or initial-based mark as abstract-icon.
- Use image-icon when a recognizable object, tool, product, place, ingredient, or concrete symbol from the domain is the strongest memory cue.
- Use mascot when a character, helper, companion, bot, or personality-led figure is the strongest memory cue.
- Use abstract-icon only when the best mark is genuinely non-literal geometry or metaphorical form, not a concrete object, mascot, or monogram.
- When the domain contains a concrete object, material, place, ingredient, tool, character idea, movement, or action, prefer image-icon, mascot, letter-mark, or abstract-icon over a pure wordmark unless typography is clearly the strongest strategy.

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
- The palette must include 6 entries in this format:
  "Logo neutral/ink: color name or hex - purpose"
  "Logo primary brand color: color name or hex - purpose"
  "Logo secondary brand color: color name or hex - purpose"
  "Logo accent/TLD/dot color: color name or hex - purpose"
  "Background base: color name or hex - purpose"
  "Background gradient accents: 2-3 color names or hexes - purpose"
- Choose one resolved logoColorTreatment from the finite logo color treatment IDs supplied in the system instructions.
- Use the logoColorTreatment to decide how foreground logo color is applied to the mark, wordmark, dot, TLD, and any badge/container.
- Generate a finished parked-domain visual lockup by default; do not make the foreground logo monochrome unless logoColorTreatment is one-color-classic.
- Treat Logo neutral/ink as a designed palette-derived ink color for text, such as deep teal, ink blue, aubergine, forest, oxblood, slate-green, or another dark chromatic brand color. Do not equate neutral/ink with default black.
- Use pure black text only when it is deliberately chosen for the brand direction, not as the default legibility solution.
- Build wordmark color from design principles: hierarchy, semantic meaning, color harmony, figure/ground contrast, and limited palette discipline.
- For compound or blended brand labels, consider coloring meaningful pre-dot word units separately instead of only coloring the TLD.
- For premium or serious brands, consider two related dark/chromatic inks across the pre-dot wordmark instead of a loud bright split.
- For typography-led brands, consider colored letterform details, counters, crossbars, dots, ligatures, or controlled type gradients inside the pre-dot brand label.
- The background must not be the only colorful part of the identity unless logoColorTreatment is one-color-classic.
- If logoColorTreatment is not one-color-classic, the foreground logo should use at least two distinct foreground color roles in a controlled way.
- Do not use the same foreground color for the mark, pre-dot wordmark, dot, and TLD unless one-color-classic is selected or contrast absolutely requires it.
- Do not make the TLD/dot the only colored text element when a richer wordmark color system is appropriate for the domain.
- Foreground color variety must remain professional: controlled duotone, accent, gradient mark, badge fill, or mascot/object palette rather than arbitrary rainbow coloring.
- Palette role descriptions must specify flat color use, not rendering effects. Avoid material/lighting words such as metallic, chrome, glossy, dimensional, bevel, embossed, shadow depth, shine, or realistic texture.
- If using silver, gold, copper, pearl, glass, or similar color names, treat them as flat color references only.
- Choose the background from the palette, not from the style label.
- The background should be a soft, subtle, colorful gradient canvas that supports the logo colors.
- Prefer medium-low background saturation: softened, muted, or dusted color classes are usually better than intense edge-to-edge saturated fields, but the background should not become washed out or nearly white.
- Use 2-3 softly blended background stops plus an optional gentle accent, chosen freely for the brand rather than from a fixed recipe.
- Make the background feel polished, playful, and intentionally colorful, but quieter than the logo.
- Choose one resolved backgroundTreatment from the finite background treatment IDs supplied in the system instructions.
- Background treatments are gradient layout strategies only; they must not add extra symbols, rings, orbit paths, decorative lines, or standalone background graphics.
- Use the backgroundTreatment to vary placement, direction, and composition across domains; do not collapse every logo into the same pale corner wash.
- Tie the background colors to the logo palette, brand personality, domain meaning, and selected style so the image feels designed as one system.
- The background accents should visibly echo, complement, or harmonize with the wordmark, mark, dot, or TLD colors instead of feeling unrelated.
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
   - logoColorTreatment: resolved finite option ID.
   - backgroundTreatment: resolved finite option ID.
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
- Resolved logoColorTreatment and how foreground color is applied.
- Wordmark color map: state which pre-dot letters, word units, syllables, strokes, or full-word gradients use Logo neutral/ink, Logo primary, Logo secondary, and Logo accent. Also state how the dot and TLD are colored.
- Palette roles and contrast.
- If logo type is not wordmark, the mark must be a substantial visual asset, not a tiny decoration beside text.
- If logoColorTreatment is not one-color-classic, the foreground logo must carry visible brand color; do not rely on the background as the only colorful element, and do not limit all text color variety to the TLD/dot unless accented-tld-dot is deliberately selected.

Background:
- Use a colorful but low-detail gradient canvas derived from the palette; it should feel polished, playful, and intentionally designed, but quieter than the logo.
- State the resolved backgroundTreatment and describe how it affects the layout of the gradient.
- Treat the backgroundTreatment as gradient color placement only, not as permission to add extra shapes, orbit lines, rings, paths, or decorative background marks.
- Name the background base and 2-3 gradient accent colors, and state where each color appears on the canvas.
- Keep the gradient low-detail and behind the logo.
- Use 2-3 softly blended stops plus an optional gentle accent; avoid making every stop equally saturated or visually loud.
- Add barely visible fine grain/noise to soften banding, not as a decorative texture.
- Make the gradient clearly but quietly multi-color at thumbnail size, while preserving a clean focal area for the logo.
- Preserve contrast with local placement and a clean focal zone, not by making the entire background near-white.
- Keep the clean focal zone tight to the logo footprint plus breathing room; surrounding areas should carry clear palette color.
- The focal zone can be lighter, but it should still be a palette-tinted color field rather than neutral white/gray/cream.
- Avoid making all backgrounds look like the same pale corner wash.
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
