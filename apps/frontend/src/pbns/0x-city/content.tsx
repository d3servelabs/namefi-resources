'use client';

import { Marquee } from '@/components/ui/magicui/marquee';
import { OrbitingCircles } from '@/components/ui/magicui/orbiting-circles';
import { IdCard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FC, useCallback } from 'react';
import { DomainClaim } from '@/components/domain-claim';
import {
  type BeginCheckoutEvent,
  InteractionLoggingEventName,
} from '@/lib/analytics-events';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { Separator } from '@/components/ui/shadcn/separator';
import './styles.css';

// Hero Section
const Hero: FC = () => {
  return (
    <section className="py-42 text-center text-secondary-foreground">
      <h1 className="text-4xl md:text-5xl font-bold mb-2">
        We are 0xCitizens:
      </h1>
      <h2 className="text-3xl md:text-4xl font-bold mb-6">
        Building the Decentralized Future Together
      </h2>
      <p className="max-w-3xl mx-auto text-lg text-muted-foreground px-4">
        Join the network of '0x Generation' citizens, where you not only have an
        identity but also define the future together.
        <br />
        Claim yourname.0x.city and join the movement
      </p>
    </section>
  );
};

// What Is Section with Orbiting Circles
const WhatIsSection: FC = () => {
  return (
    <section className="px-14 py-20 flex flex-col lg:flex-row items-center justify-evenly gap-10 gradient-border-top gradient-border-bottom overflow-hidden">
      <div className="md:w-1/2 text-secondary-foreground flex flex-col gap-6 justify-center">
        <h2 className="text-5xl text-center lg:text-left font-bold">
          What Is 0x.City
        </h2>
        <p className="text-lg leading-relaxed text-center lg:text-left text-muted-foreground">
          0x.City is a community belonging to "0x Citizens." We are a group of
          people who deeply believe in the future of blockchain and
          decentralization. Using "0x" in addresses, social accounts, and
          identities is our cultural symbol. We love open source, freedom, and
          collaboration, and are building an open, transparent, and
          decentralized new digital world together.
        </p>
      </div>
      <Separator
        orientation="vertical"
        className="bg-white/10 self-stretch !h-auto"
      />
      <div className="relative flex h-[635] scale-70 lg:scale-100 w-[100vh] md:w-full lg:w-1/2 flex-col items-center justify-center overflow-hidden">
        <Image
          src="/assets/0x-city/logos/0x-logo.svg"
          alt="0x logo"
          width={120}
          height={120}
          className="rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0px_0px_250px_0px_#6366F1,0px_0px_250px_0px_#6366F1,0px_0px_151.2px_0px_#6366F1,0px_0px_75.6px_0px_#6366F1,0px_0px_21.6px_0px_#6366F1,0px_0px_10.8px_0px_#6366F1]"
        />
        <OrbitingCircles path={true} radius={120} iconSize={72} speed={0.5}>
          <Image
            src="/assets/0x-city/orbiting-circles/clip.svg"
            alt="clip"
            width={72}
            height={72}
          />
        </OrbitingCircles>
        <OrbitingCircles
          path={true}
          radius={200}
          iconSize={72}
          reverse={true}
          speed={0.75}
        >
          <Image
            src="/assets/0x-city/orbiting-circles/leaf.svg"
            alt="clip"
            width={72}
            height={72}
          />
          <Image
            src="/assets/0x-city/orbiting-circles/layers.svg"
            alt="clip"
            width={72}
            height={72}
          />
          <Image
            src="/assets/0x-city/orbiting-circles/eth.svg"
            alt="clip"
            width={72}
            height={72}
          />
        </OrbitingCircles>
        <OrbitingCircles path={true} radius={280} iconSize={72} speed={1}>
          <Image
            src="/assets/0x-city/orbiting-circles/cube.svg"
            alt="clip"
            width={72}
            height={72}
          />
          <Image
            src="/assets/0x-city/orbiting-circles/grid.svg"
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
    <section className="px-14 py-20 flex flex-col items-center gradient-border-bottom">
      <h2 className="text-5xl font-bold mb-4 text-secondary-foreground text-center">
        Why Join the Movement?
      </h2>
      <p className="text-lg text-muted-foreground text-center mb-12 max-w-4xl">
        "Having your own yourname.0x.city is not just an identifier, but also a
        ticket to join this decentralized cultural movement."
      </p>

      <div className="flex flex-col gap-6 w-full max-w-4xl">
        <div className="bg-white/10 backdrop-blur-3xl rounded-lg p-6 border border-white/10">
          <div className="flex items-center gap-4">
            <div className="bg-brand-primary rounded-lg p-2">
              <IdCard className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-secondary-foreground">
              Registered a name starting with 0x on ENS
            </h3>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-3xl rounded-lg p-6 border border-white/10">
          <div className="flex items-center gap-4">
            <div className="bg-brand-primary rounded-lg p-2">
              <IdCard className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-secondary-foreground">
              Using 0x as your digital imprint on Twitter
            </h3>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-3xl rounded-lg p-6 border border-white/10">
          <div className="flex items-center gap-4">
            <div className="bg-brand-primary rounded-lg p-2">
              <IdCard className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-secondary-foreground">
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
    <div className="relative h-46 w-160 rounded-lg p-8 border border-white/10 bg-[radial-gradient(50%_99.18%_at_50%_66.85%,rgba(79,70,229,0.10)_0%,rgba(79,70,229,0.00)_100%),rgba(255,255,255,0.03)] shadow-sm">
      <div className="flex gap-4 justify-between items-center">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={120}
          height={120}
          className="object-cover rounded-md size-30"
        />
        <div className="flex flex-col gap-2 flex-1 items-start justify-start">
          <h3 className="text-xl font-bold text-secondary-foreground">
            {title}
          </h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
};

// Who Are 0x Citizens Section
export const WhoAre0xCitizens: FC = () => {
  const citizenTypes = [
    {
      title: 'Blockchain Believer',
      description:
        'Deeply believes in blockchain and decentralized finance(DeFi) as the future, actively participating in related ecosystem building.',
      imageSrc: '/assets/0x-city/citizens/believer.png',
      imageAlt: 'Blockchain Believer',
    },
    {
      title: 'Crypto KOL/Influencer',
      description:
        "Uses the '0x' prefix in social media and identity markers such as Twitter, ENS, email, etc. expressing identification with crypto culture.",
      imageSrc: '/assets/0x-city/citizens/influencer.png',
      imageAlt: 'Crypto KOL/Influencer',
    },
    {
      title: 'Sovereignty Advocate',
      description:
        'Advocates for open, transparent, permissionless network culture, pursuing financial sovereignty and personal identity autonomy.',
      imageSrc: '/assets/0x-city/citizens/advocate.png',
      imageAlt: 'Sovereignty Advocate',
    },
    {
      title: 'Technical Specialist',
      description:
        'Has strong technical sensibility for Ethereum smart contracts, blockchain infrastructure, and other crypto native tools.',
      imageSrc: '/assets/0x-city/citizens/specialist.png',
      imageAlt: 'Technical Specialist',
    },
  ];

  return (
    <section className="py-20 flex flex-col items-center">
      <h2 className="text-5xl font-bold mb-4 text-secondary-foreground text-center">
        Who Are 0x Citizens?
      </h2>
      <p className="text-lg text-secondary-foreground text-center mb-12 max-w-4xl">
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
        <Marquee pauseOnHover={true} reverse={true}>
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
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background" />
      </div>
    </section>
  );
};

const DomainClaimSection: FC = () => {
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const router = useRouter();

  const logBeginCheckout = useCallback(() => {
    const beginCheckoutEvent: BeginCheckoutEvent = {
      name: InteractionLoggingEventName.BeginCheckout,
      properties: {},
    };
    logEventWithInteractionLoggers(beginCheckoutEvent);
  }, [logEventWithInteractionLoggers]);

  return (
    <section className="flex flex-col items-center gradient-border-bottom">
      <div className="relative my-20 w-[80%]">
        <div className="relative gradient-border-mask">
          <div className="absolute top-0 left-0 right-0 h-[400px] w-full bg-[radial-gradient(54.3%_55.57%_at_50%_0%,rgba(79,70,229,0.20)_0%,rgba(79,70,229,0.00)_100%)] pointer-events-none" />
          <DomainClaim
            domain="0x.city"
            onClaim={() => {
              logBeginCheckout();
              router.push('/cart');
            }}
          />
        </div>
      </div>
    </section>
  );
};

// Community Section
const CommunitySection: FC = () => {
  return (
    <section className="py-20 flex flex-col items-center">
      <h2 className="text-5xl font-bold mb-4 text-secondary-foreground text-center">
        Join the Community
      </h2>
      <p className="text-lg text-muted-foreground text-center mb-10">
        Stay in the loop, ask questions and share ideas:
      </p>

      <div className="flex gap-4">
        <Link
          href="https://x.com/0xDotCity"
          target="_blank"
          className="flex items-center justify-center bg-black border border-white/20 hover:bg-white/10 text-secondary-foreground p-4 rounded-lg transition-all"
        >
          <Image
            src="/assets/social/twitter.svg"
            alt="Twitter"
            width={20}
            height={20}
          />
        </Link>
        <Link
          href="https://t.me/zeroxdotcity"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center bg-black border border-white/20 hover:bg-white/10 text-secondary-foreground p-4 rounded-lg transition-all"
        >
          <Image
            src="/assets/social/telegram.svg"
            alt="Telegram"
            width={20}
            height={20}
          />
        </Link>
      </div>
    </section>
  );
};

// Main Landing Component
export const Content: FC = () => {
  return (
    <div className="flex flex-col mt-40 pb-20 gap-10 bg-gradient-to-b from-black/40 from-0% via-black/70 via-10% to-background to-100% backdrop-blur-3xl">
      <Hero />
      <div>
        <WhatIsSection />
        <WhyJoin />
        <WhoAre0xCitizens />
        <DomainClaimSection />
        <CommunitySection />
      </div>
    </div>
  );
};
