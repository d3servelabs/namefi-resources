export function shouldShowUserDropdownLoading({
  hasDisplayName,
  isAuthenticated,
  isDbUserLoading,
  isPrivyUserLoading,
}: {
  hasDisplayName: boolean;
  isAuthenticated: boolean;
  isDbUserLoading: boolean;
  isPrivyUserLoading: boolean;
}) {
  return (
    isDbUserLoading ||
    (isAuthenticated && !hasDisplayName && isPrivyUserLoading)
  );
}
