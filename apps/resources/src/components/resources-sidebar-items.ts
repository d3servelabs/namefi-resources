import {
  BookOpen,
  Briefcase,
  CircleHelp,
  Globe,
  Handshake,
  Layers,
  type LucideIcon,
  Newspaper,
  Tags,
  Video,
} from 'lucide-react';

export type ResourcesSidebarNavLabels = {
  blog: string;
  faq: string;
  topics: string;
  series: string;
  watch: string;
  glossary: string;
  tld: string;
  partners: string;
  careers: string;
};

export type ResourcesSidebarNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export function getResourcesSidebarItems({
  locale,
  nav,
}: {
  locale: string;
  nav: ResourcesSidebarNavLabels;
}): ResourcesSidebarNavItem[] {
  return [
    { label: nav.blog, href: `/${locale}/blog`, icon: Newspaper },
    { label: nav.faq, href: `/${locale}/faq`, icon: CircleHelp },
    { label: nav.topics, href: `/${locale}/topics`, icon: Tags },
    { label: nav.series, href: `/${locale}/series`, icon: Layers },
    { label: nav.watch, href: `/${locale}/watch`, icon: Video },
    { label: nav.glossary, href: `/${locale}/glossary`, icon: BookOpen },
    { label: nav.tld, href: `/${locale}/tld`, icon: Globe },
    { label: nav.partners, href: `/${locale}/partners`, icon: Handshake },
    { label: nav.careers, href: `/${locale}/careers`, icon: Briefcase },
  ];
}
