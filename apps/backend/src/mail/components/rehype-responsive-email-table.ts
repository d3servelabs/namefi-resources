type HastNode = {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function visit(node: HastNode, visitor: (node: HastNode) => void) {
  visitor(node);

  for (const child of node.children ?? []) {
    visit(child, visitor);
  }
}

function isElement(node: HastNode, tagName?: string): boolean {
  return (
    node.type === 'element' &&
    (!tagName || node.tagName?.toLowerCase() === tagName)
  );
}

function getClassNames(node: HastNode): string[] {
  const className = node.properties?.className;

  if (Array.isArray(className)) {
    return className.map(String);
  }

  if (typeof className === 'string') {
    return className.split(/\s+/).filter(Boolean);
  }

  return [];
}

function addClass(node: HastNode, className: string) {
  const classNames = new Set(getClassNames(node));
  classNames.add(className);
  node.properties = {
    ...node.properties,
    className: [...classNames],
  };
}

function getTextContent(node: HastNode): string {
  if (node.type === 'text') {
    return node.value ?? '';
  }

  return (node.children ?? []).map(getTextContent).join('');
}

function getChildElements(node: HastNode, tagName: string): HastNode[] {
  return (node.children ?? []).filter((child) => isElement(child, tagName));
}

function createMobileLabel(label: string): HastNode {
  return {
    type: 'element',
    tagName: 'div',
    properties: {
      className: ['namefi-data-table-mobile-label'],
    },
    children: [
      {
        type: 'text',
        value: label,
      },
    ],
  };
}

function getHeaderLabels(table: HastNode): string[] {
  const thead = getChildElements(table, 'thead')[0];
  const headerRow = thead ? getChildElements(thead, 'tr')[0] : undefined;

  if (!headerRow) {
    return [];
  }

  return (headerRow.children ?? [])
    .filter((child) => isElement(child, 'th') || isElement(child, 'td'))
    .map((cell) => getTextContent(cell).replace(/\s+/g, ' ').trim());
}

export function rehypeResponsiveEmailTable() {
  return (tree: HastNode) => {
    visit(tree, (node) => {
      if (isElement(node, 'div') && node.properties?.id === 'markdown-table') {
        addClass(node, 'namefi-table-wrap');
      }

      if (!isElement(node, 'table')) {
        return;
      }

      addClass(node, 'namefi-data-table');

      const headers = getHeaderLabels(node);
      const thead = getChildElements(node, 'thead')[0];
      const tbody = getChildElements(node, 'tbody')[0];

      for (const row of getChildElements(thead ?? { children: [] }, 'tr')) {
        for (const cell of row.children ?? []) {
          if (isElement(cell, 'th')) {
            addClass(cell, 'namefi-data-table-header-cell');
          }
        }
      }

      for (const row of getChildElements(tbody ?? { children: [] }, 'tr')) {
        addClass(row, 'namefi-data-table-row');

        row.children = (row.children ?? []).map((cell, index) => {
          if (!isElement(cell, 'td')) {
            return cell;
          }

          addClass(cell, 'namefi-data-table-cell');

          if (cell.properties?.align === 'right') {
            addClass(cell, 'namefi-data-table-cell-numeric');
          }

          const label = headers[index];
          const hasMobileLabel = (cell.children ?? []).some(
            (child) =>
              isElement(child, 'div') &&
              getClassNames(child).includes('namefi-data-table-mobile-label'),
          );

          if (label && !hasMobileLabel) {
            cell.children = [
              createMobileLabel(label),
              ...(cell.children ?? []),
            ];
          }

          return cell;
        });
      }
    });
  };
}
