import {
  type ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';

export interface IConstantsContext {
  client: boolean;
}

export const ConstantsContext = createContext<IConstantsContext>({
  client: typeof window !== 'undefined',
});

export function ConstantsProvider({ children }: { children: ReactNode }) {
  const [client] = useState(typeof window !== 'undefined');

  const contextValue = useMemo((): IConstantsContext => ({ client }), [client]);

  return (
    <ConstantsContext.Provider value={contextValue}>
      {children}
    </ConstantsContext.Provider>
  );
}

export const useConstants = () => useContext(ConstantsContext);
