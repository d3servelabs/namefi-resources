import { Button } from '@react-email/components';
import { getEmailsBaseUrl } from '../consts';
import { button } from '../styles';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';

export function GoToDashboard() {
  return (
    <Button style={button} href={`${getEmailsBaseUrl()}/dashboard/domains`}>
      Go To Your Domains Dashboard
    </Button>
  );
}
