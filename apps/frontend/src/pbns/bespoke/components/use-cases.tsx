import { Calendar, ShoppingCart, Megaphone, Zap } from 'lucide-react';

interface UseCasesProps {
  domainName: string;
}

export const UseCases = ({ domainName }: UseCasesProps) => {
  const useCases = [
    {
      icon: Calendar,
      title: 'Events & Launches',
      description:
        'Perfect for time-sensitive events, product launches, and limited-time announcements',
      examples: [
        `launch.${domainName}`,
        `event.${domainName}`,
        `conference.${domainName}`,
      ],
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: ShoppingCart,
      title: 'E-commerce & Sales',
      description:
        'Drive immediate action for flash sales, promotions, and urgent shopping campaigns',
      examples: [
        `sale.${domainName}`,
        `shop.${domainName}`,
        `buy.${domainName}`,
      ],
      gradient: 'from-emerald-500 to-green-500',
    },
    {
      icon: Megaphone,
      title: 'Marketing Campaigns',
      description:
        'Create memorable, action-oriented URLs for advertising and promotional campaigns',
      examples: [
        `promo.${domainName}`,
        `campaign.${domainName}`,
        `special.${domainName}`,
      ],
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Zap,
      title: 'Time-Sensitive Actions',
      description:
        'Capture urgency with domains that communicate immediate action and limited availability',
      examples: [
        `urgent.${domainName}`,
        `now.${domainName}`,
        `instant.${domainName}`,
      ],
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Powerful Use Cases for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-emerald-500">
              {domainName}
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Action-oriented domains that drive results across industries and
            campaigns
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <div
                key={index}
                className="group relative p-8 rounded-2xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all duration-300"
              >
                {/* Gradient border effect on hover */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="mb-6">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center shadow-lg`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-3">
                    {useCase.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {useCase.description}
                  </p>

                  {/* Examples */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Example Domains
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {useCase.examples.map((example, exampleIndex) => (
                        <span
                          key={exampleIndex}
                          className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${useCase.gradient} text-white/90`}
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
