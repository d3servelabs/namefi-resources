import { User, Briefcase, Music, Heart } from 'lucide-react';
import { generateCVConfig } from '../../lib/generate-config';

const { landingConfig, originConfigWithoutLanding } = generateCVConfig({
  name: 'victor',
  rotatingNames: ['maria', 'jamie', 'javier', 'dr', 'alex'],
  backgroundImage: '/assets/cv/victor/background.png',
  openGraphImage: '/assets/cv/victor/opengraph-image.jpg',
  famousPeople: [
    {
      name: 'Victor Hugo',
      title: 'French Novelist & Poet',
      achievement: 'Author of Les Misérables',
      image: '/assets/cv/victor/famous-people/victor-hugo.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Victor_Hugo',
    },
    {
      name: 'Victor Wembanyama',
      title: 'Professional Basketball Player',
      achievement: 'NBA All-Star',
      image: '/assets/cv/victor/famous-people/victor-wembanyama.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Victor_Wembanyama',
    },
    {
      name: 'Víctor Jara',
      title: 'Singer-Songwriter & Activist',
      achievement: 'Chilean Cultural Icon',
      image: '/assets/cv/victor/famous-people/victor-jara.png',
      externalUrl: 'https://en.wikipedia.org/wiki/V%C3%ADctor_Jara',
    },
    {
      name: 'Victor Fleming',
      title: 'Film Director',
      achievement: 'Director of The Wizard of Oz',
      image: '/assets/cv/victor/famous-people/victor-fleming.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Victor_Fleming',
    },
    {
      name: 'Victor Garber',
      title: 'Actor & Singer',
      achievement: 'Tony & Emmy Nominee',
      image: '/assets/cv/victor/famous-people/victor-garber.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Victor_Garber',
    },
  ],
  exampleProfiles: [
    {
      subdomain: 'alex.victor.cv',
      title: 'Product Designer',
      description: 'Portfolio & case studies',
      icon: User,
      gradient: 'from-cyan-400 to-blue-500',
      bgGradient: 'from-cyan-500/10 to-blue-500/10',
    },
    {
      subdomain: 'dr.victor.cv',
      title: 'Medical Professional',
      description: 'Bio & scheduling links',
      icon: Briefcase,
      gradient: 'from-emerald-400 to-teal-500',
      bgGradient: 'from-emerald-500/10 to-teal-500/10',
    },
    {
      subdomain: 'band.victor.cv',
      title: 'Music Collective',
      description: 'Link hub & streaming',
      icon: Music,
      gradient: 'from-purple-400 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
    },
    {
      subdomain: 'family.victor.cv',
      title: 'Family Memorial',
      description: 'Multi-person mini site',
      icon: Heart,
      gradient: 'from-rose-400 to-orange-500',
      bgGradient: 'from-rose-500/10 to-orange-500/10',
    },
  ],
  testimonials: [
    {
      name: 'Victor H.',
      username: '@victorh',
      body: 'Finally grabbed a clean, memorable domain for my portfolio.',
      img: 'https://avatar.vercel.sh/victorh',
    },
    {
      name: 'Maria V.',
      username: '@mariav',
      body: 'Gifted one to my partner Victor — he loves it!',
      img: 'https://avatar.vercel.sh/mariav',
    },
    {
      name: 'Alex J.',
      username: '@alexj',
      body: 'Perfect for my consulting brand under victor.cv.',
      img: 'https://avatar.vercel.sh/alexj',
    },
    {
      name: 'Dr. Victor',
      username: '@drvictor',
      body: 'Great home for my practice with simple links and info.',
      img: 'https://avatar.vercel.sh/drvictor',
    },
    {
      name: 'Team Victor',
      username: '@teamvictor',
      body: 'Our collective finally has a unified identity online.',
      img: 'https://avatar.vercel.sh/teamvictor',
    },
  ],
});

export { landingConfig, originConfigWithoutLanding };
