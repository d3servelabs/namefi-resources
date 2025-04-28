'use client';

import { Marquee } from '@/components/magicui/marquee';
import { OrbitingCircles } from '@/components/magicui/orbiting-circles';
import { IdCard } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { FC } from 'react';
import { DomainClaim } from '../domain-claim';
import './styles.css';

// Hero Section
const Hero: FC = () => {
  return (
    <section className="py-42 text-center text-white">
      <h1 className="text-4xl md:text-5xl font-bold mb-2">
        We are 0xCitizens:
      </h1>
      <h2 className="text-3xl md:text-4xl font-bold mb-6">
        Building theDecentralized Future Together
      </h2>
      <p className="max-w-3xl mx-auto text-lg opacity-80">
        Join the network of '0x Generation' citizens, where you not only have
        anidentity but also define the future together.
        <br />
        Claim yourname.0x.city and join the movement
      </p>
    </section>
  );
};

// What Is Section with Orbiting Circles
const WhatIsSection: FC = () => {
  return (
    <section className="px-14 flex flex-col md:flex-row items-center justify-between gap-10">
      <div className="md:w-1/2 text-white max-w-2xl flex flex-col gap-6 justify-center">
        <h2 className="text-5xl font-bold mb-6">What Is 0x.City</h2>
        <p className="text-lg leading-relaxed">
          0x.City is a community belonging to "0x Citizens." We are a group of
          people who deeply believe in the future of blockchain and
          decentralization. Using "0x" in addresses, social accounts, and
          identities is our cultural symbol. We love open source, freedom, and
          collaboration, and are building an open, transparent, and
          decentralized new digital world together.
        </p>
      </div>
      <div className="relative flex h-[635] md:w-1/2 flex-col items-center justify-center overflow-hidden">
        <OrbitingCircles path={true} radius={120} iconSize={72}>
          <Image
            src="/assets/orbiting-circles/clip.svg"
            alt="clip"
            width={72}
            height={72}
          />
        </OrbitingCircles>
        <OrbitingCircles path={true} radius={200} iconSize={72}>
          <Image
            src="/assets/orbiting-circles/leaf.svg"
            alt="clip"
            width={72}
            height={72}
          />
          <Image
            src="/assets/orbiting-circles/layers.svg"
            alt="clip"
            width={72}
            height={72}
          />
          <Image
            src="/assets/orbiting-circles/eth.svg"
            alt="clip"
            width={72}
            height={72}
          />
        </OrbitingCircles>
        <OrbitingCircles path={true} radius={280} iconSize={72}>
          <Image
            src="/assets/orbiting-circles/cube.svg"
            alt="clip"
            width={72}
            height={72}
          />
          <Image
            src="/assets/orbiting-circles/grid.svg"
            alt="clip"
            width={72}
            height={72}
          />
        </OrbitingCircles>
      </div>
    </section>
  );
};

// Why Join Section with feature cards
const WhyJoin: FC = () => {
  return (
    <section className="px-14 py-20 flex flex-col items-center">
      <h2 className="text-5xl font-bold mb-4 text-white text-center">
        Why Join the Movement?
      </h2>
      <p className="text-lg text-white text-center mb-12 max-w-4xl">
        "Having your own yourname.0x.city is not just an identifier, but also a
        ticket to join this decentralized cultural movement."
      </p>

      <div className="flex flex-col gap-6 w-full max-w-4xl">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-500/20 rounded-lg p-2">
              <IdCard className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">
              Registered a name starting with 0x on ENS
            </h3>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-500/20 rounded-lg p-2">
              <IdCard className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">
              Using 0x as your digital imprint on Twitter/Farcaster
            </h3>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-500/20 rounded-lg p-2">
              <IdCard className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">
              Actively participating and creating in DAOs, NFTs, DeFi
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
};

// Citizen Card Component
type CitizenCardProps = {
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
};

const CitizenCard: FC<CitizenCardProps> = ({
  title,
  description,
  imageSrc = '',
  imageAlt = 'Citizen Profile',
}) => {
  return (
    <div className="relative bg-black/40 h-46 w-160 backdrop-blur-sm rounded-lg p-8 border border-white/10">
      <div className="flex gap-4 justify-between items-center">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={120}
          height={120}
          className="object-cover rounded-md size-30"
        />
        <div className="flex flex-col gap-2 flex-1 items-start justify-start">
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-300">{description}</p>
        </div>
      </div>
    </div>
  );
};

// Who Are 0x Citizens Section
export const SomeGeneralLandingComponent: FC = () => {
  const citizenTypes = [
    {
      title: 'Blockchain Believer',
      description:
        'Deeply believes in blockchain and decentralized finance(DeFi) as the future, actively participating in related ecosystem building.',
      imageSrc: '/Avatar.png',
      imageAlt: 'Blockchain Believer',
    },
    {
      title: 'Crypto KOL/Influencer',
      description:
        "Uses the '0x' prefix in social media and identity markers such as Twitter, ENS, email, etc. expressing identification with crypto culture.",
      imageSrc: '/Avatar.png',
      imageAlt: 'Crypto KOL/Influencer',
    },
    {
      title: 'Sovereignty Advocate',
      description:
        'Advocates for open, transparent, permissionless network culture, pursuing financial sovereignty and personal identity autonomy.',
      imageSrc: '/Avatar.png',
      imageAlt: 'Sovereignty Advocate',
    },
    {
      title: 'Technical Specialist',
      description:
        'Has strong technical sensibility for Ethereum smart contracts, blockchain infrastructure, and other crypto native tools.',
      imageSrc: '/Avatar.png',
      imageAlt: 'Technical Specialist',
    },
  ];

  return (
    <section className="py-20 flex flex-col items-center">
      <h2 className="text-5xl font-bold mb-4 text-white text-center">
        Who Are 0x Citizens?
      </h2>
      <p className="text-lg text-white text-center mb-12 max-w-4xl">
        Builders, artists, DAO contributors and DeFi degens who:
      </p>

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
        <Marquee pauseOnHover={true}>
          {citizenTypes.map((citizen, index) => (
            <CitizenCard
              key={`citizen-${index}`}
              title={citizen.title}
              description={citizen.description}
              imageSrc={citizen.imageSrc}
              imageAlt={citizen.imageAlt}
            />
          ))}
        </Marquee>
      </div>
    </section>
  );
};

const DomainClaimSection: FC = () => {
  const router = useRouter();
  return (
    <section className="flex flex-col items-center">
      <div className="relative my-20 w-[80%]">
        <div className="relative gradient-border-mask">
          <div className="absolute top-0 left-0 right-0 h-[400px] w-full bg-[radial-gradient(54.3%_55.57%_at_50%_0%,rgba(79,70,229,0.20)_0%,rgba(79,70,229,0.00)_100%)] pointer-events-none" />
          <DomainClaim
            domain="0x.city"
            onClaim={() => {
              router.push('/cart');
            }}
          />
        </div>
      </div>
    </section>
  );
};

// Main Landing Component
export const Landing: FC = () => {
  return (
    <div className="flex flex-col mt-40 pb-20 gap-10 bg-black/80 backdrop-blur-3xl">
      <Hero />
      <div>
        <WhatIsSection />
        <WhyJoin />
        {/* <WhoAre0xCitizens /> */}
        <DomainClaimSection />
      </div>
    </div>
  );
};
