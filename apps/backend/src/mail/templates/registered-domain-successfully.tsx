import { Button, Text } from '@react-email/components';
import { defaultTo, isEmpty } from 'ramda';
import { Code } from '../components/code';
import { GoToDashboard } from '../components/go-to-dashboard';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { getEmailsBaseUrl } from '../consts';
import { button, paragraph } from '../styles';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';

export type RegisterdDomainSuccessfullyProps = {
  domainUnicodeName: string;
};
const defaults: RegisterdDomainSuccessfullyProps = {
  domainUnicodeName: 'namefi.test',
};

export const RegisterdDomainSuccessfully = (
  props: RegisterdDomainSuccessfullyProps,
) => {
  const { domainUnicodeName } = defaultTo(
    defaults,
    isEmpty(props) ? null : props,
  );
  return (
    <NamefiEmailContainer
      title={`[Namefi] Domain(${domainUnicodeName}) Registered Successfully`}
    >
      <Text style={paragraph}>Thank you for using Namefi.</Text>

      <Text style={{ ...paragraph, display: 'inline' }}>
        Your newly accquired domain{' '}
      </Text>
      <Code>{domainUnicodeName}</Code>
      <Text style={{ ...paragraph, display: 'inline' }}>is ready for you</Text>
      <GoToDashboard />
      <Button
        style={button}
        href={`${getEmailsBaseUrl()}/dashboard/domains/${encodeURIComponent(domainUnicodeName)}`}
      >
        Go To Domain({domainUnicodeName}) Settings
      </Button>
    </NamefiEmailContainer>
  );
};

// biome-ignore lint/style/noDefaultExport: required for react-email
export default RegisterdDomainSuccessfully;
