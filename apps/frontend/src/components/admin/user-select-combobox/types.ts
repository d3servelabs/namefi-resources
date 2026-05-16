import type { AppRouterOutput } from '@/lib/trpc';

export type UserOption =
  AppRouterOutput['admin']['users']['searchUsersForPicker'][number];

type SharedProps = {
  placeholder?: string;
  disabled?: boolean;
  maxResults?: number;
  excludeUserIds?: string[];
  className?: string;
  id?: string;
  ariaLabel?: string;
};

type SingleProps = SharedProps & {
  mode: 'single';
  value: UserOption | null;
  onChange: (value: UserOption | null) => void;
};

type MultipleProps = SharedProps & {
  mode: 'multiple';
  value: UserOption[];
  onChange: (value: UserOption[]) => void;
  maxSelected?: number;
};

export type UserSelectComboBoxProps = SingleProps | MultipleProps;
