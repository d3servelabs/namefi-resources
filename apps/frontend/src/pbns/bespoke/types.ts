export interface BespokeTestimonial {
  quote: string;
  author: string;
  handle?: string;
  avatar?: string;
  rating?: number;
}

export interface BespokeFeature {
  title: string;
  description: string;
  icon?: string;
  gradient?: string;
}

export interface BespokeShowcase {
  name: string;
  domain: string;
  description: string;
  image?: string;
  tags?: string[];
  link?: string;
}

export interface BespokeStatistic {
  value: string;
  label: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface BespokeLandingConfig {
  /** The domain name (e.g., "starts.today", "onsale.now") */
  domainName: string;
  /** Array of rotating example subdomains for the hero */
  rotatingSubdomains: string[];
  /** Testimonials */
  testimonials: BespokeTestimonial[];
  /** Open graph image URL */
  openGraphImage: string;
}
