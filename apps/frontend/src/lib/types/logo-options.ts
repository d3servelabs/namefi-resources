export const LOGO_TYPES = {
  'let-ai-choose': {
    id: 'let-ai-choose',
    name: 'Let AI Choose',
    description: 'Smart logo picks made just for you',
    image:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop',
  },
  'image-icon': {
    id: 'image-icon',
    name: 'Image Icon',
    description: 'A symbol of something real',
    image:
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop',
  },
  'abstract-icon': {
    id: 'abstract-icon',
    name: 'Abstract Icon',
    description: 'Unique shapes, rich with meaning',
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop',
  },
  wordmark: {
    id: 'wordmark',
    name: 'Wordmark',
    description: 'No icon. Just your name in type.',
    image:
      'https://images.unsplash.com/photo-1562577309-d67db487e6cd?w=400&h=400&fit=crop',
  },
  'letter-mark': {
    id: 'letter-mark',
    name: 'Letter Mark',
    description: 'Your first letter, turned into a logo',
    image:
      'https://images.unsplash.com/photo-1516383607781-913a19294fd1?w=400&h=400&fit=crop',
  },
  mascot: {
    id: 'mascot',
    name: 'Mascot',
    description: 'A character or figure that represents your brand',
    image:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=400&fit=crop',
  },
} as const;

export const LOGO_STYLES = {
  'let-ai-choose': {
    id: 'let-ai-choose',
    name: 'Let AI Choose',
    description: 'Best style for your brand',
    image:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop',
  },
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless and traditional',
    image:
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop',
  },
  innovative: {
    id: 'innovative',
    name: 'Innovative',
    description: 'Modern and forward-thinking',
    image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop',
  },
  bold: {
    id: 'bold',
    name: 'Bold',
    description: 'Strong and impactful',
    image:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=400&fit=crop',
  },
  luxury: {
    id: 'luxury',
    name: 'Luxury',
    description: 'Elegant and premium',
    image:
      'https://images.unsplash.com/photo-1608228088998-57828365d486?w=400&h=400&fit=crop',
  },
  'warm-inviting': {
    id: 'warm-inviting',
    name: 'Warm & Inviting',
    description: 'Friendly and approachable',
    image:
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop',
  },
  'fun-playful': {
    id: 'fun-playful',
    name: 'Fun & Playful',
    description: 'Energetic and cheerful',
    image:
      'https://images.unsplash.com/photo-1535572290543-960a8046f5af?w=400&h=400&fit=crop',
  },
  retro: {
    id: 'retro',
    name: 'Retro',
    description: 'Vintage-inspired design',
    image:
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=400&fit=crop',
  },
  confidence: {
    id: 'confidence',
    name: 'Confidence',
    description: 'Professional and assured',
    image:
      'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=400&h=400&fit=crop',
  },
  joy: {
    id: 'joy',
    name: 'Joy',
    description: 'Happy and uplifting',
    image:
      'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=400&h=400&fit=crop',
  },
  peace: {
    id: 'peace',
    name: 'Peace',
    description: 'Calm and serene',
    image:
      'https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=400&fit=crop',
  },
  purity: {
    id: 'purity',
    name: 'Purity',
    description: 'Clean and minimal',
    image:
      'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=400&fit=crop',
  },
  trust: {
    id: 'trust',
    name: 'Trust',
    description: 'Reliable and secure',
    image:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop',
  },
} as const;

export type LogoType = keyof typeof LOGO_TYPES;
export type LogoStyle = keyof typeof LOGO_STYLES;
