import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type BreadcrumbItem = {
  href?: string;
  label: string;
};

export interface IBreadcrumbsContext {
  items: BreadcrumbItem[];
  setItems: (items: BreadcrumbItem[]) => void;
  beforeContent: ReactNode;
  setBeforeContent: (content: ReactNode) => void;
  afterContent: ReactNode;
  setAfterContent: (content: ReactNode) => void;
}

export interface IBreadcrumbsProvider {
  value?: {
    items?: BreadcrumbItem[];
    beforeContent?: ReactNode;
    afterContent?: ReactNode;
  };
  children: ReactNode;
}

export const BreadcrumbsContext = createContext<IBreadcrumbsContext>({
  items: [],
  setItems: () => {},
  beforeContent: null,
  setBeforeContent: () => {},
  afterContent: null,
  setAfterContent: () => {},
});

export function BreadcrumbsProvider({
  value,
  children,
}: Readonly<IBreadcrumbsProvider>) {
  const [items, setItems] = useState<BreadcrumbItem[]>(value?.items ?? []);
  const [beforeContent, setBeforeContent] = useState<ReactNode>(
    value?.beforeContent ?? null,
  );
  const [afterContent, setAfterContent] = useState<ReactNode>(
    value?.afterContent ?? null,
  );

  const contextValue = useMemo(
    (): IBreadcrumbsContext => ({
      items,
      setItems,
      beforeContent,
      setBeforeContent,
      afterContent,
      setAfterContent,
    }),
    [items, beforeContent, afterContent],
  );

  return (
    <BreadcrumbsContext.Provider value={contextValue}>
      {children}
    </BreadcrumbsContext.Provider>
  );
}

export const useBreadcrumbs = () => useContext(BreadcrumbsContext);

export const usePageBreadcrumbs = (items: BreadcrumbItem[]) => {
  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    setItems(items);
  }, [items, setItems]);
};
