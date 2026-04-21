import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import type { LucideIcon } from 'lucide-react';

export interface ExampleProfile {
  subdomain: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  bgGradient: string;
}

interface ExampleProfilesProps {
  /** Array of example profiles */
  exampleProfiles: ExampleProfile[];
}

export const ExampleProfiles = ({ exampleProfiles }: ExampleProfilesProps) => {
  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-slate-950" />
      <div className="max-w-7xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center tracking-tight">
          Example Profiles
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {exampleProfiles.map((profile, index) => {
            const IconComponent = profile.icon;
            return (
              <div key={index} className="group relative">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${profile.bgGradient} rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity`}
                />
                <Card className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 hover:border-slate-600/50 transition-all group-hover:scale-105 transform duration-200">
                  <CardHeader className="pb-4">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${profile.gradient} rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-white tracking-tight">
                      {profile.title}
                    </CardTitle>
                    <CardDescription className="font-mono text-blue-400 font-medium text-sm tracking-tight">
                      {profile.subdomain}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 font-normal">
                      {profile.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
