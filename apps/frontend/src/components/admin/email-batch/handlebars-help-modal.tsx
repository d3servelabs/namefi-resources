'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';

type HandlebarsHelpModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Live JSON of the resolved sample recipient's `{ user, privyUser }`.
   * Optional — if absent, the "Sample JSON" tab shows a placeholder.
   */
  sampleContextJson?: string | null;
};

export function HandlebarsHelpModal({
  open,
  onOpenChange,
  sampleContextJson,
}: HandlebarsHelpModalProps) {
  const [tab, setTab] = useState<'syntax' | 'vars' | 'sample' | 'tracking'>(
    'syntax',
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl max-h-[80vh] overflow-hidden flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Template authoring guide</DialogTitle>
          <DialogDescription>
            Templates are rendered with Handlebars per recipient against{' '}
            <code className="font-mono text-xs">{'{ user, privyUser }'}</code>.
            Markdown is rendered to HTML after substitution.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as typeof tab)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="syntax">Handlebars</TabsTrigger>
            <TabsTrigger value="vars">Variables</TabsTrigger>
            <TabsTrigger value="sample">Sample JSON</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
          </TabsList>

          <TabsContent
            value="syntax"
            className="overflow-auto mt-3 space-y-3 text-sm"
          >
            <Section title="Variables">
              <Code>{'{{user.primaryEmail}}'}</Code>
            </Section>
            <Section title="Conditionals">
              <Code>
                {
                  '{{#if user.displayName}}Hi {{user.displayName}}{{else}}Hello there{{/if}}'
                }
              </Code>
            </Section>
            <Section title="Loops">
              <Code>
                {'{{#each privyUser.linkedAccounts}}- {{this.type}}\n{{/each}}'}
              </Code>
            </Section>
            <Section title="Lookup with default">
              <Code>{'{{#with user}}{{primaryEmail}}{{/with}}'}</Code>
            </Section>
            <Section title="Raw (no HTML escaping)">
              <Code>{'{{{user.someHtmlField}}}'}</Code>
              <p className="text-muted-foreground text-xs">
                By default Handlebars escapes HTML entities. Use triple braces
                only when you really mean it; the markdown renderer will still
                process the result.
              </p>
            </Section>
            <p className="text-xs text-muted-foreground">
              Recipients with no resolvable account see{' '}
              <code className="font-mono">user = null</code> and{' '}
              <code className="font-mono">privyUser = null</code>. Guard with{' '}
              <Code inline>{'{{#if user}}'}</Code>.
            </p>
          </TabsContent>

          <TabsContent
            value="vars"
            className="overflow-auto mt-3 space-y-3 text-sm"
          >
            <Section title="user (internal record)">
              <ul className="space-y-1 font-mono text-xs">
                <li>
                  <code>{'{{user.id}}'}</code>
                </li>
                <li>
                  <code>{'{{user.primaryEmail}}'}</code>
                </li>
                <li>
                  <code>{'{{user.privyUserId}}'}</code>
                </li>
                <li>
                  <code>{'{{user.createdAt}}'}</code>
                </li>
                <li>
                  <code>{'{{user.lastSignInAt}}'}</code>
                </li>
                <li>
                  <code>{'{{user.subscribeToEmails}}'}</code>
                </li>
                <li>
                  <code>{'{{user.stripeCustomerId}}'}</code>
                </li>
              </ul>
            </Section>
            <Section title="privyUser (Privy SDK record)">
              <ul className="space-y-1 font-mono text-xs">
                <li>
                  <code>{'{{privyUser.id}}'}</code>
                </li>
                <li>
                  <code>{'{{privyUser.email.address}}'}</code>
                </li>
                <li>
                  <code>{'{{privyUser.phone.number}}'}</code>
                </li>
                <li>
                  <code>{'{{privyUser.wallet.address}}'}</code>
                </li>
                <li>
                  <code>{'{{privyUser.linkedAccounts}}'}</code> &mdash; array of
                  objects with{' '}
                  <code>{'{type, address|email|username, verifiedAt}'}</code>
                </li>
                <li>
                  <code>{'{{privyUser.customMetadata}}'}</code>
                </li>
              </ul>
            </Section>
            <p className="text-xs text-muted-foreground">
              Open the <strong>Sample JSON</strong> tab to inspect the exact
              shape for the recipient currently selected as the preview sample.
            </p>
          </TabsContent>

          <TabsContent value="sample" className="overflow-auto mt-3 text-sm">
            {sampleContextJson ? (
              <pre className="bg-muted rounded-md p-3 text-xs overflow-auto max-h-[55vh]">
                {sampleContextJson}
              </pre>
            ) : (
              <p className="text-muted-foreground text-xs">
                Pick a sample recipient in the composer to see its resolved{' '}
                <code className="font-mono">{'{ user, privyUser }'}</code> here.
              </p>
            )}
          </TabsContent>

          <TabsContent
            value="tracking"
            className="overflow-auto mt-3 space-y-3 text-sm"
          >
            <Section title="@TrackLink suffix">
              <p>
                Append <code className="font-mono">@TrackLink</code> or{' '}
                <code className="font-mono">@TrackLink(group)</code> to a URL
                inside markdown to swap the rendered{' '}
                <code className="font-mono">href</code> for a click-counter
                redirect. The user lands on the original URL after the click is
                logged.
              </p>
              <Code>
                {
                  '[Visit dashboard](https://namefi.io/m/user/domains@TrackLink)'
                }
              </Code>
              <Code>
                {'[Open cart](https://namefi.io/m/cart@TrackLink(cart-cta))'}
              </Code>
              <p className="text-muted-foreground text-xs">
                Active only when <strong>campaign key</strong> is set. Without
                it the suffix is stripped and clicks aren't tracked.
              </p>
            </Section>

            <Section title="Campaign key">
              <p>
                Optional free-form slug. When set, every email open increments{' '}
                <code className="font-mono">email_campaign_opens</code> and
                every <code className="font-mono">@TrackLink</code> click
                increments{' '}
                <code className="font-mono">email_campaign_clicks</code> keyed
                by <code className="font-mono">(campaignKey, group)</code>.
              </p>
              <p className="text-muted-foreground text-xs">
                Stick to <code className="font-mono">kebab-case</code> (e.g.{' '}
                <code className="font-mono">jan-2026-followup</code>) so rows
                aggregate cleanly.
              </p>
            </Section>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Code({
  children,
  inline = false,
}: {
  children: string;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
        {children}
      </code>
    );
  }
  return (
    <pre className="bg-muted rounded-md p-2 text-xs overflow-auto whitespace-pre-wrap">
      <code className="font-mono">{children}</code>
    </pre>
  );
}
