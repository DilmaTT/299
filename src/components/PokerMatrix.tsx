import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { ActionButton } from "@/contexts/RangeContext";

// Poker hand matrix data
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

const HANDS = [];
for (let i = 0; i < RANKS.length; i++) {
  const row = [];
  for (let j = 0; j < RANKS.length; j++) {
    const rank1 = RANKS[i];
    const rank2 = RANKS[j];

    if (i === j) {
      // Diagonal: Pairs
      row.push(`${rank1}${rank1}`);
    } else if (i < j) {
      // Upper triangle: Suited hands (e.g., AKs, AQs)
      row.push(`${rank1}${rank2}s`);
    } else {
      // Lower triangle: Offsuit hands (e.g., AKo, AQo)
      row.push(`${rank2}${rank1}o`); // Note: rank2 then rank1 for offsuit to maintain standard naming (e.g., AKo not KAo)
    }
  }
  HANDS.push(row);
}

interface PokerMatrixProps {
  selectedHands: Record<string, string>;
  onHandSelect: (hand: string, mode: 'select' | 'deselect') => void;
  activeAction: string;
  actionButtons: ActionButton[];
  readOnly?: boolean;
  isBackgroundMode?: boolean; // New prop
}

const getActionColor = (actionId: string, buttons: ActionButton[]): string => {
  if (actionId === 'fold') {
    return '#6b7280'; // Muted gray for Fold
  }
  const button = buttons.find(b => b.id === actionId);
  if (button && button.type === 'simple') {
    return button.color;
  }
  // Fallback for weighted buttons or if not found (should not happen in weighted context)
  return '#ffffff'; 
};

export const PokerMatrix = ({ selectedHands, onHandSelect, activeAction, actionButtons, readOnly = false, isBackgroundMode = false }: PokerMatrixProps) => {
  const isMobile = useIsMobile();
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect' | null>(null);
  const lastHandEnteredRef = useRef<string | null>(null);
  const wasDragged = useRef(false);
  const lastHandSelectedDuringDrag = useRef<string | null>(null);
  // Initialize zoomLevel to 0.85 (15% reduction) for desktop, 1 for mobile
  const [zoomLevel, setZoomLevel] = useState<number>(isMobile ? 1 : 0.85);

  // If in background mode, disable dragging and force readOnly
  useEffect(() => {
    if (isBackgroundMode) {
      setIsDragging(false);
      setDragMode(null);
    }
  }, [isBackgroundMode]);

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragMode(null);
    lastHandEnteredRef.current = null;
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchend', handleDragEnd);
    window.addEventListener('touchcancel', handleDragEnd);

    return () => {
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
    };
  }, []);

  const handlePointerDown = (hand: string) => {
    if (readOnly || isBackgroundMode) return;
    wasDragged.current = false;
    lastHandSelectedDuringDrag.current = null;
    setIsDragging(true);
    lastHandEnteredRef.current = hand;

    const currentHandAction = selectedHands[hand];
    const mode = currentHandAction === activeAction ? 'deselect' : 'select';
    setDragMode(mode);
  };

  const handlePointerEnter = (hand: string) => {
    if (readOnly || isBackgroundMode || !isDragging || !dragMode) return;
    
    wasDragged.current = true;
    
    if (lastHandSelectedDuringDrag.current !== hand) {
      onHandSelect(hand, dragMode);
      lastHandSelectedDuringDrag.current = hand;
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || isBackgroundMode) return;
    event.preventDefault(); // Prevent scrolling while dragging
    
    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element instanceof HTMLElement && element.dataset.hand) {
      const hand = element.dataset.hand;
      wasDragged.current = true; // Mark as dragged on any move
      handlePointerEnter(hand);
    }
  };

  const handleClick = (hand: string) => {
    if (readOnly || isBackgroundMode) return;
    if (wasDragged.current) return; // Don't fire click after a drag

    const currentHandAction = selectedHands[hand];
    const mode = currentHandAction === activeAction ? 'deselect' : 'select';
    onHandSelect(hand, mode);
  };

  const getHandStyle = (hand: string) => {
    const actionId = selectedHands[hand];
    if (!actionId) return {};

    const action = actionButtons.find(b => b.id === actionId);
    if (!action) return {};

    if (action.type === 'simple') {
      return { backgroundColor: action.color, color: 'white' };
    }

    if (action.type === 'weighted') {
      const color1 = getActionColor(action.action1Id, actionButtons);
      const color2 = getActionColor(action.action2Id, actionButtons);
      const weight1 = action.weight;
      
      return {
        background: `linear-gradient(to right, ${color1} ${weight1}%, ${color2} ${weight1}%)`,
        color: 'white',
        border: 'none' // Remove border for gradient buttons for a cleaner look
      };
    }

    return {};
  };

  const getHandColorClass = (hand: string) => {
    const actionId = selectedHands[hand];
    if (!actionId) {
      return 'bg-muted/50 text-muted-foreground hover:bg-muted/70';
    }
    // If an action is assigned, we let getHandStyle handle the colors
    // and return an empty class string to avoid conflicts.
    return '';
  };

  // Adjust parentContainerClasses based on isBackgroundMode
  const parentContainerClasses = cn(
    "space-y-4",
    isBackgroundMode ? "w-full h-full flex items-center justify-center" : (isMobile ? "w-full !px-0" : "w-[120%]")
  );
  
  // Adjust gridClasses for background mode to ensure it scales within its parent
  const gridClasses = cn(
    "grid grid-cols-13 aspect-square w-full select-none rounded-lg",
    isBackgroundMode ? "gap-0.5" : (isMobile ? "gap-0.5 sm:gap-1" : "gap-2 p-6 border"), // Removed p-6 border for background mode
    isBackgroundMode ? "max-w-full max-h-full" : "" // Ensure it fits within parent
  );
  
  const buttonClasses = cn(
    "w-full h-full aspect-square font-mono border transition-all duration-200",
    "hover:ring-2 hover:ring-ring",
    "rounded-sm md:rounded-md",
    isMobile ? "text-[clamp(0.625rem,1.5vw,0.875rem)] p-0" : "text-[clamp(0.75rem,1.8vw,1.05rem)] p-1"
  );

  const matrixContent = (
    <div
      className={gridClasses}
      onTouchMove={handleTouchMove}
    >
      {HANDS.map((row, rowIndex) => 
        row.map((hand, colIndex) => (
          <Button
            key={`${rowIndex}-${colIndex}`}
            data-hand={hand}
            variant="outline"
            size="sm"
            className={cn(
              buttonClasses,
              getHandColorClass(hand)
            )}
            style={getHandStyle(hand)}
            onClick={() => handleClick(hand)}
            onMouseDown={() => handlePointerDown(hand)}
            onMouseEnter={() => handlePointerEnter(hand)}
            onTouchStart={() => handlePointerDown(hand)}
            // The disabled attribute is removed to prevent dimming
          >
            {hand}
          </Button>
        ))
      )}
    </div>
  );

  return (
    <div className={parentContainerClasses}>
      {isMobile || isBackgroundMode ? ( // Render directly for mobile or background mode
        matrixContent
      ) : (
        // Desktop: Render with scale wrapper and zoom buttons
        <div
          className="relative w-full"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
        >
          {matrixContent}
          <div className="absolute -bottom-6 left-0 flex gap-1">
            <Button variant="outline" size="sm" className="h-5 w-10 text-xs" onClick={() => setZoomLevel(0.85)}>x1</Button>
            <Button variant="outline" size="sm" className="h-5 w-10 text-xs" onClick={() => setZoomLevel(1.0)}>x1.2</Button>
            <Button variant="outline" size="sm" className="h-5 w-10 text-xs" onClick={() => setZoomLevel(1.2)}>x1.5</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to get the number of combinations for a given hand type
export const getCombinations = (hand: string): number => {
  if (hand.length === 2 && hand[0] === hand[1]) { // Pair, e.g., 'AA'
    return 6;
  }
  if (hand.endsWith('s')) { // Suited, e.g., 'AKs'
    return 4;
  }
  if (hand.endsWith('o')) { // Offsuit, e.g., 'AKo'
    return 12;
  }
  return 0; // Should not happen for valid poker hands
};

// Calculate total possible combinations (1326)
export const TOTAL_POKER_COMBINATIONS = HANDS.flat().reduce((sum, hand) => sum + getCombinations(hand), 0);
