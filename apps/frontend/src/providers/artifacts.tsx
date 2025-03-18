'use client';

import type { ReactNode } from 'react';

type Props = { children: ReactNode };

export const ArtifactsProvider = ({ children }: Readonly<Props>) => {
  return <>{children}</>;
};
