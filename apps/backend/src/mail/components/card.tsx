// biome-ignore lint/style/useImportType: required for react-email runtime
import React from 'react';
import * as styles from '../styles';

const BACKGROUND_COLORS = {
  warning: '#FFF4E5',
  success: '#E6F9EB',
  info: '#f0f9ff',
  error: '#FFF4E5',
};

const BORDER_COLORS = {
  warning: '#FFA500',
  success: '#00C853',
  info: '#0084d1',
  error: '#FFA500',
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
        padding: '16px',
        backgroundColor: BACKGROUND_COLORS[variant],
        border: `1px solid ${BORDER_COLORS[variant]}`,
        borderRadius: '8px',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
