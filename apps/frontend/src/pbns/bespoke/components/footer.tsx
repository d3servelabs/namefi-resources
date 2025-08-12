import { Button } from '@/components/ui/shadcn/button';
import { Trophy } from 'lucide-react';
import Link from 'next/link';
import type { BespokeLandingConfig } from '../types';

interface FooterProps {
  config: BespokeLandingConfig;
}

export const Footer = ({ config }: FooterProps) => {
  const huntUrl = `/hunt/domains/${config.domainName}`;

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-cyan-900 to-emerald-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.3),transparent_70%)]" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-white">
          Help Launch
          <br />
          <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            {config.domainName}
          </span>
        </h2>
        <p className="text-2xl mb-12 text-cyan-100 font-normal leading-relaxed">
          Support the project and help us reach more{' '}
          {config.domainName.split('.')[0]}s worldwide
        </p>

        <div className="flex justify-center">
          <Link href={huntUrl} target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold text-xl px-12 py-5 rounded-2xl shadow-2xl shadow-cyan-500/25 tracking-tight"
            >
              <Trophy className="w-6 h-6 mr-3" />
              Upvote on NamefiHunt
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
