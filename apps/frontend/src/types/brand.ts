export interface Generation {
  id: string;
  brandId: string;
  type: 'logo' | 'marketing';
  prompt: string;
  result: string;
  generationCallId: string | undefined;
  createdAt: string;
  metadata?: {
    style?: string;
    colors?: string[];
    dimensions?: {
      width: number;
      height: number;
    };
    [key: string]: any;
  };
}

export interface Brand {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
  generations: Generation[];
}

export interface StorageData {
  brands: Brand[];
  version: string;
}
