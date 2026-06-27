import type { ComponentProps } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import { ResourceIndexCard } from './resource-index-card';

type StoryArgs = ComponentProps<typeof ResourceIndexCard>;

const compactBlogMetaItems: StoryArgs['metaItems'] = [
  {
    key: 'reading-time',
    icon: Clock,
    content: '8 min read',
  },
  {
    key: 'published',
    icon: CalendarDays,
    content: <time dateTime="2026-06-24T00:00:00.000Z">June 24, 2026</time>,
  },
];

function ResourceCardCanvas(args: StoryArgs) {
  return (
    <div className="dark min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-7xl">
        <ResourceIndexCard {...args} />
      </div>
    </div>
  );
}

const meta = {
  title: 'Resources/Resource Index Card',
  component: ResourceIndexCard,
  render: (args: StoryArgs) => <ResourceCardCanvas {...args} />,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/en/blog',
        query: { view: 'list' },
      },
    },
  },
  args: {
    title: 'Appraising ENS and Tokenized Domains: Reading Onchain Comps',
    href: '/en/blog/appraising-ens-and-tokenized-domains-reading-onchain-comps',
    summary:
      'Use onchain sales, floor prices, and ENS club data to reason about tokenized domain value before making a bid.',
    metaItems: compactBlogMetaItems,
    imageSrc: null,
    imageAlt: 'Appraising ENS and tokenized domains article preview',
    view: 'list',
  },
};

export default meta;

export const BlogListOverview = {};
