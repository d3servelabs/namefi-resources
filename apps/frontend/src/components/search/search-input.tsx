'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { config } from '@/lib/env';
import { cn } from '@namefi-astra/ui/lib/cn';
import { Loader2, SearchIcon, X, Download } from 'lucide-react';
import {
  type FC,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
} from 'react';
import { NamefiButton } from '@namefi-astra/ui/components/namefi/namefi-button';
import { useTranslations } from 'next-intl';
import { SearchMode } from './types';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { Separator } from '@namefi-astra/ui/components/shadcn/separator';
import { AnimatePresence, motion } from 'motion/react';
import { useFreeMintsGuidance } from '@/components/providers/free-mints-guidance';
import { Spotlight } from '@/components/ui/spotlight';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';

// Components
export const SearchHeader: FC<{
  parentDomain: string | undefined;
  setParentDomain: (domain: string | undefined) => void;
  isFirstPartyOrigin: boolean;
  tagline?: string;
  hideNetworkSelection?: boolean;
  className?: string;
}> = ({
  parentDomain,
  setParentDomain,
  isFirstPartyOrigin,
  tagline,
  hideNetworkSelection = false,
  className,
}) => {
  const t = useTranslations('search');
  return (
    <div className={cn('flex flex-col items-center mt-40 gap-3', className)}>
      <p className="text-4xl text-center text-secondary-foreground font-semibold drop-shadow-xl">
        {tagline ||
          (parentDomain
            ? t('header.taglineWithNetwork', { parentDomain })
            : t('header.taglineAllNetworks'))}
      </p>
      {isFirstPartyOrigin && !hideNetworkSelection && (
        <div className="flex gap-2 p-3 pe-0 items-center bg-neutral-900 backdrop-blur-md rounded-lg">
          {t('header.networkLabel')}
          <div className="flex items-center gap-2 mx-auto w-full max-w-md overflow-x-auto">
            <Button
              key="main"
              data-testid="search.header.network-all"
              variant={parentDomain === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => setParentDomain(undefined)}
              className="h-8 px-3"
            >
              {t('header.allNetworks')}
            </Button>
            {config.POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES.map((origin) => (
              <Button
                key={origin}
                data-testid={`search.header.network.${origin}`}
                variant={parentDomain === origin ? 'default' : 'outline'}
                size="sm"
                onClick={() => setParentDomain(origin)}
                className="h-8 px-3"
              >
                {origin}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const SearchModeTabs: FC<{
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
}> = ({ searchMode, onSearchModeChange }) => {
  const t = useTranslations('search');
  const handleValueChange = (value: string) => {
    onSearchModeChange(value as SearchMode);
  };

  return (
    <Tabs
      value={searchMode}
      onValueChange={handleValueChange}
      className="mx-auto h-10 md:h-12 w-full max-w-60 md:max-w-80"
    >
      <TabsList className="!grid !h-full !w-full grid-cols-2 !rounded-full border border-white/12 bg-neutral-900/80 !p-0.5 backdrop-blur-md">
        <TabsTrigger
          value={SearchMode.REGISTER}
          data-testid="search.mode-tabs.register"
          className="!h-full !rounded-full !border-0 !py-0 px-3 text-sm font-medium !text-muted-foreground transition !shadow-none data-active:!bg-white/10 data-active:!text-white data-active:!shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] after:hidden md:px-4 md:text-base"
        >
          {t('modeTabs.register')}
        </TabsTrigger>
        <TabsTrigger
          value={SearchMode.IMPORT}
          data-testid="search.mode-tabs.import"
          className="!h-full !rounded-full !border-0 !py-0 px-3 text-sm font-medium !text-muted-foreground transition !shadow-none data-active:!bg-white/10 data-active:!text-white data-active:!shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] after:hidden md:px-4 md:text-base"
        >
          {t('modeTabs.import')}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export const SearchInput: FC<{
  query: string;
  setQuery: (query: string) => void;
  isLoading: boolean;
  onSearch: () => void;
  searchMode: SearchMode;
  parentDomain: string | undefined;
  onClearParentDomain?: () => void;
  isFirstPartyOrigin?: boolean;
  ctaClassName?: string;
  onSearchIntent?: () => void;
}> = ({
  query,
  setQuery,
  isLoading,
  searchMode,
  onSearch,
  parentDomain,
  onClearParentDomain,
  isFirstPartyOrigin,
  ctaClassName,
  onSearchIntent,
}) => {
  const t = useTranslations('search');
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { registerFocusSearchInput, registerFreeMintsGuidanceStarter } =
    useFreeMintsGuidance();
  const [isFreeMintGuidanceVisible, setIsFreeMintGuidanceVisible] =
    useState(false);

  const displayFreeMintTooltip = useCallback(() => {
    setIsFreeMintGuidanceVisible(true);
    // Auto-hide tooltip after 5 seconds
    setTimeout(() => {
      setIsFreeMintGuidanceVisible(false);
    }, 5000);
  }, []);

  useEffect(() => {
    registerFreeMintsGuidanceStarter(displayFreeMintTooltip);
  }, [registerFreeMintsGuidanceStarter, displayFreeMintTooltip]);

  const clearParentDomainAndDismissFreeMintGuidance = useCallback(() => {
    setIsFreeMintGuidanceVisible(false);
    onClearParentDomain?.();
  }, [onClearParentDomain]);

  const handleSearchClick = useCallback(() => {
    onSearchIntent?.();
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      // If no query, focus the input/textarea
      if (searchMode === SearchMode.IMPORT) {
        textareaRef.current?.focus();
      } else {
        inputRef.current?.focus();
      }
    } else {
      // Handle search
      onSearch();
    }
  }, [onSearchIntent, query, onSearch, searchMode]);

  // Handle raw text with newlines for CSV import
  const handleRawText = useCallback(
    (rawText: string) => {
      onSearchIntent?.();
      // For import mode, preserve newlines to maintain CSV format
      if (searchMode === SearchMode.IMPORT) {
        setQuery(rawText);
      } else {
        // For register mode, convert newlines to spaces
        setQuery(rawText.replace(/\n+/g, ' '));
      }
    },
    [onSearchIntent, searchMode, setQuery],
  );

  const handleQueryChange = useCallback(
    (value: string) => {
      onSearchIntent?.();
      setQuery(value);
    },
    [onSearchIntent, setQuery],
  );
  // Expose focus method for other components (e.g., free mint claim)
  useEffect(() => {
    registerFocusSearchInput(() => {
      if (searchMode === SearchMode.IMPORT) {
        textareaRef.current?.focus();
      } else {
        inputRef.current?.focus();
      }
    });
  }, [registerFocusSearchInput, searchMode]);

  // Smooth textarea height animation using ResizeObserver
  useEffect(() => {
    if (
      searchMode !== SearchMode.IMPORT ||
      !textareaRef.current ||
      !textareaWrapperRef.current
    ) {
      return;
    }

    const textarea = textareaRef.current;
    const wrapper = textareaWrapperRef.current;

    // Set initial height
    wrapper.style.height = `${textarea.scrollHeight}px`;

    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to batch updates
      requestAnimationFrame(() => {
        const newHeight = textarea.scrollHeight;
        wrapper.style.height = `${newHeight}px`;
      });
    });

    resizeObserver.observe(textarea);

    return () => {
      resizeObserver.disconnect();
    };
  }, [searchMode]);

  // Intercept paste and input events to handle newlines properly
  const intercept = useCallback(
    (
      e:
        | ClipboardEvent<HTMLInputElement>
        | ClipboardEvent<HTMLTextAreaElement>
        | FormEvent<HTMLInputElement>
        | FormEvent<HTMLTextAreaElement>,
    ) => {
      e.preventDefault();

      const raw =
        (
          e as ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>
        ).clipboardData?.getData('text') ??
        (e as FormEvent<HTMLInputElement | HTMLTextAreaElement>).currentTarget
          ?.value ??
        '';

      handleRawText(raw);
    },
    [handleRawText],
  );

  const isMobile = useIsMobile();

  const isImportMode = searchMode === SearchMode.IMPORT;
  const importPlaceholder = t('input.importPlaceholder');

  return (
    <>
      <Tooltip open={isFreeMintGuidanceVisible}>
        <TooltipTrigger
          render={
            <motion.div
              ref={containerRef}
              className={cn(
                'mx-auto flex w-full max-w-3xl gap-3 border border-white/14 bg-[#14161D] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-brand-primary/60 focus-within:bg-[#171A24] focus-within:ring-2 focus-within:ring-brand-primary/35 focus-within:ring-offset-2 focus-within:ring-offset-[#0B0F16] focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_32px_color-mix(in_srgb,_var(--brand-primary)_35%,_transparent)]',
                isImportMode
                  ? 'flex-col rounded-2xl ps-4 pe-4 pt-4 pb-2'
                  : 'items-center rounded-full ps-4 pe-2 py-2',
              )}
              layout
              transition={{
                layout: {
                  type: 'tween',
                  duration: 0.35,
                  ease: [0.4, 0, 0.2, 1],
                },
              }}
            />
          }
        >
          <AnimatePresence mode="wait">
            {isImportMode ? (
              <motion.div
                key="textarea-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col gap-3 w-full"
                layout
              >
                <div className="flex items-start gap-3">
                  {isLoading ? (
                    <Loader2 className="invisible md:visible h-5 w-5 shrink-0 animate-spin text-white/70 mt-1" />
                  ) : (
                    <SearchIcon className="invisible md:visible h-5 w-5 shrink-0 text-white/70 mt-1" />
                  )}
                  <div className="relative flex-1">
                    <motion.div
                      ref={textareaWrapperRef}
                      className="overflow-hidden"
                      layout
                      transition={{
                        layout: {
                          type: 'tween',
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                        },
                      }}
                      style={{
                        transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        willChange: 'height',
                      }}
                    >
                      <Textarea
                        ref={textareaRef}
                        data-testid="search.input.textarea"
                        name="search-textarea"
                        placeholder={importPlaceholder}
                        value={query}
                        onFocus={onSearchIntent}
                        onChange={(event) =>
                          handleQueryChange(event.target.value)
                        }
                        onPaste={intercept}
                        onKeyDown={(e) => {
                          // Allow Enter for newlines in textarea, but Ctrl/Cmd+Enter to submit
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            handleSearchClick();
                          }
                        }}
                        className="min-h-[120px] max-h-[300px] resize-y border-0 px-0 text-base text-white placeholder:text-white/55 placeholder:whitespace-pre-line focus-visible:ring-0 focus-visible:ring-offset-0 md:text-lg !bg-transparent w-full"
                        rows={4}
                        style={{
                          height: 'auto',
                          overflow: 'hidden',
                        }}
                      />
                    </motion.div>
                    {query.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid="search.input.clear-import"
                        className="absolute top-2 end-2 h-8 w-8 shrink-0 rounded-full bg-white/12 p-0 text-white/80 transition hover:bg-white/20 hover:text-white z-10"
                        onClick={() => handleQueryChange('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="input-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 items-center gap-3 w-full"
                layout
              >
                {isLoading ? (
                  <Loader2 className="invisible md:visible h-5 w-5 shrink-0 animate-spin text-white/70" />
                ) : (
                  <SearchIcon className="invisible md:visible h-5 w-5 shrink-0 text-white/70" />
                )}
                <Input
                  ref={inputRef}
                  data-testid="search.input.field"
                  name="search-input"
                  placeholder={t('input.placeholder')}
                  value={query}
                  onFocus={onSearchIntent}
                  onChange={(event) => handleQueryChange(event.target.value)}
                  onPaste={intercept}
                  onKeyDown={(e) => {
                    // Only intercept newline insertion; ordinary keystrokes can proceed
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // For both modes, Enter should trigger a search with the existing query
                      handleSearchClick();
                    }
                  }}
                  className="h-10 md:h-12 min-w-0 flex-1 border-0 px-0 text-base text-white placeholder:text-white/55 focus-visible:ring-0 focus-visible:ring-offset-0 md:text-lg bg-transparent!"
                />
                {query.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid="search.input.clear"
                    className="h-8 w-8 shrink-0 rounded-full bg-white/12 p-0 text-white/80 transition hover:bg-white/20 hover:text-white"
                    onClick={() => handleQueryChange('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <AnimatePresence initial={false} mode="popLayout">
                  {isFirstPartyOrigin &&
                    searchMode === SearchMode.REGISTER &&
                    parentDomain && (
                      <motion.div
                        key="parent-domain-pill"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          transition: { duration: 0.22, ease: 'easeOut' },
                        }}
                        exit={{
                          opacity: 0,
                          x: 16,
                          transition: { duration: 0.18, ease: 'easeIn' },
                        }}
                        className="flex items-center gap-2.5"
                        layout
                        transition={{
                          layout: {
                            type: 'tween',
                            duration: 0.22,
                            ease: 'easeOut',
                          },
                        }}
                      >
                        <Separator
                          orientation="vertical"
                          className="h-8! w-px! rounded-full bg-white/50"
                        />
                        <Badge
                          variant="secondary"
                          className="flex h-8 items-center gap-1.5 rounded-full bg-white/14 ps-3 pe-1.5 text-sm text-white"
                        >
                          <AnimatePresence initial={false} mode="wait">
                            <motion.span
                              key={parentDomain}
                              initial={{ opacity: 0 }}
                              animate={{
                                opacity: 1,
                                transition: {
                                  duration: 0.15,
                                  ease: 'easeOut',
                                },
                              }}
                              exit={{
                                opacity: 0,
                                transition: {
                                  duration: 0.12,
                                  ease: 'easeIn',
                                },
                              }}
                              className="max-w-[200px] truncate whitespace-nowrap"
                            >
                              .{parentDomain}
                            </motion.span>
                          </AnimatePresence>
                          {onClearParentDomain && (
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid="search.input.clear-parent-domain"
                              aria-label={t('input.clearParentDomainAriaLabel')}
                              onClick={
                                clearParentDomainAndDismissFreeMintGuidance
                              }
                              className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 p-0 text-white/80 transition hover:bg-white/30 hover:text-white"
                            >
                              <X className="size-2.5" />
                            </Button>
                          )}
                        </Badge>
                      </motion.div>
                    )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            className={cn('shrink-0', isImportMode ? 'self-end mb-2' : '')}
            layout
            transition={{
              layout: {
                type: 'tween',
                duration: 0.35,
                ease: [0.4, 0, 0.2, 1],
              },
            }}
          >
            <NamefiButton
              data-testid="search.input.submit"
              onClick={handleSearchClick}
              className={cn(
                'not-only:font-semibold md:h-12 h-10 shrink-0 rounded-full px-6 text-base shadow-none',
                isMobile ? 'w-10' : '',
                ctaClassName,
              )}
              title={
                searchMode === SearchMode.IMPORT
                  ? t('input.importButton')
                  : t('input.searchButton')
              }
            >
              {isMobile ? (
                isLoading ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                ) : searchMode === SearchMode.IMPORT ? (
                  <Download />
                ) : (
                  <SearchIcon />
                )
              ) : searchMode === SearchMode.IMPORT ? (
                t('input.importButton')
              ) : (
                t('input.searchButton')
              )}
            </NamefiButton>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="center"
          sideOffset={10}
          className="max-w-xs text-wrap text-center text-sm p-2 z-[10000]"
        >
          <p>
            {parentDomain
              ? t('input.freeMintTooltipWithParent', { parentDomain })
              : t('input.freeMintTooltipAllDomains')}
          </p>
        </TooltipContent>
      </Tooltip>
      <Spotlight
        target={containerRef.current}
        visible={isFreeMintGuidanceVisible}
        onClose={() => setIsFreeMintGuidanceVisible(false)}
        radius={40}
      />
    </>
  );
};
