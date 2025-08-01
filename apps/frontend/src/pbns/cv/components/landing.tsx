import {
  Hero,
  WhyCVMatters,
  FamousPeople,
  WhoCanJoin,
  ExampleProfiles,
  Testimonials,
  CTA,
  DomainHuntWidget,
  CVHuntSection,
  type FamousPerson,
  type ExampleProfile,
  type Testimonial,
} from './index';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';

export interface CVLandingConfig {
  /** The name (e.g., "taylor") - will be auto-capitalized for display */
  name: string;
  /** Array of rotating example names to show before the main name */
  rotatingNames: string[];
  /** Background image URL */
  backgroundImage: string;
  /** Array of famous people with that name */
  famousPeople: FamousPerson[];
  /** Array of example profiles */
  exampleProfiles: ExampleProfile[];
  /** Array of testimonials */
  testimonials: Testimonial[];
}

export const CVLanding = ({ config }: { config: CVLandingConfig }) => {
  // Generate derived values
  const displayName =
    config.name.charAt(0).toUpperCase() + config.name.slice(1);
  const domainName = namefiNormalizedDomainSchema.parse(`${config.name}.cv`);
  const huntUrl = `/hunt/domains/${domainName}`;

  return (
    <>
      <Hero
        name={config.name}
        rotatingNames={config.rotatingNames}
        backgroundImage={config.backgroundImage}
        huntUrl={huntUrl}
        domainHuntWidget={<DomainHuntWidget domainName={domainName} />}
      />

      <CVHuntSection name={config.name} />

      <FamousPeople name={displayName} famousPeople={config.famousPeople} />

      <WhoCanJoin name={displayName} />

      <ExampleProfiles exampleProfiles={config.exampleProfiles} />

      <Testimonials name={displayName} testimonials={config.testimonials} />

      <WhyCVMatters />

      <CTA name={config.name} huntUrl={huntUrl} />
    </>
  );
};
