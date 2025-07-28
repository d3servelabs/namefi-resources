import { CheckCircle } from 'lucide-react';

interface WhoCanJoinProps {
  /** The name being featured (e.g., "Taylor") */
  name: string;
}

// Generic criteria generator - only the name changes
const generateCriteria = (name: string) => [
  `Your first or last name is ${name}`,
  `You know a ${name} (gift it!)`,
  `You use ${name} as an online handle, stage name, or guild tag`,
  `You're building a brand, business, or project with ${name} in the name`,
];

export const WhoCanJoin = ({ name }: WhoCanJoinProps) => {
  const criteria = generateCriteria(name);
  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
      <div className="max-w-5xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center tracking-tight">
          Who Can Join
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {criteria.map((criterion, index) => (
            <div key={index} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative flex items-start gap-4 p-6 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl hover:border-green-500/30 transition-all">
                <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <p className="text-slate-200 text-lg font-medium leading-relaxed">
                  {criterion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
