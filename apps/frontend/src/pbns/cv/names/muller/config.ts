import { User, Briefcase, Music, Heart, Star, Trophy } from 'lucide-react';
import { generateCVConfig } from '../../lib/generate-config';

const { landingConfig, originConfigWithoutLanding } = generateCVConfig({
  name: 'muller',
  rotatingNames: ['anna', 'max', 'marie', 'dr', 'felix'],
  backgroundImage: '/assets/cv/muller/background.jpeg',
  openGraphImage: '/assets/cv/muller/opengraph-image.jpg',
  famousPeople: [
    {
      name: 'Mae Muller',
      title: 'Pop Artist',
      achievement: 'Platinum Single',
      image: '/assets/cv/muller/famous-people/mae-muller.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Mae_Muller',
    },
    {
      name: 'Lillian Müller',
      title: 'Model & Actress',
      achievement: 'Playmate of the Year',
      image: '/assets/cv/muller/famous-people/lillian-muller.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Lillian_Müller',
    },
    {
      name: 'Gerd Müller',
      title: 'Football Legend',
      achievement: "Ballon d'Or Winner",
      image: '/assets/cv/muller/famous-people/gerd-muller.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Gerd_Müller',
    },
    {
      name: 'Thomas Müller',
      title: 'World Cup Champion',
      achievement: 'FIFA World Cup Winner',
      image: '/assets/cv/muller/famous-people/thomas-muller.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Thomas_Müller',
    },
    {
      name: 'H. J. Muller',
      title: 'Nobel Laureate Geneticist',
      achievement: 'Nobel Prize in Medicine',
      image: '/assets/cv/muller/famous-people/h-j-muller.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Hermann_Joseph_Muller',
    },
  ],
  exampleProfiles: [
    {
      subdomain: 'anna.muller.cv',
      title: 'Product Designer',
      description: 'Portfolio & case studies',
      icon: User,
      gradient: 'from-cyan-400 to-blue-500',
      bgGradient: 'from-cyan-500/10 to-blue-500/10',
    },
    {
      subdomain: 'dr.muller.cv',
      title: 'Medical Professional',
      description: 'Bio & scheduling links',
      icon: Briefcase,
      gradient: 'from-emerald-400 to-teal-500',
      bgGradient: 'from-emerald-500/10 to-teal-500/10',
    },
    {
      subdomain: 'band.muller.cv',
      title: 'Music Collective',
      description: 'Link hub & streaming',
      icon: Music,
      gradient: 'from-purple-400 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
    },
    {
      subdomain: 'family.muller.cv',
      title: 'Family Memorial',
      description: 'Multi-person mini site',
      icon: Heart,
      gradient: 'from-rose-400 to-orange-500',
      bgGradient: 'from-rose-500/10 to-orange-500/10',
    },
  ],
  testimonials: [
    {
      name: 'John P.',
      username: '@johnp',
      body: 'Got one for my buddy whose last name is Müller — he was thrilled!',
      img: 'https://avatar.vercel.sh/johnp',
    },
    {
      name: 'Anna M.',
      username: '@annam',
      body: "Finally, a professional domain that's actually memorable.",
      img: 'https://avatar.vercel.sh/annam',
    },
    {
      name: 'Max M.',
      username: '@maxm',
      body: 'Best investment for my personal brand.',
      img: 'https://avatar.vercel.sh/maxm',
    },
    {
      name: 'Dr. Müller',
      username: '@drmuller',
      body: 'Perfect for my medical practice website.',
      img: 'https://avatar.vercel.sh/drmuller',
    },
    {
      name: 'Band Müller',
      username: '@bandmuller',
      body: 'Our music collective needed this!',
      img: 'https://avatar.vercel.sh/bandmuller',
    },
    {
      name: 'Family Müller',
      username: '@familymuller',
      body: 'Great for our family memorial site.',
      img: 'https://avatar.vercel.sh/familymuller',
    },
    {
      name: 'Sven M.',
      username: '@svenm',
      body: 'Never thought I could own my last name as a domain — amazing!',
      img: 'https://avatar.vercel.sh/svenm',
    },
    {
      name: 'Julia M.',
      username: '@juliam',
      body: 'Clean URL for my freelance projects!',
      img: 'https://avatar.vercel.sh/juliam',
    },
  ],
});

export { landingConfig, originConfigWithoutLanding };
