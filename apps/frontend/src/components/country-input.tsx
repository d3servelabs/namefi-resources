'use client';

import type React from 'react';
import { useCallback, useState, forwardRef, useEffect, useRef } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@namefi-astra/ui/components/shadcn/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useTranslations } from 'next-intl';
import { ChevronDown, CheckIcon, Globe } from 'lucide-react';
import { CircleFlag } from 'react-circle-flags';
import { countries } from 'country-data-list';

export interface Country {
  alpha2: string;
  alpha3: string;
  countryCallingCodes: string[];
  currencies: string[];
  emoji?: string;
  ioc: string;
  languages: string[];
  name: string;
  status: string;
}

interface CountryDropdownProps {
  options?: Country[];
  onChange?: (country: Country | undefined) => void;
  defaultValue?: string;
  disabled?: boolean;
  placeholder?: string;
}

const CountryDropdownComponent = (
  {
    options = countries.all.filter(
      (country: Country) => country.emoji && country.status !== 'deleted',
    ),
    onChange,
    defaultValue,
    disabled = false,
    placeholder,
    ...props
  }: CountryDropdownProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) => {
  const t = useTranslations('shared');
  const resolvedPlaceholder = placeholder ?? t('countryInput.placeholder');
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(
    undefined,
  );
  const commandListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultValue) {
      const initialCountry = options.find(
        (country) => country.alpha2 === defaultValue,
      );
      if (initialCountry) {
        setSelectedCountry(initialCountry);
      } else {
        // Reset selected country if defaultValue is not found
        setSelectedCountry(undefined);
      }
    } else {
      // Reset selected country if defaultValue is undefined or null
      setSelectedCountry(undefined);
    }
  }, [defaultValue, options]);

  const handleSelect = useCallback(
    (country: Country) => {
      setSelectedCountry(country);
      onChange?.(country);
      setOpen(false);
    },
    [onChange],
  );

  const handleInputValueChange = useCallback(() => {
    // Reset scroll position to top when search input changes
    if (commandListRef.current) {
      commandListRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={ref}
        className="border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
        disabled={disabled}
        {...props}
      >
        {selectedCountry ? (
          <div className="flex items-center flex-grow w-0 gap-2 overflow-hidden">
            <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full">
              <CircleFlag
                countryCode={selectedCountry.alpha2.toLowerCase()}
                height={20}
              />
            </div>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              {selectedCountry.name}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">{resolvedPlaceholder}</span>
        )}
        <ChevronDown size={16} />
      </PopoverTrigger>
      <PopoverContent side="bottom" className="min-w-[--anchor-width] p-0">
        <Command className="w-full max-h-[200px] sm:max-h-[270px]">
          <CommandList ref={commandListRef}>
            <div className="sticky top-0 z-10 bg-popover">
              <CommandInput
                placeholder={t('countryInput.searchPlaceholder')}
                onValueChange={handleInputValueChange}
              />
            </div>
            <CommandEmpty>{t('countryInput.noResults')}</CommandEmpty>
            {selectedCountry && (
              <CommandGroup>
                <CommandItem
                  className="flex items-center w-full gap-2 text-muted-foreground"
                  onSelect={() => {
                    setSelectedCountry(undefined);
                    onChange?.(undefined);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-grow w-0 gap-x-2 overflow-hidden">
                    <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full">
                      <Globe size={16} />
                    </div>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {t('countryInput.clearSelection')}
                    </span>
                  </div>
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup>
              {options
                .filter((x) => x.name)
                .map((option) => (
                  <CommandItem
                    className="flex items-center w-full gap-2"
                    key={option.alpha2}
                    onSelect={() => handleSelect(option)}
                  >
                    <div className="flex flex-grow w-0 gap-x-2 overflow-hidden">
                      <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full">
                        <CircleFlag
                          countryCode={option.alpha2.toLowerCase()}
                          height={20}
                        />
                      </div>
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {option.name}
                      </span>
                    </div>
                    <CheckIcon
                      className={cn(
                        'ms-auto h-4 w-4 shrink-0',
                        option.alpha2 === selectedCountry?.alpha2
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

CountryDropdownComponent.displayName = 'CountryDropdownComponent';

export const CountryDropdown = forwardRef(CountryDropdownComponent);
