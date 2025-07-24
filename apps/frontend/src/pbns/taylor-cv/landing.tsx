'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  CheckCircle,
  Trophy,
  User,
  Briefcase,
  Music,
  Heart,
  Star,
  Sparkles,
  Globe,
  TrendingUp,
  ArrowDown,
  Quote,
} from 'lucide-react';
import Link from 'next/link';
import { Marquee } from '@/components/ui/magicui/marquee';
import { TestimonialCard } from '@/components/testimonial-card';
import { ContainerTextFlip } from '@/components/ui/aceternity/container-text-flip';
import { WobbleCard } from '@/components/ui/aceternity/wobble-card';
import { OrbitingCircles } from '@/components/ui/magicui/orbiting-circles';
import type { LandingComponent } from '@/components/search';
import { DomainHuntWidget } from './domain-hunt-widget';

const testimonials = [
  {
    name: 'Alex M.',
    username: '@alexm',
    body: 'My band is called Taylor Made — this was perfect!',
    img: 'https://avatar.vercel.sh/alexm',
  },
  {
    name: 'Sarah K.',
    username: '@sarahk',
    body: "Got one for my daughter Taylor's graduation gift.",
    img: 'https://avatar.vercel.sh/sarahk',
  },
  {
    name: 'Taylor R.',
    username: '@taylorr',
    body: 'Clean URL for my freelance design work!',
    img: 'https://avatar.vercel.sh/taylorr',
  },
  {
    name: 'Jamie T.',
    username: '@jamiet',
    body: "Finally, a professional domain that's actually memorable.",
    img: 'https://avatar.vercel.sh/jamiet',
  },
  {
    name: 'Dr. Taylor',
    username: '@drtaylor',
    body: 'Perfect for my medical practice website.',
    img: 'https://avatar.vercel.sh/drtaylor',
  },
  {
    name: 'Band Taylor',
    username: '@bandtaylor',
    body: 'Our music collective needed this!',
    img: 'https://avatar.vercel.sh/bandtaylor',
  },
  {
    name: 'Family Taylor',
    username: '@familytaylor',
    body: 'Great for our family memorial site.',
    img: 'https://avatar.vercel.sh/familytaylor',
  },
  {
    name: 'Mike T.',
    username: '@miket',
    body: 'Best investment for my personal brand.',
    img: 'https://avatar.vercel.sh/miket',
  },
];

const firstRow = testimonials.slice(0, testimonials.length / 2);
const secondRow = testimonials.slice(testimonials.length / 2);

const exampleProfiles = [
  {
    subdomain: 'jamie.taylor.cv',
    title: 'Product Designer',
    description: 'Portfolio & case studies',
    icon: <User className="w-6 h-6" />,
    gradient: 'from-cyan-400 to-blue-500',
    bgGradient: 'from-cyan-500/10 to-blue-500/10',
  },
  {
    subdomain: 'dr.taylor.cv',
    title: 'Medical Professional',
    description: 'Bio & scheduling links',
    icon: <Briefcase className="w-6 h-6" />,
    gradient: 'from-emerald-400 to-teal-500',
    bgGradient: 'from-emerald-500/10 to-teal-500/10',
  },
  {
    subdomain: 'band.taylor.cv',
    title: 'Music Collective',
    description: 'Link hub & streaming',
    icon: <Music className="w-6 h-6" />,
    gradient: 'from-purple-400 to-pink-500',
    bgGradient: 'from-purple-500/10 to-pink-500/10',
  },
  {
    subdomain: 'family.taylor.cv',
    title: 'Family Memorial',
    description: 'Multi-person mini site',
    icon: <Heart className="w-6 h-6" />,
    gradient: 'from-rose-400 to-orange-500',
    bgGradient: 'from-rose-500/10 to-orange-500/10',
  },
];

const Icons = {
  x: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      imageRendering="optimizeQuality"
      fillRule="evenodd"
      clipRule="evenodd"
      viewBox="0 0 512 509.64"
    >
      <title>X logo</title>
      <rect width="512" height="509.64" rx="115.61" ry="115.61" />
      <path
        fill="#fff"
        fillRule="nonzero"
        d="M323.74 148.35h36.12l-78.91 90.2 92.83 122.73h-72.69l-56.93-74.43-65.15 74.43h-36.14l84.4-96.47-89.05-116.46h74.53l51.46 68.04 59.53-68.04zm-12.68 191.31h20.02l-129.2-170.82H180.4l130.66 170.82z"
      />
    </svg>
  ),
  whatsapp: () => (
    <svg
      width="100"
      height="100"
      viewBox="0 0 175.216 175.552"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>WhatsApp logo</title>
      <defs>
        <linearGradient
          id="b"
          x1="85.915"
          x2="86.535"
          y1="32.567"
          y2="137.092"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#57d163" />
          <stop offset="1" stopColor="#23b33a" />
        </linearGradient>
        <filter
          id="a"
          width="1.115"
          height="1.114"
          x="-.057"
          y="-.057"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="3.531" />
        </filter>
      </defs>
      <path
        d="m54.532 138.45 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.523h.023c33.707 0 61.139-27.426 61.153-61.135.006-16.335-6.349-31.696-17.895-43.251A60.75 60.75 0 0 0 87.94 25.983c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.558zm-40.811 23.544L24.16 123.88c-6.438-11.154-9.825-23.808-9.821-36.772.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954zm0 0"
        fill="#b3b3b3"
        filter="url(#a)"
      />
      <path
        d="m12.966 161.238 10.439-38.114a73.42 73.42 0 0 1-9.821-36.772c.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954z"
        fill="#ffffff"
      />
      <path
        d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.559 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.524h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.929z"
        fill="url(#linearGradient1780)"
      />
      <path
        d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.313-6.179 22.558 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.517 31.126 8.523h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.928z"
        fill="url(#b)"
      />
      <path
        d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"
        fill="#ffffff"
        fillRule="evenodd"
      />
    </svg>
  ),
  gmail: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="52 42 88 66">
      <title>Gmail logo</title>
      <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
      <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
      <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
      <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
      <path
        fill="#c5221f"
        d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2"
      />
    </svg>
  ),
  instagram: () => (
    <svg width="100" height="100" viewBox="0 0 24 24">
      <title>Instagram logo</title>
      <defs>
        <linearGradient
          id="instagram-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#f09433" />
          <stop offset="25%" stopColor="#e6683c" />
          <stop offset="50%" stopColor="#dc2743" />
          <stop offset="75%" stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>
      <path
        fill="url(#instagram-gradient)"
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
      />
    </svg>
  ),
  linkedin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 382 382">
      <title>LinkedIn logo</title>
      <circle cx="191" cy="191" r="210" fill="white" />
      <path
        fill="#0077B7"
        d="M347.445,0H34.555C15.471,0,0,15.471,0,34.555v312.889C0,366.529,15.471,382,34.555,382h312.889
        C366.529,382,382,366.529,382,347.444V34.555C382,15.471,366.529,0,347.445,0z M118.207,329.844c0,5.554-4.502,10.056-10.056,10.056
        H65.345c-5.554,0-10.056-4.502-10.056-10.056V150.403c0-5.554,4.502-10.056,10.056-10.056h42.806
        c5.554,0,10.056,4.502,10.056,10.056V329.844z M86.748,123.432c-22.459,0-40.666-18.207-40.666-40.666S64.289,42.1,86.748,42.1
        s40.666,18.207,40.666,40.666S109.208,123.432,86.748,123.432z M341.91,330.654c0,5.106-4.14,9.246-9.246,9.246H286.73
        c-5.106,0-9.246-4.14-9.246-9.246v-84.168c0-12.556,3.683-55.021-32.813-55.021c-28.309,0-34.051,29.066-35.204,42.11v97.079
        c0,5.106-4.139,9.246-9.246,9.246h-44.426c-5.106,0-9.246-4.14-9.246-9.246V149.593c0-5.106,4.14-9.246,9.246-9.246h44.426
        c5.106,0,9.246,4.14,9.246,9.246v15.655c10.497-15.753,26.097-27.912,59.312-27.912c73.552,0,73.131,68.716,73.131,106.472
        L341.91,330.654L341.91,330.654z"
      />
    </svg>
  ),
};

export const TaylorCVLanding: LandingComponent = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Banner and Hero Container */}
      <div className="min-h-screen flex flex-col">
        {/* Hero Section */}
        <section className="relative flex-1 py-24 px-4 flex items-center justify-center">
          {/* Full Screen Background Image */}
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-[url('/assets/taylor-cv/background.jpeg')] pt-16" />
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full px-4 py-1.5 mb-12 backdrop-blur-sm relative">
              <Sparkles className="w-3 h-3 text-purple-400 relative z-10" />
              <span className="text-purple-300 font-medium text-xs tracking-wide uppercase relative z-10">
                First surname identity launch
              </span>
            </div>

            <div className="mb-12 px-8">
              <ContainerTextFlip
                words={['lisa', 'victor', 'jamie', 'dr', 'sami']}
                interval={2000}
                className="shadow-none"
                textClassName="text-6xl md:text-8xl font-extrabold tracking-tight"
                animationDuration={500}
              />
              <span className="text-6xl md:text-7xl font-bold">.taylor.cv</span>
            </div>

            <p className="text-2xl md:text-3xl text-slate-200 mb-16 max-w-4xl mx-auto font-semibold leading-tight">
              Claim your exclusive subdomain under{' '}
              <span className="text-purple-400 font-bold">taylor.cv</span> —
              <br className="hidden md:block" />
              the ultimate digital identity for every Taylor.
            </p>

            {/* Voting Widget */}
            <div className="flex justify-center mb-16">
              <DomainHuntWidget />
            </div>

            <div className="flex justify-center gap-4 mb-10">
              <Button
                size="lg"
                className="px-8 py-6"
                onClick={() => {
                  document.getElementById('why-cv-matters')?.scrollIntoView({
                    behavior: 'smooth',
                  });
                }}
              >
                <ArrowDown className="w-5 h-5 mr-1" />
                Learn More
              </Button>
              <Link href="/hunt/domains/taylor.cv">
                <Button
                  size="lg"
                  className="px-8 py-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
                >
                  <Trophy className="w-5 h-5 mr-1" />
                  View on Namefi Hunt™
                </Button>
              </Link>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-3">
                <span className="text-slate-400 text-sm tracking-wide">
                  A collaboration of
                </span>
                <Link
                  href="https://ola.cv"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="/assets/taylor-cv/cv-logo.png"
                    alt=".cv"
                    className="h-6 w-auto"
                  />
                </Link>
                <span className="text-slate-400 text-sm tracking-wide">
                  and
                </span>
                <Link
                  href="https://namefi.io"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="/logotype.svg"
                    alt="Namefi"
                    className="h-6 w-auto"
                  />
                </Link>
              </div>
            </div>
          </div>
          {/* Blur fade at bottom of hero to next section */}
          <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
          </div>
        </section>
      </div>

      {/* Why .cv Matters */}
      <section id="why-cv-matters" className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center tracking-tight">
            Why .cv Matters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto w-full mb-8">
            <WobbleCard containerClassName="bg-purple-900 min-h-[300px]">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg">
                <Star className="w-8 h-8" />
              </div>
              <h2 className="max-w-80 text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                Short & Memorable
              </h2>
              <p className="mt-4 max-w-[26rem] text-left text-base/6 text-neutral-200">
                Easy to remember and share. No more long, complicated URLs.
              </p>
            </WobbleCard>
            <WobbleCard containerClassName="md:col-span-2 bg-blue-900 min-h-[300px]">
              <div className="max-w-xs">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg">
                  <Briefcase className="w-8 h-8" />
                </div>
                <h2 className="text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                  Professional Edge
                </h2>
                <p className="mt-4 text-left text-base/6 text-neutral-200">
                  Instantly suggests 'profile / credentials' — perfect for your
                  digital CV.
                </p>
              </div>
            </WobbleCard>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto w-full">
            <WobbleCard containerClassName="md:col-span-2 bg-emerald-900 min-h-[300px] relative overflow-hidden">
              <div className="max-w-sm">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg">
                  <Globe className="w-8 h-8" />
                </div>
                <h2 className="max-w-sm md:max-w-lg text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                  Portable Identity
                </h2>
                <p className="mt-4 max-w-[26rem] text-left text-base/6 text-neutral-200">
                  Drop it anywhere: email signature, LinkedIn, socials, business
                  card.
                </p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center transform-gpu translate-x-[40%] translate-y-[40%] scale-150">
                <OrbitingCircles iconSize={40} radius={160}>
                  <Icons.whatsapp />
                  <img src="/assets/taylor-cv/gmail-logo.png" alt="GMail" />
                  <img
                    src="/assets/taylor-cv/instagram-logo.png"
                    alt="Instagram"
                  />
                  <Icons.linkedin />
                  <Icons.x />
                </OrbitingCircles>
                <OrbitingCircles iconSize={30} radius={80} reverse speed={2}>
                  <Icons.whatsapp />
                  <img src="/assets/taylor-cv/gmail-logo.png" alt="GMail" />
                  <img
                    src="/assets/taylor-cv/instagram-logo.png"
                    alt="Instagram"
                  />
                  <Icons.linkedin />
                </OrbitingCircles>
              </div>
            </WobbleCard>
            <WobbleCard containerClassName="bg-yellow-900 min-h-[300px]">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h2 className="text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                Investment Potential
              </h2>
              <p className="mt-4 text-left text-base/6 text-neutral-200">
                Premium domains appreciate in value over time.
              </p>
            </WobbleCard>
          </div>
        </div>
      </section>

      {/* Famous Taylors Section */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-4 text-center tracking-tight">
            Join the Legacy of{' '}
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              Influential Taylors
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-300 mb-20 text-center max-w-3xl mx-auto font-medium">
            Throughout history, Taylors have made their mark. Now it's time to
            secure yours.
          </p>
          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {/* Taylor Swift */}
            <Card className="bg-slate-900/80 border-slate-700/60 shadow-xl hover:shadow-2xl transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center gap-4 pb-2 pt-6 px-6">
                <div className="w-12 h-12 rounded-full bg-purple-700 flex items-center justify-center shadow-lg">
                  <Music className="w-7 h-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white font-medium">
                    Taylor Swift
                  </CardTitle>
                  <CardDescription className="text-slate-400 font-normal">
                    Global Music Icon
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-2 pb-6 px-6">
                <div className="mb-4 flex items-start gap-3">
                  <span className="mt-1">
                    <Quote className="w-7 h-7 text-purple-400 opacity-80" />
                  </span>
                  <span className="italic text-base md:text-lg text-slate-200 font-normal bg-purple-900/30 rounded-xl px-4 py-3 leading-relaxed block">
                    Personal branding is everything in today's digital world.
                  </span>
                </div>
                <div className="mt-6 text-base font-medium text-purple-300 flex items-center gap-2">
                  <Star className="w-5 h-5" /> 500M+ followers
                </div>
              </CardContent>
            </Card>
            {/* Elizabeth Taylor */}
            <Card className="bg-slate-900/80 border-slate-700/60 shadow-xl hover:shadow-2xl transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center gap-4 pb-2 pt-6 px-6">
                <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center shadow-lg">
                  <Star className="w-7 h-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white font-medium">
                    Elizabeth Taylor
                  </CardTitle>
                  <CardDescription className="text-slate-400 font-normal">
                    Hollywood Legend
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-2 pb-6 px-6">
                <div className="mb-4 flex items-start gap-3">
                  <span className="mt-1">
                    <Quote className="w-7 h-7 text-blue-400 opacity-80" />
                  </span>
                  <span className="italic text-base md:text-lg text-slate-200 font-normal bg-blue-900/30 rounded-xl px-4 py-3 leading-relaxed block">
                    A memorable name opens doors to extraordinary opportunities.
                  </span>
                </div>
                <div className="mt-6 text-base font-medium text-blue-300 flex items-center gap-2">
                  <Trophy className="w-5 h-5" /> 2x Oscar Winner
                </div>
              </CardContent>
            </Card>
            {/* Taylor Lautner */}
            <Card className="bg-slate-900/80 border-slate-700/60 shadow-xl hover:shadow-2xl transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center gap-4 pb-2 pt-6 px-6">
                <div className="w-12 h-12 rounded-full bg-violet-700 flex items-center justify-center shadow-lg">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white font-medium">
                    Taylor Lautner
                  </CardTitle>
                  <CardDescription className="text-slate-400 font-normal">
                    Actor & Producer
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-2 pb-6 px-6">
                <div className="mb-4 flex items-start gap-3">
                  <span className="mt-1">
                    <Quote className="w-7 h-7 text-violet-400 opacity-80" />
                  </span>
                  <span className="italic text-base md:text-lg text-slate-200 font-normal bg-violet-900/30 rounded-xl px-4 py-3 leading-relaxed block">
                    Your domain is your digital identity.
                  </span>
                </div>
                <div className="mt-6 text-base font-medium text-violet-300 flex items-center gap-2">
                  <Star className="w-5 h-5" /> Teen Choice Awards
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto mt-10">
            {/* James Taylor */}
            <Card className="bg-slate-900/80 border-slate-700/60 shadow-xl hover:shadow-2xl transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center gap-4 pb-2 pt-6 px-6">
                <div className="w-12 h-12 rounded-full bg-indigo-700 flex items-center justify-center shadow-lg">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white font-medium">
                    James Taylor
                  </CardTitle>
                  <CardDescription className="text-slate-400 font-normal">
                    Grammy Winner
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-2 pb-6 px-6">
                <div className="mb-4 flex items-start gap-3">
                  <span className="mt-1">
                    <Quote className="w-7 h-7 text-indigo-400 opacity-80" />
                  </span>
                  <span className="italic text-base md:text-lg text-slate-200 font-normal bg-indigo-900/30 rounded-xl px-4 py-3 leading-relaxed block">
                    The right name becomes timeless.
                  </span>
                </div>
                <div className="mt-6 text-base font-medium text-indigo-300 flex items-center gap-2">
                  <Star className="w-5 h-5" /> Rock & Roll Hall of Fame
                </div>
              </CardContent>
            </Card>
            {/* Zachary Taylor */}
            <Card className="bg-slate-900/80 border-slate-700/60 shadow-xl hover:shadow-2xl transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center gap-4 pb-2 pt-6 px-6">
                <div className="w-12 h-12 rounded-full bg-pink-700 flex items-center justify-center shadow-lg">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white font-medium">
                    Zachary Taylor
                  </CardTitle>
                  <CardDescription className="text-slate-400 font-normal">
                    12th US President
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-2 pb-6 px-6">
                <div className="mb-4 flex items-start gap-3">
                  <span className="mt-1">
                    <Quote className="w-7 h-7 text-pink-400 opacity-80" />
                  </span>
                  <span className="italic text-base md:text-lg text-slate-200 font-normal bg-pink-900/30 rounded-xl px-4 py-3 leading-relaxed block">
                    Leadership starts with how you present yourself.
                  </span>
                </div>
                <div className="mt-6 text-base font-medium text-pink-300 flex items-center gap-2">
                  <Star className="w-5 h-5" /> Historical Legacy
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who Can Join */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
        <div className="max-w-5xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center tracking-tight">
            Who Can Join
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'Your first or last name is Taylor',
              'You know a Taylor (gift it!)',
              "You use 'Taylor' as an online handle, stage name, or guild tag",
              'You just love the name Taylor and want a fun personal URL',
            ].map((criteria, index) => (
              <div key={index} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative flex items-start gap-4 p-6 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl hover:border-green-500/30 transition-all">
                  <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-slate-200 text-lg font-medium leading-relaxed">
                    {criteria}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Profiles Gallery */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center tracking-tight">
            Example Profiles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exampleProfiles.map((profile, index) => (
              <div key={index} className="group relative">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${profile.bgGradient} rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity`}
                />
                <Card className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 hover:border-slate-600/50 transition-all group-hover:scale-105 transform duration-200">
                  <CardHeader className="pb-4">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${profile.gradient} rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg`}
                    >
                      {profile.icon}
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
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center tracking-tight">
            What Taylors Are Saying
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

      {/* Final CTA */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_70%)]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-white">
            Help Launch
            <br />
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              taylor.cv
            </span>
          </h2>
          <p className="text-2xl mb-12 text-purple-100 font-normal leading-relaxed">
            Support the project and help us reach more Taylors worldwide
          </p>

          <div className="flex justify-center">
            <Link
              href="https://astra.namefi.io/hunt/domains/taylor.cv"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold text-xl px-12 py-5 rounded-2xl shadow-2xl shadow-yellow-500/25 tracking-tight"
              >
                <Trophy className="w-6 h-6 mr-3" />
                Vote on Namefi Hunt™
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
