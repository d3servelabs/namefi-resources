export interface Brand {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
  generations: Generation[];
}

export interface Generation {
  id: string;
  brandId: string;
  type: 'logo' | 'marketing';
  prompt: string;
  result: string;
  generationCallId?: string;
  metadata?: {
    logoType?: string;
    logoStyle?: string;
    basedOnLogoId?: string;
  };
  createdAt: string;
}
