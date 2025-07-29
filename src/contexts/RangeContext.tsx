import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SimpleActionButton {
  type: 'simple';
  id: string;
  name: string;
  color: string;
}

export interface WeightedActionButton {
  type: 'weighted';
  id: string;
  name: string;
  action1Id: string;
  action2Id:string;
  weight: number; // 0-100 for action1
}

export type ActionButton = SimpleActionButton | WeightedActionButton;


interface Range {
  id: string;
  name: string;
  hands: Record<string, string>;
}

interface Folder {
  id: string;
  name: string;
  ranges: Range[];
}

interface RangeContextType {
  folders: Folder[];
  actionButtons: ActionButton[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  setActionButtons: React.Dispatch<React.SetStateAction<ActionButton[]>>;
}

const RangeContext = createContext<RangeContextType | undefined>(undefined);

export const useRangeContext = () => {
  const context = useContext(RangeContext);
  if (!context) {
    throw new Error('useRangeContext must be used within a RangeProvider');
  }
  return context;
};

export const RangeProvider = ({ children }: { children: ReactNode }) => {
  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('poker-ranges-folders');
    return saved ? JSON.parse(saved) : [{
      id: '1',
      name: 'Folder',
      ranges: [
        {
          id: '1',
          name: 'Range',
          hands: {}
        }
      ]
    }];
  });
  
  const [actionButtons, setActionButtons] = useState<ActionButton[]>(() => {
    const saved = localStorage.getItem('poker-ranges-actions');
    if (saved) {
      // Basic migration: if an old button doesn't have a 'type', assume it's 'simple'
      const parsed = JSON.parse(saved);
      return parsed.map((btn: any) => btn.type ? btn : { ...btn, type: 'simple' });
    }
    return [{ type: 'simple', id: 'raise', name: 'Raise', color: '#8b5cf6' }];
  });

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('poker-ranges-folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('poker-ranges-actions', JSON.stringify(actionButtons));
  }, [actionButtons]);

  return (
    <RangeContext.Provider value={{ folders, actionButtons, setFolders, setActionButtons }}>
      {children}
    </RangeContext.Provider>
  );
};
