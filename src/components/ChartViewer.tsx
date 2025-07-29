import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StoredChart, ChartButton } from "./Chart";
import { Range, ActionButton as ActionButtonType } from "@/contexts/RangeContext";
import { PokerMatrix } from "@/components/PokerMatrix";
import { useRangeContext } from "@/contexts/RangeContext";

// Helper function to get the color for a simple action
const getActionColor = (actionId: string, allButtons: ActionButtonType[]): string => {
  if (actionId === 'fold') return '#6b7280';
  const button = allButtons.find(b => b.id === actionId);
  if (button && button.type === 'simple') {
    return button.color;
  }
  return '#ffffff'; // Fallback color
};

// Helper function to get the style for any action button (simple or weighted)
const getActionButtonStyle = (button: ActionButtonType, allButtons: ActionButtonType[]) => {
  if (button.type === 'simple') {
    return { backgroundColor: button.color };
  }
  if (button.type === 'weighted') {
    const color1 = getActionColor(button.action1Id, allButtons);
    const color2 = getActionColor(button.action2Id, allButtons);
    return {
      background: `linear-gradient(to right, ${color1} ${button.weight}%, ${color2} ${button.weight}%)`,
    };
  }
  return {};
};

// Legend Component
const Legend = ({
  usedActions,
  allActionButtons,
  legendOverrides,
}: {
  usedActions: ActionButtonType[];
  allActionButtons: ActionButtonType[];
  legendOverrides?: Record<string, string>;
}) => {
  if (usedActions.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
      {usedActions.map(action => (
        <div key={action.id} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-sm border"
            style={getActionButtonStyle(action, allActionButtons)}
          />
          <span className="text-sm font-medium">
            {legendOverrides?.[action.id] || action.name}
          </span>
        </div>
      ))}
    </div>
  );
};


interface ChartViewerProps {
  isMobileMode?: boolean;
  chart: StoredChart;
  allRanges: Range[];
  onBackToCharts: () => void;
}

const CustomDialog = ({ isOpen, onClose, children, isMobileMode = false }) => {
    if (!isOpen) return null;

    return (
        <div 
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-black/50",
                isMobileMode ? "p-2" : "p-4"
            )} 
            onClick={onClose}
        >
            <div 
                className={cn(
                    "bg-background rounded-lg shadow-2xl",
                    isMobileMode ? "w-full p-2" : "w-auto p-4"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export const ChartViewer = ({ isMobileMode = false, chart, allRanges, onBackToCharts }: ChartViewerProps) => {
  const { actionButtons } = useRangeContext();
  const [displayedRange, setDisplayedRange] = useState<Range | null>(null);
  const [showMatrixDialog, setShowMatrixDialog] = useState(false);
  const [activeButton, setActiveButton] = useState<ChartButton | null>(null); // State to store the active button
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [dynamicBorderStyle, setDynamicBorderStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };

    if (isMobileMode) {
      handleResize();
      window.addEventListener('resize', handleResize);
    }

    // Universal border style calculation
    try {
      // This code runs on the client, so `window` and `document` are available.
      const bgHslString = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
      if (!bgHslString) return;

      const parts = bgHslString.replace(/%/g, '').split(' ');
      if (parts.length < 3) return;

      const h = parseFloat(parts[0]);
      const s = parseFloat(parts[1]);
      const l = parseFloat(parts[2]);

      if (isNaN(h) || isNaN(s) || isNaN(l)) return;

      // "15% brighter" -> L' = L + (100 - L) * 0.15
      const newL = l + (100 - l) * 0.15;
      const newBorderColor = `hsl(${h} ${s}% ${Math.min(100, newL)}%)`;

      setDynamicBorderStyle({
        borderColor: newBorderColor,
        borderWidth: '1px', // 50% narrower than original 2px
        borderStyle: 'solid'
      });
    } catch (error) {
      console.error("Could not calculate dynamic border color, falling back.", error);
      // Fallback style in case of any error
      setDynamicBorderStyle({
        borderColor: 'hsl(var(--border))',
        borderWidth: '1px',
        borderStyle: 'solid'
      });
    }

    if (isMobileMode) {
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isMobileMode]);

  const handleButtonClick = (button: ChartButton) => {
    if (button.type === 'exit' || button.type === 'label') {
      onBackToCharts(); // Assuming exit is the only non-range action for now
      return;
    }

    const linkedRange = allRanges.find(range => range.id === button.linkedItem);
    if (linkedRange) {
      setDisplayedRange(linkedRange);
      setActiveButton(button); // Store the clicked button
      setShowMatrixDialog(true);
    } else {
      alert("Привязанный диапазон не найден.");
    }
  };
  
  const handleCloseDialog = () => {
    setShowMatrixDialog(false);
    setDisplayedRange(null);
    setActiveButton(null);
  }

  // Determine which actions are used in the currently displayed range
  const usedActions = React.useMemo(() => {
    if (!displayedRange) return [];
    
    const usedActionIds = new Set(Object.values(displayedRange.hands));
    
    return actionButtons.filter(action => usedActionIds.has(action.id));

  }, [displayedRange, actionButtons]);


  const scale = (isMobileMode && viewportSize.width > 0 && chart.canvasWidth > 0)
    ? Math.min(
        (viewportSize.width * 0.95) / chart.canvasWidth,
        (viewportSize.height * 0.95) / chart.canvasHeight
      )
    : 1;

  return (
    <>
      <div className={cn(
        "p-6",
        isMobileMode
          ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-2"
          : "min-h-screen"
      )}>
        <div className={cn(
          isMobileMode ? "w-full h-full flex flex-col items-center justify-center" : "w-full flex justify-center items-start"
        )}>
          <div
            className="relative bg-card flex items-center justify-center overflow-hidden rounded-lg"
            style={{
              width: chart.canvasWidth,
              height: chart.canvasHeight,
              ...dynamicBorderStyle,
              ...(isMobileMode ? {
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
              } : {
                flexShrink: 0,
              })
            }}
          >
            {(!isMobileMode || !showMatrixDialog) && chart.buttons.map((button) => {
              const finalStyle: React.CSSProperties = {
                backgroundColor: button.color,
                position: 'absolute',
                left: button.x,
                top: button.y,
                width: Math.max(5, button.width || 0),
                height: Math.max(5, button.height || 0),
                color: (button.isFontAdaptive === false && button.fontColor) ? button.fontColor : 'white',
              };

              if (button.isFontAdaptive === false && button.fontSize) {
                finalStyle.fontSize = `${button.fontSize}px`;
              }

              return (
                <div
                  key={button.id}
                  style={finalStyle}
                  className={cn(
                    "flex items-center justify-center rounded-md shadow-md font-semibold z-20",
                    button.type !== 'label' && "cursor-pointer hover:opacity-90 transition-opacity"
                  )}
                  onClick={() => handleButtonClick(button)}
                >
                  {button.name}
                </div>
              );
            })}
            {chart.buttons.length === 0 && (!isMobileMode || !showMatrixDialog) && (
              <p className="text-muted-foreground z-10">В этом чарте нет кнопок.</p>
            )}
          </div>
        </div>
      </div>

      <CustomDialog isOpen={showMatrixDialog} onClose={handleCloseDialog} isMobileMode={isMobileMode}>
          {displayedRange && (
            <div>
              <PokerMatrix
                selectedHands={displayedRange.hands}
                onHandSelect={() => {}}
                activeAction=""
                actionButtons={actionButtons}
                readOnly={true}
                isBackgroundMode={false}
              />
              {activeButton?.showLegend && (
                <Legend
                  usedActions={usedActions}
                  allActionButtons={actionButtons}
                  legendOverrides={activeButton?.legendOverrides}
                />
              )}
            </div>
          )}
      </CustomDialog>
    </>
  );
};
