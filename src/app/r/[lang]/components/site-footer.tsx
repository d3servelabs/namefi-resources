import { cacheLife } from 'next/cache';
import Image from 'next/image';
export async function SiteFooter() {
  'use cache';
  cacheLife('days');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-background/80">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12 md:px-10 lg:px-12">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <Image
            src="/logotype.svg"
            alt="Namefi"
            width={132}
            height={43}
            className="h-7 w-auto"
          />
          <p className="text-sm text-muted-foreground">
            © {currentYear} D3SERVE LABS, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
