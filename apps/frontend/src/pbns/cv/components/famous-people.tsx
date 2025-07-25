import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Quote } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface FamousPerson {
  name: string;
  title: string;
  quote: string;
  achievement: string;
  icon: LucideIcon;
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
            {person.name}
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
    <section className="py-24 px-4 relative">
      <div className="absolute inset-0 bg-slate-950" />
      <div className="max-w-7xl mx-auto relative z-10">
        <h2 className="text-5xl md:text-6xl font-extrabold mb-4 text-center tracking-tight">
          Join the Legacy of{' '}
          <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
            Influential {name}s
          </span>
        </h2>
        <p className="text-xl md:text-2xl text-slate-300 mb-20 text-center max-w-3xl mx-auto font-medium">
          Throughout history, {name}s have made their mark. Now it's time to
          secure yours.
        </p>
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {famousPeople.slice(0, 3).map((person, index) => (
            <PersonCard key={index} person={person} index={index} />
          ))}
        </div>
        {famousPeople.length > 3 && (
          <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto mt-10">
            {famousPeople.slice(3, 5).map((person, index) => (
              <PersonCard key={index + 3} person={person} index={index + 3} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
