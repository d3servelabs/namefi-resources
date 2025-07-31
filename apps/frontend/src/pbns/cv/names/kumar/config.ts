import { User, Briefcase, Music, Heart, Star, Trophy } from 'lucide-react';
import { generateCVConfig } from '../../lib/generate-config';

const { landingConfig, originConfigWithoutLanding } = generateCVConfig({
  name: 'kumar',
  rotatingNames: ['anita', 'rahul', 'priya', 'dr', 'sanjay'],
  backgroundImage: '/assets/cv/kumar/background.jpeg',
  openGraphImage: '/assets/cv/kumar/opengraph-image.jpg',
  famousPeople: [
    {
      name: 'Kishore Kumar',
      title: 'Legendary Singer',
      achievement: '8x Filmfare Awards',
      image: '/assets/cv/kumar/famous-people/kishore-kumar.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Kishore_Kumar',
    },
    {
      name: 'Dilip Kumar',
      title: 'Bollywood Legend',
      achievement: '8x Best Actor Winner',
      image: '/assets/cv/kumar/famous-people/dilip-kumar.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Dilip_Kumar',
    },
    {
      name: 'Akshay Kumar',
      title: 'Bollywood Superstar',
      achievement: '100+ Films',
      image: '/assets/cv/kumar/famous-people/akshay-kumar.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Akshay_Kumar',
    },
    {
      name: 'Kumar Sangakkara',
      title: 'Cricket Champion',
      achievement: 'ICC Hall of Fame',
      image: '/assets/cv/kumar/famous-people/kumar-sangakkara.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Kumar_Sangakkara',
    },
    {
      name: 'Kumar M. Birla',
      title: 'Industrialist',
      achievement: 'Fortune 500 CEO',
      image: '/assets/cv/kumar/famous-people/kumar-m-birla.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Kumar_Mangalam_Birla',
    },
  ],
  exampleProfiles: [
    {
      subdomain: 'anita.kumar.cv',
      title: 'Product Designer',
      description: 'Portfolio & case studies',
      icon: User,
      gradient: 'from-cyan-400 to-blue-500',
      bgGradient: 'from-cyan-500/10 to-blue-500/10',
    },
    {
      subdomain: 'dr.kumar.cv',
      title: 'Medical Professional',
      description: 'Bio & scheduling links',
      icon: Briefcase,
      gradient: 'from-emerald-400 to-teal-500',
      bgGradient: 'from-emerald-500/10 to-teal-500/10',
    },
    {
      subdomain: 'band.kumar.cv',
      title: 'Music Collective',
      description: 'Link hub & streaming',
      icon: Music,
      gradient: 'from-purple-400 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
    },
    {
      subdomain: 'family.kumar.cv',
      title: 'Family Memorial',
      description: 'Multi-person mini site',
      icon: Heart,
      gradient: 'from-rose-400 to-orange-500',
      bgGradient: 'from-rose-500/10 to-orange-500/10',
    },
  ],
  testimonials: [
    {
      name: 'Neha P.',
      username: '@nehap',
      body: 'Got one for my friend whose last name is Kumar — she loved it.',
      img: 'https://avatar.vercel.sh/nehap',
    },
    {
      name: 'Anita K.',
      username: '@anitak',
      body: "Finally, a professional domain that's actually memorable.",
      img: 'https://avatar.vercel.sh/anitak',
    },
    {
      name: 'Raj K.',
      username: '@rajk',
      body: 'Best investment for my personal brand.',
      img: 'https://avatar.vercel.sh/rajk',
    },
    {
      name: 'Dr. Kumar',
      username: '@drkumar',
      body: 'Perfect for my medical practice website.',
      img: 'https://avatar.vercel.sh/drkumar',
    },
    {
      name: 'Band Kumar',
      username: '@bandkumar',
      body: 'Our music collective needed this!',
      img: 'https://avatar.vercel.sh/bandkumar',
    },
    {
      name: 'Family Kumar',
      username: '@familykumar',
      body: 'Great for our family memorial site.',
      img: 'https://avatar.vercel.sh/familykumar',
    },
    {
      name: 'Priya K.',
      username: '@priyak',
      body: 'Clean URL for my freelance projects!',
      img: 'https://avatar.vercel.sh/priyak',
    },
    {
      name: 'Amit K.',
      username: '@amitk',
      body: "I never thought I could have a domain that's just my last name — it's awesome!",
      img: 'https://avatar.vercel.sh/amitk',
    },
  ],
});

export { landingConfig, originConfigWithoutLanding };
