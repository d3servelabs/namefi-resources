import { Button } from '@/components/ui/shadcn/button';
import { Trophy } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';

interface CTAProps {
  /** The name (e.g., "taylor") */
  name: string;
  /** Hunt URL for the vote button */
  huntUrl: string;
}

export const CTA = ({ name, huntUrl }: CTAProps) => {
  const domainName = `${name}.cv`;
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_70%)]" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-white">
          Help Launch
          <br />
          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            {domainName}
          </span>
        </h2>
        <p className="text-2xl mb-12 text-purple-100 font-normal leading-relaxed">
          Support the project and help us reach more {domainName.split('.')[0]}s
          worldwide
        </p>

        <div className="flex justify-center">
          <Link
            href={huntUrl as Route}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold text-xl px-12 py-5 rounded-2xl shadow-2xl shadow-yellow-500/25 tracking-tight"
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
