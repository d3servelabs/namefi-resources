import { describe, expect, it } from 'vitest';
import { shouldShowUserDropdownLoading } from './user-dropdown-state';

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
