import { Marquee } from '@/components/ui/magicui/marquee';
import { TestimonialCard } from '@/components/testimonial-card';

export interface Testimonial {
  name: string;
  username: string;
  body: string;
  img: string;
}

interface TestimonialsProps {
  /** The name being featured (e.g., "Taylor") */
  name: string;
  /** Array of testimonials */
  testimonials: Testimonial[];
}

export const Testimonials = ({ name, testimonials }: TestimonialsProps) => {
  const firstRow = testimonials.slice(0, Math.ceil(testimonials.length / 2));
  const secondRow = testimonials.slice(Math.ceil(testimonials.length / 2));

  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-slate-950" />
      <div className="max-w-7xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center tracking-tight">
          What {name}s Are Saying
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
