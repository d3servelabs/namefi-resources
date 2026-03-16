import type { CSSProperties } from 'react';

export const astraTheme = {
  canvas: '#f2f6fb',
  card: '#ffffff',
  surface: '#f7faff',
  surfaceAlt: '#edf3fb',
  surfaceStripe: '#f8fbff',
  border: '#d3deeb',
  borderStrong: '#c1d0e2',
  textPrimary: '#0f1b2d',
  textSecondary: '#445a74',
  textMuted: '#5f738b',
  textSubtle: '#7a8ca2',
  headerTitle: '#ffffff',
  headerText: '#f3f8ff',
  headerMuted: '#b9cbe2',
  brandPrimary: '#52e3a0',
  brandPrimaryStrong: '#3acd8c',
  brandPrimaryInk: '#052218',
  brandDark: '#081629',
  brandDarkMid: '#10263d',
  brandDarkSoft: '#183650',
  link: '#1f8d62',
  linkUnderline: '#97d9ba',
  warningBackground: '#fff7ee',
  warningBorder: '#e9d2ae',
  warningInk: '#6c4b1f',
  successBackground: '#ecf8f1',
  successBorder: '#9ed5b9',
  successInk: '#1f5a3f',
  infoBackground: '#eef8f5',
  infoBorder: '#bfded2',
  infoInk: '#1d4f42',
  errorBackground: '#fff0f2',
  errorBorder: '#efb3bd',
  errorInk: '#7a2330',
  codeBackground: '#eaf5f0',
  codeText: '#1f5948',
  shadowSoft: 'rgba(8, 22, 41, 0.06)',
} as const;

export const typeScale = {
  xs: '12px',
  sm: '14px',
  md: '16px',
  lg: '20px',
  xl: '22px',
} as const;

export const lineHeights = {
  xs: '18px',
  sm: '22px',
  md: '24px',
  lg: '28px',
  xl: '30px',
} as const;

export const main: CSSProperties = {
  backgroundColor: astraTheme.canvas,
  fontFamily:
    '"Avenir Next","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
};

export const container: CSSProperties = {
  backgroundColor: astraTheme.card,
  margin: '0 auto',
  padding: '0 0 36px',
  marginBottom: '64px',
  maxWidth: '760px',
  minWidth: '320px',
  border: `1px solid ${astraTheme.border}`,
  borderRadius: '18px',
  overflow: 'hidden',
};

export const box: CSSProperties = {
  padding: '0 36px',
};

export const heading: CSSProperties = {
  color: astraTheme.textPrimary,
  fontSize: typeScale.xl,
  fontWeight: 700,
  lineHeight: lineHeights.xl,
  margin: '0',
};

export const subheading: CSSProperties = {
  color: astraTheme.textPrimary,
  fontSize: typeScale.lg,
  fontWeight: 700,
  lineHeight: lineHeights.lg,
  margin: '0',
};

export const bodySmall: CSSProperties = {
  color: astraTheme.textSecondary,
  fontSize: typeScale.sm,
  lineHeight: lineHeights.sm,
};

export const caption: CSSProperties = {
  color: astraTheme.textSubtle,
  fontSize: typeScale.xs,
  lineHeight: lineHeights.xs,
};

export const headerShell: CSSProperties = {
  backgroundColor: astraTheme.brandDark,
  color: astraTheme.headerTitle,
  margin: '0 0 18px',
  padding: '32px 36px 24px',
  borderBottom: `1px solid ${astraTheme.border}`,
  width: '100%',
};

export const headerLogo: CSSProperties = {
  borderRadius: '16px',
  display: 'block',
  margin: '0',
};

export const headerTitle: CSSProperties = {
  color: astraTheme.headerText,
  fontSize: typeScale.xl,
  fontWeight: 700,
  lineHeight: lineHeights.xl,
  margin: '14px 0 0',
};

export const headerSubtitle: CSSProperties = {
  color: astraTheme.headerMuted,
  fontSize: typeScale.sm,
  lineHeight: lineHeights.sm,
  margin: '8px 0 0',
};

export const hr: CSSProperties = {
  borderColor: astraTheme.border,
  margin: '22px 0',
};

export const text: CSSProperties = {
  color: astraTheme.textSecondary,
  fontSize: typeScale.md,
  lineHeight: lineHeights.md,
};

export const paragraph: CSSProperties = {
  ...text,
  lineHeight: lineHeights.md,
  textAlign: 'left',
};

export const anchor: CSSProperties = {
  color: astraTheme.link,
  fontWeight: 600,
  textDecoration: 'underline',
  textDecorationColor: astraTheme.linkUnderline,
  textUnderlineOffset: '3px',
};

export const button: CSSProperties = {
  backgroundColor: astraTheme.brandPrimary,
  border: `1px solid ${astraTheme.brandPrimaryStrong}`,
  borderRadius: '10px',
  color: astraTheme.brandPrimaryInk,
  display: 'inline-block',
  fontSize: typeScale.md,
  fontWeight: 700,
  letterSpacing: '0.01em',
  lineHeight: lineHeights.sm,
  marginTop: '10px',
  marginBottom: '10px',
  minWidth: '190px',
  padding: '11px 20px',
  textAlign: 'center',
  textDecoration: 'none',
  width: 'auto',
};

export const buttonRowTable: CSSProperties = {
  borderCollapse: 'separate',
  borderSpacing: '0',
  marginLeft: 'auto',
  marginRight: 'auto',
  marginTop: '8px',
  marginBottom: '8px',
  width: 'auto',
};

export const buttonRowCell: CSSProperties = {
  padding: '0 8px 0 0',
  verticalAlign: 'top',
  width: 'auto',
};

export const buttonRowCellLast: CSSProperties = {
  padding: '0 0 0 8px',
  verticalAlign: 'top',
  width: 'auto',
};

export const tableWrap: CSSProperties = {
  border: `1px solid ${astraTheme.borderStrong}`,
  borderRadius: '12px',
  margin: '16px 0',
  overflow: 'hidden',
};

export const table: CSSProperties = {
  ...text,
  borderCollapse: 'collapse',
  margin: '0',
  width: '100%',
};

export const tableHeaderCell: CSSProperties = {
  backgroundColor: astraTheme.surfaceAlt,
  border: `1px solid ${astraTheme.border}`,
  color: astraTheme.textSecondary,
  fontSize: typeScale.xs,
  fontWeight: 700,
  letterSpacing: '0.04em',
  padding: '11px 12px',
  textAlign: 'left',
  textTransform: 'uppercase',
};

export const tableHeaderCellNumeric: CSSProperties = {
  ...tableHeaderCell,
  textAlign: 'right',
};

export const tableCell: CSSProperties = {
  backgroundColor: astraTheme.card,
  border: `1px solid ${astraTheme.border}`,
  color: astraTheme.textPrimary,
  fontSize: typeScale.sm,
  lineHeight: lineHeights.sm,
  padding: '10px 12px',
  textAlign: 'left',
  verticalAlign: 'top',
};

export const tableCellNumeric: CSSProperties = {
  ...tableCell,
  textAlign: 'right',
};

export const tableCellEmphasis: CSSProperties = {
  ...tableCell,
  fontWeight: 600,
};

export const tableCellSubtext: CSSProperties = {
  color: astraTheme.textMuted,
  fontSize: typeScale.xs,
  lineHeight: lineHeights.xs,
  marginTop: '4px',
};

export const sectionHeading: CSSProperties = {
  color: astraTheme.textPrimary,
  fontSize: typeScale.md,
  fontWeight: 700,
  lineHeight: lineHeights.md,
  margin: '22px 0 10px',
};

export const sectionLead: CSSProperties = {
  color: astraTheme.textMuted,
  fontSize: typeScale.sm,
  lineHeight: lineHeights.sm,
  margin: '0 0 12px',
};

export const tag: CSSProperties = {
  backgroundColor: astraTheme.surfaceAlt,
  border: `1px solid ${astraTheme.border}`,
  borderRadius: '999px',
  color: astraTheme.textSecondary,
  display: 'inline-block',
  fontSize: typeScale.xs,
  fontWeight: 700,
  letterSpacing: '0.03em',
  lineHeight: lineHeights.xs,
  padding: '3px 9px',
  textTransform: 'uppercase',
};

export const mutedPanel: CSSProperties = {
  backgroundColor: astraTheme.surface,
  border: `1px solid ${astraTheme.border}`,
  borderRadius: '12px',
  marginTop: '20px',
  padding: '14px 16px',
};

export const mutedText: CSSProperties = {
  color: astraTheme.textMuted,
  fontSize: typeScale.sm,
};

export const monospaceText: CSSProperties = {
  ...text,
  color: astraTheme.textPrimary,
  fontFamily: '"SFMono-Regular",Menlo,Consolas,monospace',
  fontSize: typeScale.sm,
};

export const inlineActionLink: CSSProperties = {
  backgroundColor: astraTheme.brandPrimary,
  borderRadius: '8px',
  color: astraTheme.brandPrimaryInk,
  display: 'inline-block',
  fontSize: typeScale.xs,
  fontWeight: 700,
  lineHeight: lineHeights.xs,
  padding: '7px 11px',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

export const panelTitle: CSSProperties = {
  color: astraTheme.textPrimary,
  fontSize: typeScale.md,
  fontWeight: 700,
  lineHeight: lineHeights.md,
  margin: '0 0 10px',
};

export const panelText: CSSProperties = {
  color: astraTheme.textSecondary,
  fontSize: typeScale.sm,
  lineHeight: lineHeights.sm,
  margin: '0',
};

export const footerIntro: CSSProperties = {
  ...paragraph,
  color: astraTheme.textSecondary,
  marginBottom: '6px',
};

export const footerMeta: CSSProperties = {
  ...paragraph,
  color: astraTheme.textMuted,
  fontSize: typeScale.xs,
  lineHeight: lineHeights.xs,
  marginTop: '12px',
};

export const footerLink: CSSProperties = {
  ...anchor,
  display: 'inline-block',
  fontSize: typeScale.sm,
  marginTop: '6px',
};

export const code: CSSProperties = {
  backgroundColor: astraTheme.codeBackground,
  border: `1px solid ${astraTheme.border}`,
  borderRadius: '6px',
  color: astraTheme.codeText,
  display: 'inline-block',
  fontFamily: '"SFMono-Regular",Menlo,Consolas,monospace',
  fontSize: typeScale.xs,
  fontWeight: 600,
  letterSpacing: '0.01em',
  lineHeight: lineHeights.xs,
  margin: '0 4px',
  padding: '1px 6px',
};

export const footer: CSSProperties = {
  color: astraTheme.textMuted,
  fontSize: typeScale.xs,
  lineHeight: lineHeights.xs,
};
