import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { BookIcon } from 'lucide-react';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex gap-2 items-center ">
          <img src="/logotype.svg" alt="logo" className="h-8" />
        </div>
      ),
    },
    links: [
      {
        icon: <BookIcon />,
        text: 'Openapi detailed docs',
        description: 'Openapi docs with browser client',
        url: 'https://backend.astra.namefi.dev/v-next/openapi/doc',
        // secondary items will be displayed differently on navbar
        secondary: false,
      },
    ],
    themeSwitch: { enabled: false },
  };
}
