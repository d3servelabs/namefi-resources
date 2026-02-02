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
    textTreatment !== 'let-ai-choose' &&
    LOGO_TEXT_TREATMENTS[textTreatment as keyof typeof LOGO_TEXT_TREATMENTS]
      ?.name;
  const typographyName =
    typography &&
    typography !== 'let-ai-choose' &&
    LOGO_TYPOGRAPHY[typography as keyof typeof LOGO_TYPOGRAPHY]?.name;

  return `Brand Name: ${brandName}
${description ? `Brand Description: ${description}` : ''}
${typeName ? `User's Type Preference: ${typeName}` : ''}
${styleName ? `User's Style Preference: ${styleName}` : ''}
${textTreatmentName ? `User's Text Treatment Preference: ${textTreatmentName}` : ''}
${typographyName ? `User's Typography Preference: ${typographyName}` : ''}

Analyze this brand and create ONE compelling logo concept that best captures its essence.
If any user preferences are provided, respect them while choosing the optimal concept.

Please provide:
1. Brand analysis - key attributes, values, and personality
2. Target audience and market positioning
3. Recommended visual themes and mood
4. Suggested color palette with emotional associations
5. ONE optimal logo concept that best represents the brand
6. A text treatment choice that best supports the wordmark lockup
7. A typography choice that best fits the brand personality

For the logo concept, create a prompt that:
- Opens with the overall style/mood (e.g., "Create a sleek and modern logo", "Design a playful and vibrant logo")
- Names the brand and provides context
- Suggests thematic elements and motifs (without being overly specific about arrangement)
- Recommends a color direction that supports the brand values
- Describes the feelings/impressions it should evoke
- Mentions practical applications (signage, packaging, digital, etc.)

Structure your prompt like this:
"[Style descriptor] logo for [brand type] named [Brand Name], [thematic elements], [color suggestions]. The logo should [emotions/values to convey], [suitable for applications]."

Examples of well-crafted prompts:
- "Create a dynamic and energetic logo for a fitness brand called PowerFit, incorporating bold typography and vibrant colors. The logo should convey strength and vitality, ideal for gym apparel and signage."
- "Design a warm and inviting logo for a bakery called Sweet Haven, featuring soft pastels and cozy imagery. The logo should evoke comfort and homemade quality, perfect for storefront and packaging."
- "Generate a futuristic and professional logo for a tech consultancy named DataVision, using sleek lines and a modern color palette. The logo should reflect innovation and expertise, suitable for digital platforms and business cards."

Remember: Focus on creating THE BEST single logo concept that truly captures the brand's essence, taking into account any user preferences while prioritizing what serves the brand best.`;
};
