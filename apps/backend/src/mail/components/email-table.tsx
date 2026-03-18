// biome-ignore lint/style/useImportType: required for react-email runtime
import React from 'react';
import * as styles from '../styles';

export function EmailTable({
  children,
  tableStyle,
  wrapStyle,
}: {
  children: React.ReactNode;
  tableStyle?: React.CSSProperties;
  wrapStyle?: React.CSSProperties;
}) {
  return (
    <div
      className="namefi-table-wrap"
      style={{ ...styles.tableWrap, ...wrapStyle }}
    >
      <table
        className="namefi-data-table"
        style={{ ...styles.table, ...tableStyle }}
      >
        {children}
      </table>
    </div>
  );
}

export function EmailTableRow({ children }: { children: React.ReactNode }) {
  return <tr className="namefi-data-table-row">{children}</tr>;
}

export function EmailTableHeaderCell({
  children,
  numeric = false,
  style,
}: {
  children: React.ReactNode;
  numeric?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <th
      className={
        numeric
          ? 'namefi-data-table-header-cell namefi-data-table-header-cell-numeric'
          : 'namefi-data-table-header-cell'
      }
      style={{
        ...(numeric ? styles.tableHeaderCellNumeric : styles.tableHeaderCell),
        ...style,
      }}
    >
      {children}
    </th>
  );
}

export function EmailTableCell({
  children,
  label,
  numeric = false,
  emphasis = false,
  hideOnMobile = false,
  style,
}: {
  children?: React.ReactNode;
  label?: string;
  numeric?: boolean;
  emphasis?: boolean;
  hideOnMobile?: boolean;
  style?: React.CSSProperties;
}) {
  const className = [
    'namefi-data-table-cell',
    numeric ? 'namefi-data-table-cell-numeric' : null,
    hideOnMobile ? 'namefi-data-table-cell-hidden-mobile' : null,
  ]
    .filter(Boolean)
    .join(' ');
  const cellStyle: React.CSSProperties = {
    ...styles.tableCell,
    ...(numeric ? { textAlign: styles.tableCellNumeric.textAlign } : {}),
    ...(emphasis ? { fontWeight: styles.tableCellEmphasis.fontWeight } : {}),
    ...style,
  };

  return (
    <td className={className} style={cellStyle}>
      {label ? (
        <div
          className="namefi-data-table-mobile-label"
          style={styles.tableMobileLabel}
        >
          {label}
        </div>
      ) : null}
      <div className="namefi-data-table-value">{children}</div>
    </td>
  );
}
