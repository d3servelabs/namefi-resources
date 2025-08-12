import { Marquee } from '@/components/ui/magicui/marquee';
import { TestimonialCard } from '@/components/testimonial-card';
import type { BespokeTestimonial } from '../types';

interface TestimonialsProps {
  /** The domain name being featured (e.g., "available.today") */
  domainName: string;
  /** Array of testimonials */
  testimonials: BespokeTestimonial[];
}

export const Testimonials = ({
  domainName,
  testimonials,
}: TestimonialsProps) => {
  // Convert BespokeTestimonial to TestimonialCard format
  const convertedTestimonials = testimonials.map((testimonial, index) => ({
    name: testimonial.author,
    username: testimonial.handle || `@user${index + 1}`,
    body: testimonial.quote,
    img:
      testimonial.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonial.author}`,
  }));

  const firstRow = convertedTestimonials.slice(
    0,
    Math.ceil(convertedTestimonials.length / 2),
  );
  const secondRow = convertedTestimonials.slice(
    Math.ceil(convertedTestimonials.length / 2),
  );

  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-slate-950" />
      <div className="max-w-7xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center tracking-tight">
          What People Say About {domainName}
        </h2>

        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
          <Marquee pauseOnHover className="[--duration:20s]">
            {firstRow.map((testimonial) => (
              <TestimonialCard key={testimonial.username} {...testimonial} />
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="[--duration:20s]">
            {secondRow.map((testimonial) => (
              <TestimonialCard key={testimonial.username} {...testimonial} />
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-slate-950" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-slate-950" />
        </div>
      </div>
    </section>
  );
};
