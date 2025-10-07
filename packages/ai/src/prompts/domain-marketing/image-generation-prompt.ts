export interface ImageGenerationParams {
  basePrompt: string;
  domain: string;
  buyerAppeal: string;
  style: string;
  withLogo?: boolean;
}

export const enhanceImagePrompt = ({
  basePrompt,
  domain,
  buyerAppeal,
  style,
  withLogo = false,
}: ImageGenerationParams) => `${basePrompt}

Context: This is a marketing image for the domain "${domain}".
Target Buyer: ${buyerAppeal}
Visual Style: ${style}

${
  withLogo
    ? `IMPORTANT - LOGO INTEGRATION: Use the referenced logo and create a realistic billboard or advertising display that prominently features:
- The domain name "${domain}" 
- The referenced logo
- Professional billboard/advertising aesthetic
- Realistic lighting and environment
- The billboard should be placed in a relevant context (city street, highway, business district) that appeals to ${buyerAppeal}`
    : `The image should specifically convey why THIS domain "${domain}" is valuable to ${buyerAppeal}.
Focus on visual metaphors and imagery that relate to the domain's unique qualities.`
}

IMPORTANT: 
- Visual storytelling that connects to this specific domain
- Modern, professional quality suitable for domain marketplaces
- Should feel unique to this domain, not generic${
  withLogo
    ? `
- The billboard must look realistic and professionally designed
- Include both the logo and domain name prominently`
    : ''
}`;

export const posterGenerationSystemPrompt =
  'You are an AI assistant that generates images. Use the image_generation tool to create an image based on the given prompt.';
