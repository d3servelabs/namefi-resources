import { User, Briefcase, Music, Heart } from 'lucide-react';
import { generateCVConfig } from '../../lib/generate-config';

const { landingConfig, originConfigWithoutLanding } = generateCVConfig({
  name: 'ali',
  rotatingNames: ['sara', 'omar', 'alex', 'dr', 'fatima'],
  backgroundImage: '/assets/cv/ali/background.jpeg',
  openGraphImage: '/assets/cv/ali/opengraph-image.jpg',
  famousPeople: [
    {
      name: 'Ali Wong',
      title: 'Comedian & Actress',
      achievement: 'Time 100 Honoree',
      image: '/assets/cv/ali/famous-people/ali-wong.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Ali_Wong',
    },
    {
      name: 'Mahershala Ali',
      title: 'Oscar-Winning Actor',
      achievement: '2x Oscar Winner',
      image: '/assets/cv/ali/famous-people/mahershala-ali.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Mahershala_Ali',
    },
    {
      name: 'Ali MacGraw',
      title: 'Hollywood Icon',
      achievement: 'Oscar Nominee',
      image: '/assets/cv/ali/famous-people/ali-macgraw.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Ali_MacGraw',
    },
    {
      name: 'Muhammad Ali',
      title: 'Boxing Legend',
      achievement: 'World Heavyweight Champion',
      image: '/assets/cv/ali/famous-people/muhammad-ali.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Muhammad_Ali',
    },
    {
      name: 'Alireza Firouzja',
      title: 'Chess Grandmaster',
      achievement: 'World No. 2 Chess Player',
      image: '/assets/cv/ali/famous-people/alireza-firouzja.png',
      externalUrl: 'https://en.wikipedia.org/wiki/Alireza_Firouzja',
    },
  ],
  exampleProfiles: [
    {
      subdomain: 'alex.ali.cv',
      title: 'Product Designer',
      description: 'Portfolio & case studies',
      icon: User,
      gradient: 'from-cyan-400 to-blue-500',
      bgGradient: 'from-cyan-500/10 to-blue-500/10',
    },
    {
      subdomain: 'dr.ali.cv',
      title: 'Medical Professional',
      description: 'Bio & scheduling links',
      icon: Briefcase,
      gradient: 'from-emerald-400 to-teal-500',
      bgGradient: 'from-emerald-500/10 to-teal-500/10',
    },
    {
      subdomain: 'band.ali.cv',
      title: 'Music Collective',
      description: 'Link hub & streaming',
      icon: Music,
      gradient: 'from-purple-400 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
    },
    {
      subdomain: 'family.ali.cv',
      title: 'Family Memorial',
      description: 'Multi-person mini site',
      icon: Heart,
      gradient: 'from-rose-400 to-orange-500',
      bgGradient: 'from-rose-500/10 to-orange-500/10',
    },
  ],
  testimonials: [
    {
      name: 'Aaron M.',
      username: '@aaronm',
      body: 'We named our AI assistant ALI — this domain was a no-brainer!',
      img: 'https://avatar.vercel.sh/aaronm',
    },
    {
      name: 'Omar M.',
      username: '@omarm',
      body: 'Got one for my son Ali as a graduation gift.',
      img: 'https://avatar.vercel.sh/omarm',
    },
    {
      name: 'Ali R.',
      username: '@alir',
      body: 'Clean URL for my freelance portfolio!',
      img: 'https://avatar.vercel.sh/alir',
    },
    {
      name: 'Alex A.',
      username: '@alexa',
      body: "Finally, a professional domain that's truly memorable.",
      img: 'https://avatar.vercel.sh/alexa',
    },
    {
      name: 'Dr. Ali',
      username: '@drali',
      body: 'Perfect for my medical practice website.',
      img: 'https://avatar.vercel.sh/drali',
    },
    {
      name: 'Band Ali',
      username: '@bandali',
      body: 'Our music collective needed this!',
      img: 'https://avatar.vercel.sh/bandali',
    },
    {
      name: 'Family Ali',
      username: '@familyali',
      body: 'Great for our family memorial site.',
      img: 'https://avatar.vercel.sh/familyali',
    },
    {
      name: 'Aisha A.',
      username: '@aishaa',
      body: 'Best investment for my personal brand.',
      img: 'https://avatar.vercel.sh/aishaa',
    },
  ],
});

export { landingConfig, originConfigWithoutLanding };
