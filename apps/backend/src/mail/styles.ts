import type { CSSProperties } from 'react';

export const main: CSSProperties = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

export const container: CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '1200px',
  minWidth: '320px',
};

export const box: CSSProperties = {
  padding: '0 48px',
};

export const hr: CSSProperties = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

export const text: CSSProperties = {
  color: '#525f7f',
  fontSize: '16px',
};

export const paragraph: CSSProperties = {
  lineHeight: '24px',
  textAlign: 'left',
  ...text,
};

export const anchor: CSSProperties = {
  color: '#109485',
};

export const button: CSSProperties = {
  backgroundColor: '#14b8a6',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'block',
  width: '100%',
  marginTop: '5px',
  marginBottom: '5px',
  paddingTop: '10px',
  paddingBottom: '10px',
};

export const footer: CSSProperties = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};
