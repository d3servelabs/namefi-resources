import { Card, CardDescription, CardTitle } from '@/components/ui/shadcn/card';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { GlowingEffect } from '@/components/ui/aceternity/glowing-effect';

export interface FamousPerson {
  name: string;
  title: string;
  achievement: string;
  externalUrl: string;
  image: string;
}

interface FamousPeopleProps {
  /** The name being featured (e.g., "Taylor") */
  name: string;
  /** Array of famous people with that name */
  famousPeople: FamousPerson[];
}

const PersonCard = ({ person }: { person: FamousPerson }) => {
  return (
    <Card className="relative bg-slate-900/80 border-slate-700/60 shadow-xl rounded-2xl p-2">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
      />

      <div className="relative aspect-square w-full h-full rounded-lg overflow-hidden">
        <Image
          src={person.image}
          alt={`${person.name} - ${person.title}`}
          fill
          className="object-cover object-top w-full h-full"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

        {/* Name and title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <div className="space-y-1">
            <CardTitle className="text-xl md:text-2xl text-white font-bold leading-tight drop-shadow-lg">
              {person.externalUrl ? (
                <a
                  href={person.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline inline-flex items-center gap-1.5 transition-colors hover:text-blue-200"
                >
                  {person.name}
                  <ExternalLink className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </a>
              ) : (
                person.name
              )}
            </CardTitle>
            <CardDescription className="text-slate-200 font-medium text-base leading-relaxed">
              {person.title}
            </CardDescription>
            <div className="pt-0.5">
              <span className="inline-block bg-white/10 backdrop-blur-sm text-white font-semibold text-xs px-2.5 py-0.5 rounded-full border border-white/30">
                {person.achievement}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const FamousPeople = ({ name, famousPeople }: FamousPeopleProps) => {
  return (
    <section id="famous-people" className="py-24 px-4 relative">
      <div className="absolute inset-0 bg-slate-950" />
      <div className="max-w-7xl mx-auto relative z-10">
        <h2 className="text-5xl md:text-6xl font-extrabold mb-4 text-center tracking-tight">
          Join the Legacy of{' '}
          <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
            Influential {name}'s
          </span>
        </h2>
        <p className="text-xl md:text-2xl text-slate-300 mb-20 text-center max-w-3xl mx-auto font-medium">
          Throughout history, {name}s have made their mark. Now it's time to
          secure yours.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 max-w-6xl mx-auto">
          {/* First row: 3 cards, each taking 2 columns */}
          <div className="md:col-span-2">
            <PersonCard person={famousPeople[0]} />
          </div>
          <div className="md:col-span-2">
            <PersonCard person={famousPeople[1]} />
          </div>
          <div className="md:col-span-2">
            <PersonCard person={famousPeople[2]} />
          </div>

          {/* Second row: 2 cards, each taking 2 columns with 1 column gap on each side */}
          {famousPeople.length > 3 && (
            <>
              <div className="md:col-span-1" />
              <div className="md:col-span-2">
                <PersonCard person={famousPeople[3]} />
              </div>
              <div className="md:col-span-2">
                <PersonCard person={famousPeople[4]} />
              </div>
              <div className="md:col-span-1" />
            </>
          )}
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-16 pt-8 border-t border-slate-800/50">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs leading-relaxed text-slate-500 font-light tracking-wide">
              <strong className="font-medium text-slate-400">
                Legal Notice:
              </strong>{' '}
              All names, likenesses, trademarks, and intellectual property
              rights of the individuals referenced herein remain the exclusive
              property of their respective owners or estates. No endorsement,
              affiliation, or ownership is claimed or implied by Namefi™ or its
              affiliates unless expressly stated otherwise. The use of such
              names is solely for illustrative and educational purposes under
              applicable fair use provisions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
