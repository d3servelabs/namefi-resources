import { describe, expect, it } from 'vitest';
import {
  formatCompactUserDropdownAccountLabel,
  formatDefaultUserDropdownAccountLabel,
  shouldShowUserDropdownLoading,
} from './user-dropdown-state';

describe('shouldShowUserDropdownLoading', () => {
  it('keeps an authenticated trigger in loading while display identity is still pending', () => {
    expect(
      shouldShowUserDropdownLoading({
        hasDisplayName: false,
        isAuthenticated: true,
        isDbUserLoading: false,
        isPrivyUserLoading: true,
      }),
    ).toBe(true);
  });

  it('lets the authenticated trigger render once a safe display value is available', () => {
    expect(
      shouldShowUserDropdownLoading({
        hasDisplayName: true,
        isAuthenticated: true,
        isDbUserLoading: false,
        isPrivyUserLoading: true,
      }),
    ).toBe(false);
  });

  it('lets the authenticated account menu stay usable when no display value can load', () => {
    expect(
      shouldShowUserDropdownLoading({
        hasDisplayName: false,
        isAuthenticated: true,
        isDbUserLoading: false,
        isPrivyUserLoading: false,
      }),
    ).toBe(false);
  });

  it('keeps the normal auth loading state unchanged', () => {
    expect(
      shouldShowUserDropdownLoading({
        hasDisplayName: false,
        isAuthenticated: false,
        isDbUserLoading: true,
        isPrivyUserLoading: false,
      }),
    ).toBe(true);
  });
});

describe('formatCompactUserDropdownAccountLabel', () => {
  it('shows compact person names as first name and last initial', () => {
    expect(formatCompactUserDropdownAccountLabel('Ada Lovelace')).toBe(
      'Ada L.',
    );
    expect(formatCompactUserDropdownAccountLabel('Mary Jane Watson')).toBe(
      'Mary W.',
    );
  });

  it('shortens long first names to six characters plus ellipsis', () => {
    expect(formatCompactUserDropdownAccountLabel('Alexander Hamilton')).toBe(
      'Alexan...',
    );
    expect(formatCompactUserDropdownAccountLabel('Zachary')).toBe('Zachar...');
  });

  it('keeps non-name account identifiers on the existing safe shortener', () => {
    expect(formatCompactUserDropdownAccountLabel('dev-team@d3serve.xyz')).toBe(
      'dev-t...e.xyz',
    );
    expect(
      formatCompactUserDropdownAccountLabel(
        '0x1234567890abcdef1234567890abcdef',
      ),
    ).toBe('0x123...bcdef');
  });
});

describe('formatDefaultUserDropdownAccountLabel', () => {
  it('preserves the existing fixed cap for non-compact dropdown labels', () => {
    expect(formatDefaultUserDropdownAccountLabel('Alexander Hamilton')).toBe(
      'Alexa...ilton',
    );
    expect(formatDefaultUserDropdownAccountLabel('dev-team@d3serve.xyz')).toBe(
      'dev-t...e.xyz',
    );
  });
});
