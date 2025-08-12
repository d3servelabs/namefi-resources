import { CheckCircle2 } from 'lucide-react';

interface ValuePropositionProps {
  domainName: string;
}

export const ValueProposition = ({ domainName }: ValuePropositionProps) => {
  const benefits = [
    {
      title: 'Instant Context in the URL',
      description:
        'Your subdomain becomes a built-in call-to-action that tells users exactly what to do',
    },
    {
      title: 'Memorable & Shareable',
      description:
        'Action-oriented domains get higher click-through rates and are easier to remember',
    },
    {
      title: 'Fast Issuance via Namefi',
      description:
        'Get your subdomain instantly with full DNS control and management tools',
    },
    {
      title: 'SEO & Campaign Friendly',
      description:
        'Track performance, optimize for search, and create targeted marketing campaigns',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Why Issue Subdomains on{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-emerald-500">
              {domainName}
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Transform your online presence with subdomains that work as hard as
            you do. Every URL becomes a powerful call-to-action that drives
            results.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex gap-4 p-6 rounded-xl bg-muted/50 border border-border/50 hover:border-border transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
