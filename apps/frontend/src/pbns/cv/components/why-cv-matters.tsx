import { WobbleCard } from '@/components/ui/aceternity/wobble-card';
import { OrbitingCircles } from '@/components/ui/magicui/orbiting-circles';
import { Star, Briefcase, Globe, TrendingUp } from 'lucide-react';
import Image from 'next/image';

const orbitIconClassName = 'size-full object-contain';

export const WhyCVMatters = () => {
  return (
    <section id="why-cv-matters" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-slate-900" />
      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center tracking-tight">
          Why .cv Matters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto w-full mb-8">
          <WobbleCard containerClassName="bg-purple-900 min-h-[300px]">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg">
              <Star className="w-8 h-8" />
            </div>
            <h2 className="max-w-80 text-start text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
              Short & Memorable
            </h2>
            <p className="mt-4 max-w-[26rem] text-start text-base/6 text-neutral-200">
              Easy to remember and share. No more long, complicated URLs.
            </p>
          </WobbleCard>
          <WobbleCard containerClassName="md:col-span-2 bg-blue-900 min-h-[300px]">
            <div className="max-w-xs">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg">
                <Briefcase className="w-8 h-8" />
              </div>
              <h2 className="text-start text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                Professional Edge
              </h2>
              <p className="mt-4 text-start text-base/6 text-neutral-200">
                Instantly suggests 'profile / credentials' — perfect for your
                digital CV.
              </p>
            </div>
          </WobbleCard>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
          <WobbleCard containerClassName="md:col-span-2 bg-emerald-900 min-h-[300px] relative overflow-hidden">
            <div className="max-w-sm">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg">
                <Globe className="w-8 h-8" />
              </div>
              <h2 className="max-w-sm md:max-w-lg text-start text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                Portable Identity
              </h2>
              <p className="mt-4 max-w-[26rem] text-start text-base/6 text-neutral-200">
                Drop it anywhere: email signature, LinkedIn, socials, business
                card.
              </p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center transform-gpu translate-x-[40%] translate-y-[40%] scale-150">
              <OrbitingCircles iconSize={40} radius={160}>
                <Image
                  src="/assets/social/whatsapp.svg"
                  alt="WhatsApp"
                  width={40}
                  height={40}
                  className={orbitIconClassName}
                  unoptimized
                />
                <Image
                  src="/assets/social/gmail.png"
                  alt="Gmail"
                  width={40}
                  height={40}
                  className={orbitIconClassName}
                />
                <Image
                  src="/assets/social/instagram.png"
                  alt="Instagram"
                  width={40}
                  height={40}
                  className={orbitIconClassName}
                />
                <Image
                  src="/assets/social/linkedin.svg"
                  alt="LinkedIn"
                  width={40}
                  height={40}
                  className={orbitIconClassName}
                  unoptimized
                />
                <Image
                  src="/assets/social/x.svg"
                  alt="X"
                  width={40}
                  height={40}
                  className={orbitIconClassName}
                  unoptimized
                />
              </OrbitingCircles>
              <OrbitingCircles iconSize={30} radius={80} reverse speed={2}>
                <Image
                  src="/assets/social/whatsapp.svg"
                  alt="WhatsApp"
                  width={30}
                  height={30}
                  className={orbitIconClassName}
                  unoptimized
                />
                <Image
                  src="/assets/social/gmail.png"
                  alt="Gmail"
                  width={30}
                  height={30}
                  className={orbitIconClassName}
                />
                <Image
                  src="/assets/social/instagram.png"
                  alt="Instagram"
                  width={30}
                  height={30}
                  className={orbitIconClassName}
                />
                <Image
                  src="/assets/social/linkedin.svg"
                  alt="LinkedIn"
                  width={30}
                  height={30}
                  className={orbitIconClassName}
                  unoptimized
                />
              </OrbitingCircles>
            </div>
          </WobbleCard>
          <WobbleCard containerClassName="bg-yellow-900 min-h-[300px]">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h2 className="text-start text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
              Investment Potential
            </h2>
            <p className="mt-4 text-start text-base/6 text-neutral-200">
              Premium domains appreciate in value over time.
            </p>
          </WobbleCard>
        </div>
      </div>
    </section>
  );
};
