import { Button, Text } from '@react-email/components';
import { Code } from '../components/code';
import { GoToDashboard } from '../components/go-to-dashboard';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { button, paragraph } from '../styles';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import {
  usePoweredByNamefiDomain,
  withPoweredByNamefiDomain,
} from '../components/powered-by-namefi-url-context';
import { NamefiEmailLinks } from '../email-links';

export type RegisteredDomainSuccessfullyProps = {
  domainUnicodeName: string;
};
export const RegisteredDomainSuccessfully = withPoweredByNamefiDomain(
  (props: RegisteredDomainSuccessfullyProps) => {
    const { domainUnicodeName } = props;
    const poweredByNamefiDomain = usePoweredByNamefiDomain();

    return (
      <NamefiEmailContainer
        title={`[Namefi] Domain(${domainUnicodeName}) Registered Successfully`}
      >
        <Text style={paragraph}>Thank you for using Namefi.</Text>

        <Text style={{ ...paragraph, display: 'inline' }}>
          Your newly acquired domain{' '}
        </Text>
        <Code>{domainUnicodeName}</Code>
        <Text style={{ ...paragraph, display: 'inline' }}>
          is ready for you
        </Text>
        <GoToDashboard />
        <Button
          style={button}
          href={NamefiEmailLinks.domainSettings({
            domain: domainUnicodeName,
            poweredByNamefiDomain,
          })}
        >
          Go To Domain({domainUnicodeName}) Settings
        </Button>
      </NamefiEmailContainer>
    );
  },
);

(RegisteredDomainSuccessfully as any).PreviewProps = {
  domainUnicodeName: 'namefi.test',
};

// biome-ignore lint/style/noDefaultExport: required for react-email
export default RegisteredDomainSuccessfully;
