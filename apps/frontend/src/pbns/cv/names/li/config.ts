import { User, Briefcase, Music, Heart, Star, Trophy } from 'lucide-react';
import { generateCVConfig } from '../../lib/generate-config';

const { landingConfig, originConfigWithoutLanding } = generateCVConfig({
  name: 'li',
  rotatingNames: ['mei', 'alex', 'lucy', 'dr', 'wei'],
  backgroundImage: '/assets/cv/li/background.jpeg',
  openGraphImage: '/assets/cv/li/opengraph-image.jpg',
  famousPeople: [
    {
      name: 'Lykke Li',
      title: 'Singer-Songwriter',
      achievement: 'Platinum Artist',
      image: '/assets/cv/li/famous-people/lykke-li.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Lykke_Li',
    },
    {
      name: 'Gong Li',
      title: 'Award-Winning Actress',
      achievement: 'Cannes Award Winner',
      image: '/assets/cv/li/famous-people/gong-li.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Gong_Li',
    },
    {
      name: 'Jet Li',
      title: 'Martial Arts Icon',
      achievement: 'Wushu Champion',
      image: '/assets/cv/li/famous-people/jet-li.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Jet_Li',
    },
    {
      name: 'Li Na',
      title: 'Tennis Champion',
      achievement: '2x Grand Slam Champion',
      image: '/assets/cv/li/famous-people/li-na.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Li_Na',
    },
    {
      name: 'Li Ka-shing',
      title: 'Business Magnate',
      achievement: "Asia's Richest Man",
      image: '/assets/cv/li/famous-people/li-ka-shing.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Li_Ka-shing',
    },
  ],
  exampleProfiles: [
    {
      subdomain: 'lucy.li.cv',
      title: 'Product Designer',
      description: 'Portfolio & case studies',
      icon: User,
      gradient: 'from-cyan-400 to-blue-500',
      bgGradient: 'from-cyan-500/10 to-blue-500/10',
    },
    {
      subdomain: 'dr.li.cv',
      title: 'Medical Professional',
      description: 'Bio & scheduling links',
      icon: Briefcase,
      gradient: 'from-emerald-400 to-teal-500',
      bgGradient: 'from-emerald-500/10 to-teal-500/10',
    },
    {
      subdomain: 'band.li.cv',
      title: 'Music Collective',
      description: 'Link hub & streaming',
      icon: Music,
      gradient: 'from-purple-400 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
    },
    {
      subdomain: 'family.li.cv',
      title: 'Family Memorial',
      description: 'Multi-person mini site',
      icon: Heart,
      gradient: 'from-rose-400 to-orange-500',
      bgGradient: 'from-rose-500/10 to-orange-500/10',
    },
  ],
  testimonials: [
    {
      name: 'Sophie K.',
      username: '@sophiek',
      body: "Got one for my daughter Li's graduation gift.",
      img: 'https://avatar.vercel.sh/sophiek',
    },
    {
      name: 'Lucy L.',
      username: '@lucyl',
      body: "Finally, a professional domain that's actually memorable.",
      img: 'https://avatar.vercel.sh/lucyl',
    },
    {
      name: 'Mike L.',
      username: '@mikel',
      body: 'Best investment for my personal brand.',
      img: 'https://avatar.vercel.sh/mikel',
    },
    {
      name: 'Dr. Li',
      username: '@drli',
      body: 'Perfect for my medical practice website.',
      img: 'https://avatar.vercel.sh/drli',
    },
    {
      name: 'Band Li',
      username: '@bandli',
      body: 'Our music collective needed this!',
      img: 'https://avatar.vercel.sh/bandli',
    },
    {
      name: 'Family Li',
      username: '@familyli',
      body: 'Great for our family memorial site.',
      img: 'https://avatar.vercel.sh/familyli',
    },
    {
      name: 'Jenny L.',
      username: '@jennyl',
      body: 'Clean URL for my freelance projects!',
      img: 'https://avatar.vercel.sh/jennyl',
    },
    {
      name: 'Tony L.',
      username: '@tonyl',
      body: "I never thought I could have a domain that's just my last name — it's so cool!",
      img: 'https://avatar.vercel.sh/tonyl',
    },
  ],
});

export { landingConfig, originConfigWithoutLanding };
