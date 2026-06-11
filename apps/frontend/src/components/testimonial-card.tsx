import { cn } from '@namefi-astra/ui/lib/cn';
import { shouldBypassImageOptimization } from '@/lib/image-src';
import Image from 'next/image';

interface TestimonialCardProps {
  img: string;
  name: string;
  username: string;
  body: string;
}

export function TestimonialCard({
  img,
  name,
  username,
  body,
}: TestimonialCardProps) {
  return (
    <figure
      className={cn(
        'relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4',
        // Enhanced styling for better visibility
        'bg-slate-800/80 backdrop-blur-xl border-slate-700/50',
        'hover:bg-slate-800/90 hover:border-slate-600/50',
        'transition-all duration-200',
        // Shadow for depth
        'shadow-lg shadow-slate-900/50',
        // Hover effects
        'hover:shadow-xl hover:shadow-slate-900/30 hover:scale-105',
      )}
    >
      <div className="flex flex-row items-center gap-3 mb-3">
        <Image
          className="rounded-full ring-2 ring-slate-600/50"
          width={32}
          height={32}
          alt=""
          src={img}
          unoptimized={shouldBypassImageOptimization(img)}
        />
        <div className="flex flex-col">
          <figcaption className="text-sm font-semibold text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium text-slate-400">{username}</p>
        </div>
      </div>
      <blockquote className="text-sm text-slate-300 leading-relaxed">
        "{body}"
      </blockquote>
    </figure>
  );
}
