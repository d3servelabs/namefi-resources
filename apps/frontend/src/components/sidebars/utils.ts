import type { NavItem } from '@/lib/types/nav-item';

export function isRouteActive(item: NavItem, pathname: string): boolean {
  if (item.href === pathname) {
    return true;
  }
  if (item.pattern) {
    return typeof item.pattern === 'string'
      ? pathname.startsWith(item.pattern)
      : item.pattern.test(pathname);
  }
  if (item.href !== '/' && pathname.startsWith(item.href)) {
    return true;
  }
  return (
    item.submenu?.some((subItem) => isRouteActive(subItem, pathname)) ?? false
  );
}
