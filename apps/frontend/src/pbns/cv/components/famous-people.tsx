import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Quote, ExternalLink } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export interface FamousPerson {
  name: string;
  title: string;
  quote: string;
  achievement: string;
  icon: LucideIcon;
  externalUrl?: string;
  image?: string; // Path to the person's image
}

interface FamousPeopleProps {
  /** The name being featured (e.g., "Taylor") */
  name: string;
  /** Array of famous people with that name */
  famousPeople: FamousPerson[];
}

// Color schemes for different people
const colorSchemes = [
  {
    iconColor: 'bg-purple-700',
    quoteColor: 'text-purple-400',
    achievementColor: 'text-purple-300',
    quoteBgColor: 'bg-purple-400/30',
  },
  {
    iconColor: 'bg-blue-700',
    quoteColor: 'text-blue-400',
    achievementColor: 'text-blue-300',
    quoteBgColor: 'bg-blue-400/30',
  },
  {
    iconColor: 'bg-violet-700',
    quoteColor: 'text-violet-400',
    achievementColor: 'text-violet-300',
    quoteBgColor: 'bg-violet-400/30',
  },
  {
    iconColor: 'bg-indigo-700',
    quoteColor: 'text-indigo-400',
    achievementColor: 'text-indigo-300',
    quoteBgColor: 'bg-indigo-400/30',
  },
  {
    iconColor: 'bg-pink-700',
    quoteColor: 'text-pink-400',
    achievementColor: 'text-pink-300',
    quoteBgColor: 'bg-pink-400/30',
  },
];

const PersonCard = ({
  person,
  index,
}: {
  person: FamousPerson;
  index: number;
}) => {
  const IconComponent = person.icon;
  const colors = colorSchemes[index % colorSchemes.length];

  // If image is available, use image-focused layout
  if (person.image) {
    return (
      <Card className="bg-slate-900/80 border-slate-700/60 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden p-0">
        <div className="relative aspect-square w-full h-full">
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
                  <Link
                    href={person.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline inline-flex items-center gap-1.5 transition-colors hover:text-blue-200"
                  >
                    {person.name}
                    <ExternalLink className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </Link>
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
  }

  // Fallback to original layout for people without images
  return (
    <Card className="bg-slate-900/80 border-slate-700/60 shadow-xl hover:shadow-2xl transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center gap-4 pb-2 pt-6 px-6">
        <div
          className={`w-12 h-12 rounded-full ${colors.iconColor} flex items-center justify-center shadow-lg`}
        >
          <IconComponent className="w-7 h-7 text-white" />
        </div>
        <div>
          <CardTitle className="text-lg text-white font-medium">
            {person.externalUrl ? (
              <Link
                href={person.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-center gap-1"
              >
                {person.name}
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </Link>
            ) : (
              person.name
            )}
          </CardTitle>
          <CardDescription className="text-slate-400 font-normal">
            {person.title}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-6 px-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="mt-1">
            <Quote className={`w-7 h-7 ${colors.quoteColor} opacity-80`} />
          </span>
          <span
            className={`italic text-base md:text-lg text-slate-200 font-normal ${colors.quoteBgColor} rounded-xl px-4 py-3 leading-relaxed block`}
          >
            {person.quote}
          </span>
        </div>
        <div
          className={`mt-6 text-base font-medium ${colors.achievementColor} flex items-center gap-2`}
        >
          <IconComponent className="w-5 h-5" /> {person.achievement}
        </div>
      </CardContent>
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-10 max-w-6xl mx-auto">
          {/* First row: 3 cards, each taking 2 columns */}
          <div className="md:col-span-2">
            <PersonCard person={famousPeople[0]} index={0} />
          </div>
          <div className="md:col-span-2">
            <PersonCard person={famousPeople[1]} index={1} />
          </div>
          <div className="md:col-span-2">
            <PersonCard person={famousPeople[2]} index={2} />
          </div>

          {/* Second row: 2 cards, each taking 2 columns with 1 column gap on each side */}
          {famousPeople.length > 3 && (
            <>
              <div className="md:col-span-1" />
              <div className="md:col-span-2">
                <PersonCard person={famousPeople[3]} index={3} />
              </div>
              <div className="md:col-span-2">
                <PersonCard person={famousPeople[4]} index={4} />
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
