import { Button } from '@react-email/components';
import { button } from '../styles';
import { usePoweredByNamefiDomain } from './powered-by-namefi-url-context';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailLinks } from '../email-links';

export function GoToDashboard() {
  const poweredByNamefiDomain = usePoweredByNamefiDomain();
  return (
    <Button
      style={button}
      href={NamefiEmailLinks.dashboard({ poweredByNamefiDomain })}
    >
      Go To Your Domains Dashboard
    </Button>
  );
}
