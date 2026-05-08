import type { CSSProperties } from 'react';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { astraTheme } from '../styles';

export type EmailActionIconType =
  | 'cart'
  | 'dashboard'
  | 'register'
  | 'search'
  | 'settings';

type EmailActionIconProps = {
  color?: string;
  icon: EmailActionIconType;
  size?: number;
  style?: CSSProperties;
};

type EmailButtonIconProps = EmailActionIconProps;

type EmailIconButtonProps = {
  className?: string;
  href: string;
  icon: EmailActionIconType;
  iconColor?: string;
  iconSize?: number;
  label: string;
  style?: CSSProperties;
};

const baseIconStyle = {
  display: 'inline-block',
  lineHeight: 0,
  verticalAlign: 'middle',
} satisfies CSSProperties;

const buttonIconStyle = {
  ...baseIconStyle,
  marginRight: '8px',
} satisfies CSSProperties;

const iconButtonStyle = {
  backgroundColor: astraTheme.brandPrimary,
  border: `1px solid ${astraTheme.brandPrimaryStrong}`,
  borderRadius: '8px',
  color: astraTheme.brandPrimaryInk,
  display: 'inline-block',
  height: '38px',
  lineHeight: '38px',
  padding: '0',
  textAlign: 'center',
  textDecoration: 'none',
  width: '38px',
} satisfies CSSProperties;

function getRenderedIcon(icon: EmailActionIconType) {
  // Registration CTAs reuse the cart glyph because registration starts in cart.
  return icon === 'register' ? 'cart' : icon;
}

export function EmailActionIcon({
  color = astraTheme.brandPrimaryInk,
  icon,
  size = 18,
  style,
}: EmailActionIconProps) {
  const iconStyle = { ...baseIconStyle, ...style };
  const renderedIcon = getRenderedIcon(icon);

  if (renderedIcon === 'settings') {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        height={size}
        style={iconStyle}
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (renderedIcon === 'dashboard') {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        height={size}
        style={iconStyle}
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          height="7"
          rx="1.5"
          stroke={color}
          strokeWidth="2"
          width="7"
          x="3"
          y="3"
        />
        <rect
          height="7"
          rx="1.5"
          stroke={color}
          strokeWidth="2"
          width="7"
          x="14"
          y="3"
        />
        <rect
          height="7"
          rx="1.5"
          stroke={color}
          strokeWidth="2"
          width="7"
          x="3"
          y="14"
        />
        <rect
          height="7"
          rx="1.5"
          stroke={color}
          strokeWidth="2"
          width="7"
          x="14"
          y="14"
        />
      </svg>
    );
  }

  if (renderedIcon === 'search') {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        height={size}
        style={iconStyle}
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
        <path
          d="M20 20L16.5 16.5"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      style={iconStyle}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="9" cy="21" r="1" stroke={color} strokeWidth="2" />
      <circle cx="20" cy="21" r="1" stroke={color} strokeWidth="2" />
      <path
        d="M1 1h4l2.68 13.39A2 2 0 0 0 9.64 16h9.72a2 2 0 0 0 1.96-1.61L23 6H6"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function EmailButtonIcon({ style, ...props }: EmailButtonIconProps) {
  return (
    <EmailActionIcon
      {...props}
      style={{
        ...buttonIconStyle,
        ...style,
      }}
    />
  );
}

export function EmailIconButton({
  className,
  href,
  icon,
  iconColor = astraTheme.brandPrimaryInk,
  iconSize = 20,
  label,
  style,
}: EmailIconButtonProps) {
  return (
    <a
      aria-label={label}
      className={className}
      href={href}
      style={{ ...iconButtonStyle, ...style }}
      title={label}
    >
      <EmailActionIcon
        color={iconColor}
        icon={icon}
        size={iconSize}
        style={{ marginRight: 0 }}
      />
    </a>
  );
}
