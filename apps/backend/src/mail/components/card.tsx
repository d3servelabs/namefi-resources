// biome-ignore lint/style/useImportType: required for react-email runtime
import React from 'react';
import * as styles from '../styles';

const VARIANT_STYLES = {
  warning: {
    backgroundColor: styles.astraTheme.warningBackground,
    borderColor: styles.astraTheme.warningBorder,
    color: styles.astraTheme.warningInk,
  },
  success: {
    backgroundColor: styles.astraTheme.successBackground,
    borderColor: styles.astraTheme.successBorder,
    color: styles.astraTheme.successInk,
  },
  info: {
    backgroundColor: styles.astraTheme.infoBackground,
    borderColor: styles.astraTheme.infoBorder,
    color: styles.astraTheme.infoInk,
  },
  error: {
    backgroundColor: styles.astraTheme.errorBackground,
    borderColor: styles.astraTheme.errorBorder,
    color: styles.astraTheme.errorInk,
  },
};

export const Card = ({
  variant = 'warning',
  children,
  style,
}: {
  variant?: 'warning' | 'success' | 'info' | 'error';
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => {
  return (
    <div
      style={{
        ...styles.text,
        marginTop: '20px',
        marginBottom: '20px',
        padding: '16px 18px',
        backgroundColor: VARIANT_STYLES[variant].backgroundColor,
        border: `1px solid ${VARIANT_STYLES[variant].borderColor}`,
        borderRadius: '12px',
        boxShadow: `0 2px 12px ${styles.astraTheme.shadowSoft}`,
        color: VARIANT_STYLES[variant].color,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
