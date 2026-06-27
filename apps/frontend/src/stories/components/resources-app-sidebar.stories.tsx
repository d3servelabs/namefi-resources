import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from '@namefi-astra/ui/components/shadcn/sidebar';
import { getResourcesSidebarItems } from '../../../../resources/src/components/resources-sidebar-items';
import enDictionary from '../../../../resources/src/dictionaries/en.json';

function ResourcesSidebarStory() {
  const activeHref = '/en/faq';
  const items = getResourcesSidebarItems({
    locale: 'en',
    nav: enDictionary.nav,
  });

  return (
    <SidebarProvider
      defaultOpen={true}
      className="dark min-h-svh bg-[#04050A] text-foreground"
    >
      <Sidebar side="left" collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{enDictionary.nav.resources}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const isActive = item.href === activeHref;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        data-testid={`nav.sidebar.item.${item.href}`}
                        render={
                          <a href={item.href}>
                            <span className="sr-only">{item.label}</span>
                          </a>
                        }
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <main
        aria-hidden="true"
        className="min-h-svh flex-1 bg-[#04050A] p-6 md:p-8"
      >
        <div className="h-full rounded-xl border border-white/10 bg-white/[0.03]" />
      </main>
    </SidebarProvider>
  );
}

const meta: Meta<typeof ResourcesSidebarStory> = {
  title: 'Resources/App Sidebar',
  component: ResourcesSidebarStory,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/en/faq',
      },
    },
  },
};

// biome-ignore lint/style/noDefaultExport: Storybook stories require a default meta export.
export default meta;

type Story = StoryObj<typeof ResourcesSidebarStory>;

export const FaqActive: Story = {};
