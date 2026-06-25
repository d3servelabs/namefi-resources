'use client';

/**
 * OmniSearch — an always-on, all-in-one search surface.
 *
 * Headless & navigation-agnostic: it renders results passed in via `sections`
 * and emits intent via callbacks. It does NOT know about tRPC, the cart, the
 * Pagefind index, or next/navigation — those are wired by the host app through
 * the `onSelect` / `onAddToCart` / `onRemoveFromCart` props (see the design plan).
 *
 * All user-facing strings arrive as props (`labels`) — the component never calls
 * `next-intl`. The host translates and passes localized strings down.
 *
 * Two surfaces, one panel ("hybrid"):
 *  - `inline`  : an always-visible search field with a dropdown of results.
 *  - `modal`   : a trigger that opens a ⌘K command-palette (bottom-sheet on mobile).
 *  - `auto`    : `inline` on desktop, `modal` on mobile (default).
 *
 * @example
 * ```tsx
 * // host wrapper in apps/frontend wires i18n + providers
 * const t = useTranslations('omniSearch');
 * <OmniSearch
 *   query={query}
 *   onQueryChange={setQuery}
 *   sections={sections}
 *   labels={{ placeholder: t('placeholder'), empty: t('empty'), cart: { ... } }}
 *   onSelect={(r) => router.push(r.kind === 'domain' ? `/?query=${r.domain}` : r.href)}
 *   onAddToCart={(r) => cart.addItem(...)}
 * />
 * ```
 */

import { Command as CommandPrimitive } from 'cmdk';
import {
  ArrowUpRight,
  Check,
  CornerDownLeft,
  Download,
  FileText,
  Gift,
  Globe,
  Loader2,
  Search,
  Settings2,
  ShoppingCart,
} from 'lucide-react';
import {
  type ComponentProps,
  Fragment,
  type ReactNode,
  type Ref,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Command,
  CommandGroup,
  CommandList,
  CommandSeparator,
} from '@namefi-astra/ui/components/shadcn/command';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';
import { cn } from '@namefi-astra/ui/lib/cn';

/* -------------------------------------------------------------------------- */
/*                                   Types                                     */
/* -------------------------------------------------------------------------- */

export type DomainCartState =
  | 'add'
  | 'adding'
  | 'in-cart'
  | 'removing'
  | 'import'
  // Free-claim-eligible: the button routes to the claim flow, not the cart, so
  // it must read as "claim" (a cart icon + "Add to cart" would mislabel it).
  | 'claim';

/** A live domain-availability result with an inline add-to-cart affordance. */
export interface OmniSearchDomainResult {
  kind: 'domain';
  id: string;
  /** Normalized domain, e.g. `vault.xyz`. */
  domain: string;
  available: boolean;
  importable?: boolean;
  isPremium?: boolean;
  /** Pre-formatted price (host does currency/i18n), e.g. `$8.99`. */
  priceLabel?: string;
  /** Pre-formatted strikethrough original price, e.g. `$12.99`. */
  originalPriceLabel?: string;
  /** Short status shown when the domain is taken, e.g. `Taken`. */
  statusLabel?: string;
  cartState?: DomainCartState;
}

/** A navigable destination (app page/action) or a help/resources document. */
export interface OmniSearchLinkResult {
  kind: 'destination' | 'resource';
  id: string;
  title: string;
  href: string;
  /** Plain-text subtitle/excerpt. */
  subtitle?: string;
  /** Trusted HTML excerpt (e.g. Pagefind `<mark>` highlights). */
  subtitleHtml?: string;
  /** Short category badge, e.g. `Blog`, `DNSSEC`. */
  badgeLabel?: string;
  /** Optional leading icon; defaults by `kind`. */
  icon?: ReactNode;
}

export type OmniSearchResult = OmniSearchDomainResult | OmniSearchLinkResult;

export interface OmniSearchSection {
  id: string;
  heading: string;
  results: OmniSearchResult[];
  /** When true, a skeleton placeholder is shown for this section. */
  loading?: boolean;
  /** Optional trailing row, e.g. "See all results for 'foo'". */
  footer?: { id: string; label: string; onSelect: () => void };
}

export interface OmniSearchCartLabels {
  add: string;
  adding: string;
  inCart: string;
  removing: string;
  import: string;
  /** Free-claim CTA, e.g. "Free Claim". Falls back to `add` if omitted. */
  claim?: string;
}

export interface OmniSearchLabels {
  placeholder: string;
  /** Shown when a non-empty query yields nothing. */
  empty: string;
  /** Domain cart-button labels keyed by state. */
  cart?: OmniSearchCartLabels;
  /** `Premium` badge text. */
  premium?: string;
  /** Accessible title for the modal surface. */
  dialogTitle?: string;
  /** Label for the "All" tab (shown when >1 result group). Defaults to "All". */
  all?: string;
}

export interface OmniSearchProps {
  /** Controlled query string. */
  query: string;
  onQueryChange: (query: string) => void;
  /** Grouped results (host orchestrates the providers + debounce). */
  sections: OmniSearchSection[];
  labels: OmniSearchLabels;
  /** Controlled open state of the results surface (optional; falls back to internal). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Which surface to render. `auto` = inline on desktop, modal on mobile. */
  surface?: 'inline' | 'modal' | 'auto';
  /** Fired when a result row is selected (Enter/click). */
  onSelect?: (result: OmniSearchResult) => void;
  onAddToCart?: (result: OmniSearchDomainResult) => void;
  onRemoveFromCart?: (result: OmniSearchDomainResult) => void;
  /** Keyboard hint shown in the modal trigger (e.g. `⌘K`). Pass `null` to hide. */
  shortcutHint?: string | null;
  className?: string;
  'data-testid'?: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Styling                                    */
/* -------------------------------------------------------------------------- */

const ITEM_CLASS = cn(
  'group/omni-item relative flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm outline-hidden select-none',
  'data-selected:bg-muted data-selected:text-foreground',
  'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
);

/** Mobile bottom-sheet treatment for the modal surface (logical / RTL-safe). */
const BOTTOM_SHEET_CLASS = cn(
  'max-sm:inset-x-0! max-sm:top-auto! max-sm:bottom-0! max-sm:translate-x-0! max-sm:translate-y-0!',
  'max-sm:max-w-none! max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:max-h-[88vh]',
  'max-sm:data-[state=open]:slide-in-from-bottom-4',
  'max-sm:pb-[max(1rem,env(safe-area-inset-bottom))]',
);

/* -------------------------------------------------------------------------- */
/*                              Sub-components                                 */
/* -------------------------------------------------------------------------- */

function DefaultKindIcon({ kind }: { kind: OmniSearchLinkResult['kind'] }) {
  return kind === 'resource' ? (
    <FileText className="size-4 opacity-60" />
  ) : (
    <Settings2 className="size-4 opacity-60" />
  );
}

function DomainCartButton({
  state,
  labels,
  onAdd,
  onRemove,
  testid,
}: {
  state: DomainCartState;
  labels?: OmniSearchCartLabels;
  onAdd?: () => void;
  onRemove?: () => void;
  testid?: string;
}) {
  // Stop the click from bubbling to the cmdk item (which would navigate).
  const stop = (event: SyntheticEvent) => event.stopPropagation();

  if (state === 'in-cart') {
    return (
      <Button
        type="button"
        size="sm"
        variant="secondary"
        data-testid={testid}
        onPointerDown={stop}
        onClick={(event) => {
          stop(event);
          onRemove?.();
        }}
      >
        <Check className="size-4" />
        <span className="max-md:sr-only">{labels?.inCart}</span>
      </Button>
    );
  }

  if (state === 'adding' || state === 'removing') {
    return (
      <Button
        type="button"
        size="sm"
        variant={state === 'removing' ? 'secondary' : 'default'}
        disabled
        data-testid={testid}
        onPointerDown={stop}
      >
        <Loader2 className="size-4 animate-spin" />
        <span className="max-md:sr-only">
          {state === 'adding' ? labels?.adding : labels?.removing}
        </span>
      </Button>
    );
  }

  const isImport = state === 'import';
  const isClaim = state === 'claim';
  return (
    <Button
      type="button"
      size="sm"
      variant={isClaim ? 'secondary' : 'default'}
      data-testid={testid}
      onPointerDown={stop}
      onClick={(event) => {
        stop(event);
        onAdd?.();
      }}
    >
      {isClaim ? (
        <Gift className="size-4" />
      ) : isImport ? (
        <Download className="size-4" />
      ) : (
        <ShoppingCart className="size-4" />
      )}
      <span className="max-md:sr-only">
        {isClaim
          ? (labels?.claim ?? labels?.add)
          : isImport
            ? labels?.import
            : labels?.add}
      </span>
    </Button>
  );
}

const SKELETON_KEYS = ['a', 'b', 'c', 'd'] as const;

function SectionSkeletons({ count = 2 }: { count?: number }) {
  return (
    <>
      {SKELETON_KEYS.slice(0, count).map((key) => (
        <div
          key={`omni-skeleton-${key}`}
          className="flex items-center gap-2.5 px-2 py-2"
        >
          <Skeleton className="size-4 rounded" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 w-2/3" />
          </div>
        </div>
      ))}
    </>
  );
}

function DomainRowMeta({
  result,
  labels,
  root,
  onAddToCart,
  onRemoveFromCart,
}: {
  result: OmniSearchDomainResult;
  labels: OmniSearchLabels;
  root: string;
  onAddToCart?: (result: OmniSearchDomainResult) => void;
  onRemoveFromCart?: (result: OmniSearchDomainResult) => void;
}) {
  return (
    <div className="ms-auto flex shrink-0 items-center gap-2">
      {result.isPremium && labels.premium ? (
        <Badge variant="secondary" className="text-[10px]">
          {labels.premium}
        </Badge>
      ) : null}
      {result.available && result.priceLabel ? (
        <span className="hidden text-sm font-semibold sm:inline">
          {result.priceLabel}
          {result.originalPriceLabel ? (
            <span className="ms-1 text-[10px] font-normal text-muted-foreground line-through">
              {result.originalPriceLabel}
            </span>
          ) : null}
        </span>
      ) : null}
      {result.available || result.importable || result.cartState === 'claim' ? (
        <DomainCartButton
          state={
            result.cartState ??
            (result.importable && !result.available ? 'import' : 'add')
          }
          labels={labels.cart}
          onAdd={() => onAddToCart?.(result)}
          onRemove={() => onRemoveFromCart?.(result)}
          testid={`${root}.cart.${result.id}`}
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Result rendering                               */
/* -------------------------------------------------------------------------- */

function useResultRenderer(
  root: string,
  labels: OmniSearchLabels,
  handlers: Pick<
    OmniSearchProps,
    'onSelect' | 'onAddToCart' | 'onRemoveFromCart'
  >,
) {
  const { onSelect, onAddToCart, onRemoveFromCart } = handlers;

  const renderDomain = (result: OmniSearchDomainResult) => (
    <CommandPrimitive.Item
      key={result.id}
      value={result.id}
      onSelect={() => onSelect?.(result)}
      className={ITEM_CLASS}
      data-testid={`${root}.result.${result.id}`}
    >
      <Globe className="size-4 shrink-0 opacity-60" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">
          <bdi>{result.domain}</bdi>
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {result.available ? result.priceLabel : (result.statusLabel ?? '')}
        </span>
      </div>
      <DomainRowMeta
        result={result}
        labels={labels}
        root={root}
        onAddToCart={onAddToCart}
        onRemoveFromCart={onRemoveFromCart}
      />
    </CommandPrimitive.Item>
  );

  const renderLink = (result: OmniSearchLinkResult) => (
    <CommandPrimitive.Item
      key={result.id}
      value={result.id}
      onSelect={() => onSelect?.(result)}
      className={ITEM_CLASS}
      data-testid={`${root}.result.${result.id}`}
    >
      <span className="shrink-0 text-muted-foreground">
        {result.icon ?? <DefaultKindIcon kind={result.kind} />}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{result.title}</span>
        {result.subtitleHtml ? (
          <span
            className="truncate text-xs text-muted-foreground [&_mark]:bg-transparent [&_mark]:font-semibold [&_mark]:text-foreground"
            // Host-provided excerpt. The only producer is Pagefind, whose
            // excerpt is the indexed page text HTML-escaped with `<mark>`
            // wrappers around matches — i.e. already-escaped first-party
            // content, not arbitrary HTML. Keep this prop Pagefind-only.
            dangerouslySetInnerHTML={{ __html: result.subtitleHtml }}
          />
        ) : result.subtitle ? (
          <span className="truncate text-xs text-muted-foreground">
            {result.subtitle}
          </span>
        ) : null}
      </div>
      <div className="ms-auto flex shrink-0 items-center gap-2">
        {result.badgeLabel ? (
          <Badge variant="outline" className="text-[10px]">
            {result.badgeLabel}
          </Badge>
        ) : null}
        <ArrowUpRight className="size-3.5 opacity-50 rtl:-scale-x-100" />
      </div>
    </CommandPrimitive.Item>
  );

  return (result: OmniSearchResult) =>
    result.kind === 'domain' ? renderDomain(result) : renderLink(result);
}

/* -------------------------------------------------------------------------- */
/*                            The results surface                             */
/* -------------------------------------------------------------------------- */

/**
 * Grouped result body shared by both surfaces (no `CommandInput`, no
 * `CommandList` wrapper — the caller provides those).
 */
/** A scope tab above the result list (e.g. All / Domains / Help & resources). */
function OmniTab({
  active,
  label,
  onSelect,
  testid,
}: {
  active: boolean;
  label: string;
  onSelect: () => void;
  testid?: string;
}) {
  return (
    <button
      type="button"
      // A `role=tablist`/`tab` pair without a tabpanel + roving-tabindex is an
      // incomplete ARIA tabs pattern; these are filter toggles, so `aria-pressed`
      // describes them correctly without the unmet contract.
      aria-pressed={active}
      data-testid={testid}
      // Keep the input focused; a tab click should filter, not blur/close.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className={cn(
        'shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}

function SectionsBody({
  root,
  query,
  sections,
  labels,
  renderResult,
  activeTab,
  onAfterSelect,
}: {
  root: string;
  query: string;
  sections: OmniSearchSection[];
  labels: OmniSearchLabels;
  renderResult: (result: OmniSearchResult) => ReactNode;
  /** `'all'` shows every group with headings; a section id shows only that group. */
  activeTab: string;
  /** Called after a footer ("see all") select so the surface can close, matching result rows. */
  onAfterSelect?: () => void;
}) {
  // A footer (e.g. "See all availability") is an actionable row in its own
  // right, so keep its section even when it has no result rows — otherwise the
  // only escape hatch for a no-match query would vanish behind `labels.empty`.
  const hasRenderableFooter = (section: OmniSearchSection) =>
    section.footer != null && !section.loading;
  const withContent = sections.filter(
    (section) =>
      section.loading ||
      section.results.length > 0 ||
      hasRenderableFooter(section),
  );
  const visibleSections =
    activeTab === 'all'
      ? withContent
      : withContent.filter((section) => section.id === activeTab);
  // When a single group is selected the tab already names it, so drop the heading.
  const hideHeading = activeTab !== 'all';
  const anyLoading = sections.some((section) => section.loading);
  const totalResults = sections.reduce(
    (sum, section) => sum + section.results.length,
    0,
  );
  const showEmpty =
    !anyLoading &&
    totalResults === 0 &&
    !visibleSections.some(hasRenderableFooter) &&
    query.trim().length > 0;

  return (
    <>
      {visibleSections.map((section, index) => (
        <Fragment key={section.id}>
          {index > 0 ? <CommandSeparator /> : null}
          <CommandGroup
            heading={hideHeading ? undefined : section.heading}
            data-testid={`${root}.group.${section.id}`}
          >
            {section.loading ? (
              <SectionSkeletons />
            ) : (
              section.results.map(renderResult)
            )}
            {section.footer && !section.loading ? (
              <CommandPrimitive.Item
                value={`__footer_${section.footer.id}`}
                onSelect={() => {
                  section.footer?.onSelect();
                  onAfterSelect?.();
                }}
                className={ITEM_CLASS}
                data-testid={`${root}.footer.${section.id}`}
              >
                <Search className="size-4 shrink-0 opacity-60" />
                <span className="text-sm text-muted-foreground">
                  {section.footer.label}
                </span>
                <CornerDownLeft className="ms-auto size-3.5 shrink-0 opacity-50 rtl:-scale-x-100" />
              </CommandPrimitive.Item>
            ) : null}
          </CommandGroup>
        </Fragment>
      ))}
      {showEmpty ? (
        <div
          className="py-8 text-center text-sm text-muted-foreground"
          data-testid={`${root}.empty`}
        >
          {labels.empty}
        </div>
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Orchestrator                                 */
/* -------------------------------------------------------------------------- */

/**
 * The always-on search field, shared by the inline bar and the modal palette:
 * a clean filled control with no border and no focus ring (focus is shown by a
 * subtle fill change). Avoids shadcn `CommandInput`, whose InputGroup border +
 * `ring-[3px]` reads as a heavy outline.
 */
function OmniSearchField({
  value,
  onValueChange,
  placeholder,
  testid,
  autoFocus,
  onFocus,
  onKeyDown,
  inputRef,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  testid?: string;
  autoFocus?: boolean;
  onFocus?: ComponentProps<typeof CommandPrimitive.Input>['onFocus'];
  onKeyDown?: ComponentProps<typeof CommandPrimitive.Input>['onKeyDown'];
  inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <div className="flex h-9 w-full items-center gap-2 rounded-lg bg-input/40 px-3 transition-colors focus-within:bg-input/60">
      <Search className="size-4 shrink-0 opacity-60" />
      <CommandPrimitive.Input
        ref={inputRef}
        autoFocus={autoFocus}
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        // cmdk sets role="combobox" + aria-labelledby pointing at a Command.Label
        // that this component doesn't render, so the combobox would otherwise be
        // unnamed. An explicit aria-label gives it a stable accessible name.
        aria-label={placeholder}
        data-testid={testid}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        // @tailwindcss/forms gives every bare <input> a 1px border + a focus
        // ring (the bold outline). `border-0` drops the border, `outline-none`
        // + `focus:ring-0` drop the ring; focus is shown by the field's
        // `focus-within:bg-input/60` instead.
        className="h-full w-full border-0 bg-transparent text-sm text-foreground outline-none focus:ring-0 placeholder:text-muted-foreground"
      />
    </div>
  );
}

export function OmniSearch({
  query,
  onQueryChange,
  sections,
  labels,
  open,
  onOpenChange,
  surface = 'auto',
  onSelect,
  onAddToCart,
  onRemoveFromCart,
  shortcutHint = '⌘K',
  className,
  'data-testid': testid = 'shared.omniSearch',
}: OmniSearchProps) {
  const isMobile = useIsMobile();
  const resolvedSurface =
    surface === 'auto' ? (isMobile ? 'modal' : 'inline') : surface;

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (open === undefined) setInternalOpen(next);
    },
    [onOpenChange, open],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<string>('all');
  // Tabs appear once more than one group has results. A selected tab that
  // disappears (e.g. the query changed) falls back to "All".
  const tabbableSections = sections.filter(
    (section) => section.results.length > 0,
  );
  const hasTabs = tabbableSections.length > 1;
  const effectiveTab =
    activeTab !== 'all' &&
    tabbableSections.some((section) => section.id === activeTab)
      ? activeTab
      : 'all';

  const renderTabs = () =>
    hasTabs ? (
      <div
        data-testid={`${testid}.tabs`}
        // Small screens: wrap so every tab is reachable and flows into the
        // panel's vertical scroll (no hidden horizontal swipe). Larger screens:
        // single row, horizontally scrollable if it ever overflows.
        className="no-scrollbar flex flex-wrap items-center gap-1 border-b px-2 py-1.5 sm:flex-nowrap sm:overflow-x-auto"
      >
        <OmniTab
          active={effectiveTab === 'all'}
          label={labels.all ?? 'All'}
          onSelect={() => setActiveTab('all')}
          testid={`${testid}.tab.all`}
        />
        {tabbableSections.map((section) => (
          <OmniTab
            key={section.id}
            active={effectiveTab === section.id}
            label={section.heading}
            onSelect={() => setActiveTab(section.id)}
            testid={`${testid}.tab.${section.id}`}
          />
        ))}
      </div>
    ) : null;

  const renderResult = useResultRenderer(testid, labels, {
    onSelect: (result) => {
      onSelect?.(result);
      setOpen(false);
    },
    onAddToCart,
    onRemoveFromCart,
  });

  // ⌘K / Ctrl+K opens the surface from anywhere (Esc / outside-click close it).
  // Open-only, not toggle, so the shortcut never hides an already-open panel.
  // On the inline surface the panel only renders once the query is non-empty,
  // so also focus the field — otherwise ⌘K on an empty query looks like a no-op.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        (event.key === 'k' || event.key === 'K') &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        setOpen(true);
        if (resolvedSurface === 'inline') inlineInputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [resolvedSurface, setOpen]);

  // Close the inline dropdown on outside click.
  useEffect(() => {
    if (resolvedSurface !== 'inline' || !isOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [resolvedSurface, isOpen, setOpen]);

  const showInlinePanel = isOpen && query.trim().length > 0;

  if (resolvedSurface === 'inline') {
    return (
      <div
        ref={containerRef}
        className={cn('relative w-full', className)}
        data-testid={testid}
      >
        <Command
          shouldFilter={false}
          className="gap-0 overflow-visible! rounded-lg! bg-transparent p-0"
        >
          <OmniSearchField
            inputRef={inlineInputRef}
            value={query}
            onValueChange={(value) => {
              onQueryChange(value);
              if (!isOpen) setOpen(true);
            }}
            placeholder={labels.placeholder}
            testid={`${testid}.input`}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setOpen(false);
            }}
          />
          {showInlinePanel ? (
            <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg">
              {renderTabs()}
              <CommandList
                data-testid={`${testid}.list`}
                className="max-h-[min(60vh,32rem)]"
              >
                <SectionsBody
                  root={testid}
                  query={query}
                  sections={sections}
                  labels={labels}
                  renderResult={renderResult}
                  activeTab={effectiveTab}
                  onAfterSelect={() => setOpen(false)}
                />
              </CommandList>
            </div>
          ) : null}
        </Command>
      </div>
    );
  }

  // modal surface
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid={`${testid}.trigger`}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-lg bg-input/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-input/60',
          className,
        )}
      >
        <Search className="size-4 shrink-0 opacity-60" />
        <span className="truncate text-start">{labels.placeholder}</span>
        {shortcutHint ? (
          <kbd className="ms-auto hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium sm:inline-block">
            {shortcutHint}
          </kbd>
        ) : null}
      </button>
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            'top-[12%] translate-y-0 gap-0 overflow-hidden p-0',
            BOTTOM_SHEET_CLASS,
          )}
        >
          <DialogTitle className="sr-only">
            {labels.dialogTitle ?? labels.placeholder}
          </DialogTitle>
          <Command shouldFilter={false} className="bg-transparent">
            <div className="p-2 pb-0">
              <OmniSearchField
                autoFocus
                value={query}
                onValueChange={onQueryChange}
                placeholder={labels.placeholder}
                testid={`${testid}.input`}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setOpen(false);
                }}
              />
            </div>
            {renderTabs()}
            <CommandList
              data-testid={`${testid}.list`}
              className="max-h-[min(60vh,32rem)]"
            >
              <SectionsBody
                root={testid}
                query={query}
                sections={sections}
                labels={labels}
                renderResult={renderResult}
                activeTab={effectiveTab}
                onAfterSelect={() => setOpen(false)}
              />
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
