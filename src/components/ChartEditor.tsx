import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Settings, Expand } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRangeContext } from "@/contexts/RangeContext";
import { StoredChart, ChartButton } from "./Chart"; // Import interfaces
import { ActionButton as ActionButtonType } from "@/contexts/RangeContext";
import { PokerMatrix } from "@/components/PokerMatrix";

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

interface ChartEditorProps {
  isMobileMode?: boolean;
  chart: StoredChart; // Now receives full chart object
  onBackToCharts: () => void;
  onSaveChart: (updatedChart: StoredChart) => void; // Changed to save full chart
}

export const ChartEditor = ({ isMobileMode = false, chart, onBackToCharts, onSaveChart }: ChartEditorProps) => {
  const { folders, actionButtons } = useRangeContext();
  const allRanges = folders.flatMap(folder => folder.ranges);

  const [chartName, setChartName] = useState(chart.name);
  const [buttons, setButtons] = useState<ChartButton[]>(chart.buttons); // Initialize buttons from chart prop
  const [canvasWidth, setCanvasWidth] = useState(chart.canvasWidth || 800); // Initialize from chart or default
  const [canvasHeight, setCanvasHeight] = useState(chart.canvasHeight || 500); // Initialize from chart or default
  const [isButtonModalOpen, setIsButtonModalOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<ChartButton | null>(null);
  const [isLegendPreviewOpen, setIsLegendPreviewOpen] = useState(false);
  const [tempLegendOverrides, setTempLegendOverrides] = useState<Record<string, string>>({});

  // Drag & Resize states
  const [activeButtonId, setActiveButtonId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const MIN_CANVAS_DIMENSION = 100;
  const MIN_BUTTON_DIMENSION = 5;

  // Update chartName, buttons, and canvas dimensions if chart prop changes (e.g., if a different chart is selected)
  useEffect(() => {
    setChartName(chart.name);
    setButtons(chart.buttons);
    setCanvasWidth(chart.canvasWidth || 800);
    setCanvasHeight(chart.canvasHeight || 500);
  }, [chart]);

  // Effect to reposition buttons when canvas dimensions change
  useEffect(() => {
    setButtons(prevButtons => {
      let changed = false;
      const updatedButtons = prevButtons.map(button => {
        let newX = button.x;
        let newY = button.y;
        let newWidth = button.width;
        let newHeight = button.height;

        // Ensure width/height are at least MIN_BUTTON_DIMENSION
        newWidth = Math.max(MIN_BUTTON_DIMENSION, newWidth);
        newHeight = Math.max(MIN_BUTTON_DIMENSION, newHeight);

        // Clamp X and Y to ensure button starts within canvas
        newX = Math.max(0, Math.min(newX, canvasWidth - newWidth));
        newY = Math.max(0, Math.min(newY, canvasHeight - newHeight));

        // Clamp width and height to ensure button ends within canvas
        newWidth = Math.min(newWidth, canvasWidth - newX);
        newHeight = Math.min(newHeight, canvasHeight - newY);

        if (newX !== button.x || newY !== button.y || newWidth !== button.width || newHeight !== button.height) {
          changed = true;
          return { ...button, x: newX, y: newY, width: newWidth, height: newHeight };
        }
        return button;
      });

      if (changed) {
        return updatedButtons;
      }
      return prevButtons; // No change, return original array to prevent unnecessary re-renders
    });
  }, [canvasWidth, canvasHeight]);

  const handleAddButton = () => {
    const newButton: ChartButton = {
      id: String(Date.now()),
      name: "Новая кнопка",
      color: "#60A5FA",
      linkedItem: allRanges.length > 0 ? allRanges[0].id : "label-only", // Default to label if no ranges
      x: 50,
      y: 50,
      width: 120, // Default width
      height: 40, // Default height
      type: allRanges.length > 0 ? 'normal' : 'label', // Default type
      isFontAdaptive: true,
      fontSize: 16,
      fontColor: 'white',
      showLegend: false,
      legendOverrides: {},
    };
    setButtons((prev) => [...prev, newButton]);
    setEditingButton(newButton);
    setIsButtonModalOpen(true);
  };

  const handleSettingsClick = (e: React.MouseEvent, button: ChartButton) => {
    e.stopPropagation(); // Prevent drag/resize from starting
    setEditingButton(button);
    setIsButtonModalOpen(true);
  };

  const handleSaveButtonProperties = () => {
    if (editingButton) {
      setButtons((prev) =>
        prev.map((btn) => (btn.id === editingButton.id ? editingButton : btn))
      );
      setIsButtonModalOpen(false);
      setEditingButton(null);
    }
  };

  const handleCancelButtonProperties = () => {
    // If the button was just added and not saved, remove it from the list
    if (editingButton && !chart.buttons.some(b => b.id === editingButton.id)) {
        setButtons(prevButtons => prevButtons.filter(b => b.id !== editingButton.id));
    }
    setIsButtonModalOpen(false);
    setEditingButton(null);
  };

  // --- Drag & Resize Logic ---

  const getResizeDirection = useCallback((e: React.MouseEvent | React.TouchEvent, button: ChartButton) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const coords = (e as React.TouchEvent).touches?.[0] || (e as React.MouseEvent);
    const x = coords.clientX - rect.left;
    const y = coords.clientY - rect.top;
    const tolerance = 8; // Pixels from edge to detect resize

    let direction = null;
    if (x < tolerance && y < tolerance) direction = 'nw';
    else if (x > rect.width - tolerance && y < tolerance) direction = 'ne';
    else if (x < tolerance && y > rect.height - tolerance) direction = 'sw';
    else if (x > rect.width - tolerance && y > rect.height - tolerance) direction = 'se';
    else if (x < tolerance) direction = 'w';
    else if (x > rect.width - tolerance) direction = 'e';
    else if (y < tolerance) direction = 'n';
    else if (y > rect.height - tolerance) direction = 's';
    return direction;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, button: ChartButton) => {
    // Only start drag/resize if not clicking the settings icon
    if ((e.target as HTMLElement).closest('.settings-icon')) {
      return;
    }

    e.stopPropagation(); // Prevent button click from opening modal immediately
    setActiveButtonId(button.id);

    const direction = getResizeDirection(e, button);
    if (direction) {
      setIsResizing(true);
      setResizeDirection(direction);
    } else {
      setIsDragging(true);
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); // Use currentTarget for the button itself
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [getResizeDirection]);

  const handleTouchStart = useCallback((e: React.TouchEvent, button: ChartButton) => {
    if ((e.target as HTMLElement).closest('.settings-icon')) {
      return;
    }
    e.stopPropagation();
    setActiveButtonId(button.id);

    const direction = getResizeDirection(e, button);
    if (direction) {
      setIsResizing(true);
      setResizeDirection(direction);
    } else {
      setIsDragging(true);
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const touch = e.touches[0];
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
  }, [getResizeDirection]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeButtonId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const currentButton = buttons.find(b => b.id === activeButtonId);
    if (!currentButton) return;

    if (isDragging) {
      let newX = e.clientX - dragOffset.x - canvasRect.left;
      let newY = e.clientY - dragOffset.y - canvasRect.top;

      // Boundary checks for dragging
      newX = Math.max(0, Math.min(newX, canvasRect.width - currentButton.width));
      newY = Math.max(0, Math.min(newY, canvasRect.height - currentButton.height));

      setButtons((prev) =>
        prev.map((btn) =>
          btn.id === activeButtonId ? { ...btn, x: newX, y: newY } : btn
        )
      );
    } else if (isResizing && resizeDirection) {
      let newWidth = currentButton.width;
      let newHeight = currentButton.height;
      let newX = currentButton.x;
      let newY = currentButton.y;

      switch (resizeDirection) {
        case 'e':
          newWidth = Math.max(MIN_BUTTON_DIMENSION, e.clientX - (currentButton.x + canvasRect.left));
          break;
        case 's':
          newHeight = Math.max(MIN_BUTTON_DIMENSION, e.clientY - (currentButton.y + canvasRect.top));
          break;
        case 'w':
          const diffX = e.clientX - (currentButton.x + canvasRect.left);
          newWidth = Math.max(MIN_BUTTON_DIMENSION, currentButton.width - diffX);
          newX = currentButton.x + diffX;
          break;
        case 'n':
          const diffY = e.clientY - (currentButton.y + canvasRect.top);
          newHeight = Math.max(MIN_BUTTON_DIMENSION, currentButton.height - diffY);
          newY = currentButton.y + diffY;
          break;
        case 'se':
          newWidth = Math.max(MIN_BUTTON_DIMENSION, e.clientX - (currentButton.x + canvasRect.left));
          newHeight = Math.max(MIN_BUTTON_DIMENSION, e.clientY - (currentButton.y + canvasRect.top));
          break;
        case 'sw':
          const diffX_sw = e.clientX - (currentButton.x + canvasRect.left);
          newWidth = Math.max(MIN_BUTTON_DIMENSION, currentButton.width - diffX_sw);
          newX = currentButton.x + diffX_sw;
          newHeight = Math.max(MIN_BUTTON_DIMENSION, e.clientY - (currentButton.y + canvasRect.top));
          break;
        case 'ne':
          newWidth = Math.max(MIN_BUTTON_DIMENSION, e.clientX - (currentButton.x + canvasRect.left));
          const diffY_ne = e.clientY - (currentButton.y + canvasRect.top);
          newHeight = Math.max(MIN_BUTTON_DIMENSION, currentButton.height - diffY_ne);
          newY = currentButton.y + diffY_ne;
          break;
        case 'nw':
          const diffX_nw = e.clientX - (currentButton.x + canvasRect.left);
          newWidth = Math.max(MIN_BUTTON_DIMENSION, currentButton.width - diffX_nw);
          newX = currentButton.x + diffX_nw;
          const diffY_nw = e.clientY - (currentButton.y + canvasRect.top);
          newHeight = Math.max(MIN_BUTTON_DIMENSION, currentButton.height - diffY_nw);
          newY = currentButton.y + diffY_nw;
          break;
      }

      // Ensure button stays within canvas boundaries after resize
      newX = Math.max(0, Math.min(newX, canvasRect.width - newWidth));
      newY = Math.max(0, Math.min(newY, canvasRect.height - newHeight));
      newWidth = Math.min(newWidth, canvasRect.width - newX);
      newHeight = Math.min(newHeight, canvasRect.height - newY);


      setButtons((prev) =>
        prev.map((btn) =>
          btn.id === activeButtonId ? { ...btn, x: newX, y: newY, width: newWidth, height: newHeight } : btn
        )
      );
    }
  }, [activeButtonId, isDragging, isResizing, dragOffset, resizeDirection, buttons, MIN_BUTTON_DIMENSION]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!activeButtonId || !canvasRef.current) return;
    e.preventDefault(); // Prevent scrolling on mobile

    const touch = e.touches[0];
    if (!touch) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const currentButton = buttons.find(b => b.id === activeButtonId);
    if (!currentButton) return;

    if (isDragging) {
      let newX = touch.clientX - dragOffset.x - canvasRect.left;
      let newY = touch.clientY - dragOffset.y - canvasRect.top;

      // Boundary checks for dragging
      newX = Math.max(0, Math.min(newX, canvasRect.width - currentButton.width));
      newY = Math.max(0, Math.min(newY, canvasRect.height - currentButton.height));

      setButtons((prev) =>
        prev.map((btn) =>
          btn.id === activeButtonId ? { ...btn, x: newX, y: newY } : btn
        )
      );
    } else if (isResizing && resizeDirection) {
      let newWidth = currentButton.width;
      let newHeight = currentButton.height;
      let newX = currentButton.x;
      let newY = currentButton.y;

      switch (resizeDirection) {
        case 'e':
          newWidth = Math.max(MIN_BUTTON_DIMENSION, touch.clientX - (currentButton.x + canvasRect.left));
          break;
        case 's':
          newHeight = Math.max(MIN_BUTTON_DIMENSION, touch.clientY - (currentButton.y + canvasRect.top));
          break;
        case 'w':
          const diffX = touch.clientX - (currentButton.x + canvasRect.left);
          newWidth = Math.max(MIN_BUTTON_DIMENSION, currentButton.width - diffX);
          newX = currentButton.x + diffX;
          break;
        case 'n':
          const diffY = touch.clientY - (currentButton.y + canvasRect.top);
          newHeight = Math.max(MIN_BUTTON_DIMENSION, currentButton.height - diffY);
          newY = currentButton.y + diffY;
          break;
        case 'se':
          newWidth = Math.max(MIN_BUTTON_DIMENSION, touch.clientX - (currentButton.x + canvasRect.left));
          newHeight = Math.max(MIN_BUTTON_DIMENSION, touch.clientY - (currentButton.y + canvasRect.top));
          break;
        case 'sw':
          const diffX_sw = touch.clientX - (currentButton.x + canvasRect.left);
          newWidth = Math.max(MIN_BUTTON_DIMENSION, currentButton.width - diffX_sw);
          newX = currentButton.x + diffX_sw;
          newHeight = Math.max(MIN_BUTTON_DIMENSION, touch.clientY - (currentButton.y + canvasRect.top));
          break;
        case 'ne':
          newWidth = Math.max(MIN_BUTTON_DIMENSION, touch.clientX - (currentButton.x + canvasRect.left));
          const diffY_ne = touch.clientY - (currentButton.y + canvasRect.top);
          newHeight = Math.max(MIN_BUTTON_DIMENSION, currentButton.height - diffY_ne);
          newY = currentButton.y + diffY_ne;
          break;
        case 'nw':
          const diffX_nw = touch.clientX - (currentButton.x + canvasRect.left);
          newWidth = Math.max(MIN_BUTTON_DIMENSION, currentButton.width - diffX_nw);
          newX = currentButton.x + diffX_nw;
          const diffY_nw = touch.clientY - (currentButton.y + canvasRect.top);
          newHeight = Math.max(MIN_BUTTON_DIMENSION, currentButton.height - diffY_nw);
          newY = currentButton.y + diffY_nw;
          break;
      }

      // Ensure button stays within canvas boundaries after resize
      newX = Math.max(0, Math.min(newX, canvasRect.width - newWidth));
      newY = Math.max(0, Math.min(newY, canvasRect.height - newHeight));
      newWidth = Math.min(newWidth, canvasRect.width - newX);
      newHeight = Math.min(newHeight, canvasRect.height - newY);


      setButtons((prev) =>
        prev.map((btn) =>
          btn.id === activeButtonId ? { ...btn, x: newX, y: newY, width: newWidth, height: newHeight } : btn
        )
      );
    }
  }, [activeButtonId, isDragging, isResizing, dragOffset, resizeDirection, buttons, MIN_BUTTON_DIMENSION]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setActiveButtonId(null);
    setResizeDirection(null);
  }, []);

  const handleButtonMouseMove = useCallback((e: React.MouseEvent, button: ChartButton) => {
    if (isDragging || isResizing) return; // Don't change cursor if already dragging/resizing

    const direction = getResizeDirection(e, button);
    if (direction) {
      (e.currentTarget as HTMLElement).style.cursor = `${direction}-resize`;
    } else {
      (e.currentTarget as HTMLElement).style.cursor = 'grab';
    }
  }, [isDragging, isResizing, getResizeDirection]);

  const handleButtonMouseLeave = useCallback((e: React.MouseEvent) => {
    if (isDragging || isResizing) return;
    (e.currentTarget as HTMLElement).style.cursor = 'default';
  }, [isDragging, isResizing]);


  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp, handleTouchMove]);

  // --- End Drag & Resize Logic ---

  const handleBackButtonClick = () => {
    const updatedChart: StoredChart = {
      ...chart,
      name: chartName,
      buttons: buttons,
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight,
    };
    onSaveChart(updatedChart); // Save all chart properties before navigating back
    onBackToCharts();
  };

  const handleDimensionChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<number>>
  ) => {
    // This allows the input to be cleared, resulting in NaN state, which is handled by the value prop
    setter(parseInt(value, 10));
  };

  const handleDimensionBlur = (
    currentValue: number,
    setter: React.Dispatch<React.SetStateAction<number>>
  ) => {
    if (isNaN(currentValue) || currentValue < MIN_CANVAS_DIMENSION) {
      setter(MIN_CANVAS_DIMENSION);
    }
  };

  const handleLinkedItemChange = (value: string) => {
    setEditingButton(prev => {
      if (!prev) return null;
      if (value === 'label-only') {
        return { ...prev, linkedItem: 'label-only', type: 'label' };
      }
      return { ...prev, linkedItem: value, type: 'normal' };
    });
  };

  const handleMaximizeCanvas = () => {
    if (!isMobileMode) {
      // On desktop, apply the specified scaling factors to account for UI elements
      setCanvasWidth(Math.round(window.innerWidth * 0.97));
      setCanvasHeight(Math.round(window.innerHeight * 0.91));
    } else {
      // On mobile, use the full viewport size as before.
      setCanvasWidth(window.innerWidth);
      setCanvasHeight(window.innerHeight);
    }
  };

  // --- Legend Preview Logic ---
  const handleOpenLegendPreview = () => {
    if (editingButton) {
      setTempLegendOverrides(editingButton.legendOverrides || {});
      setIsLegendPreviewOpen(true);
    }
  };

  const handleSaveLegendOverrides = () => {
    const cleanedOverrides: Record<string, string> = {};
    for (const key in tempLegendOverrides) {
      // Store only non-empty overrides. An empty string means "use default".
      if (tempLegendOverrides[key] && tempLegendOverrides[key].trim() !== '') {
        cleanedOverrides[key] = tempLegendOverrides[key].trim();
      }
    }

    setEditingButton(prev => {
      if (!prev) return null;
      return { ...prev, legendOverrides: cleanedOverrides };
    });
    setIsLegendPreviewOpen(false);
  };

  const linkedRangeForPreview = editingButton?.linkedItem ? allRanges.find(r => r.id === editingButton.linkedItem) : null;

  const actionsInPreviewedRange = React.useMemo(() => {
    if (!linkedRangeForPreview) return [];
    const usedActionIds = new Set(Object.values(linkedRangeForPreview.hands));
    return actionButtons.filter(action => usedActionIds.has(action.id));
  }, [linkedRangeForPreview, actionButtons]);
  // --- End Legend Preview Logic ---

  const Controls = (
    <div className={cn(
      "flex flex-col", // Main container for controls
      isMobileMode ? "p-4 mb-2 gap-2" : "mb-6 gap-4"
    )}>
      {/* New wrapper for Add Button and Expand icon */}
      <div className={cn(
        "flex items-center",
        isMobileMode ? "gap-2" : "gap-4" // Adjust gap based on mobile/desktop
      )}>
        <Button onClick={handleAddButton} className="flex items-center gap-2 h-7">
          <Plus className="h-4 w-4" />
          Добавить кнопку
        </Button>
        <Button variant="ghost" size="icon" onClick={handleMaximizeCanvas} title="Развернуть на весь экран">
          <Expand className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Group for dimension controls */}
      <div className={cn(
        "flex items-center gap-1 flex-wrap", // Desktop: flex-row, wrap
        isMobileMode ? "grid grid-cols-[auto_1fr] gap-x-1 gap-y-1 w-full" : "" // Mobile: grid layout
      )}>
        <Label htmlFor="canvasWidth" className={cn(
          "text-right", // Desktop
          isMobileMode && "text-left" // Mobile: align label to left within its grid cell
        )}>
          Ширина
        </Label>
        <Input
          id="canvasWidth"
          type="number"
          value={isNaN(canvasWidth) ? '' : canvasWidth}
          onChange={(e) => handleDimensionChange(e.target.value, setCanvasWidth)}
          onBlur={() => handleDimensionBlur(canvasWidth, setCanvasWidth)}
          className="w-20 h-7"
          min="100"
          maxLength={4}
        />
        <Label htmlFor="canvasHeight" className={cn(
          "text-right", // Desktop
          isMobileMode && "text-left" // Mobile
        )}>
          Высота
        </Label>
        <Input
          id="canvasHeight"
          type="number"
          value={isNaN(canvasHeight) ? '' : canvasHeight}
          onChange={(e) => handleDimensionChange(e.target.value, setCanvasHeight)}
          onBlur={() => handleDimensionBlur(canvasHeight, setCanvasHeight)}
          className="w-20 h-7"
          min="100"
          maxLength={4}
        />
      </div>
    </div>
  );

  const Canvas = (
    <div
      ref={canvasRef}
      className="relative border-2 border-dashed border-muted-foreground rounded-lg bg-card flex items-center justify-center overflow-hidden"
      style={{ width: canvasWidth, height: canvasHeight }} // Apply dynamic width and height
    >
      {buttons.length === 0 && (
        <p className="text-muted-foreground">Рабочая область (холст)</p>
      )}
      {buttons.map((button) => {
        const finalStyle: React.CSSProperties = {
            backgroundColor: button.color,
            position: 'absolute',
            left: button.x,
            top: button.y,
            width: Math.max(MIN_BUTTON_DIMENSION, button.width || 0),
            height: Math.max(MIN_BUTTON_DIMENSION, button.height || 0),
            zIndex: activeButtonId === button.id ? 100 : 1,
            color: (button.isFontAdaptive === false && button.fontColor) ? button.fontColor : 'white',
        };

        if (button.isFontAdaptive === false && button.fontSize) {
            finalStyle.fontSize = `${button.fontSize}px`;
        }

        return (
          <div
            key={button.id}
            style={finalStyle}
            className="relative flex items-center justify-center rounded-md shadow-md font-semibold group"
            onMouseDown={(e) => handleMouseDown(e, button)}
            onTouchStart={(e) => handleTouchStart(e, button)}
            onMouseMove={(e) => handleButtonMouseMove(e, button)}
            onMouseLeave={handleButtonMouseLeave}
          >
            {button.name}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity settings-icon"
              onClick={(e) => handleSettingsClick(e, button)}
              title="Настройки кнопки"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )
      })}
    </div>
  );

  return (
    <div className={cn(
      "p-6",
      isMobileMode ? "flex-1 overflow-y-auto" : "min-h-screen"
    )}>
      <div className={cn(
        "mx-auto", // Removed max-w-4xl to allow canvas to expand
        isMobileMode ? "w-full" : ""
      )}>
        <div className="flex justify-between items-center mb-2"> {/* Reduced margin-bottom */}
          {/* Left side: Back button, Chart Name */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackButtonClick} title="Назад к чартам">
              <ArrowLeft className="h-6 w-6 text-foreground" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{chartName}</h1>
          </div>
        </div>

        {isMobileMode ? (
          <>
            {Controls}
            {Canvas}
          </>
        ) : (
          <>
            {Controls}
            {Canvas}
          </>
        )}

        <Dialog open={isButtonModalOpen} onOpenChange={(isOpen) => {
          if (!isOpen) handleCancelButtonProperties();
          else setIsButtonModalOpen(true);
        }}>
          <DialogContent mobileFullscreen={isMobileMode}>
            <DialogHeader>
              <DialogTitle>Настройка кнопки</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="buttonName" className="text-right">
                  Название
                </Label>
                <Input
                  id="buttonName"
                  value={editingButton?.name || ""}
                  onChange={(e) => setEditingButton(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="buttonColor" className="text-right">
                  Цвет
                </Label>
                <Input
                  id="buttonColor"
                  type="color"
                  value={editingButton?.color || "#000000"}
                  onChange={(e) => setEditingButton(prev => prev ? { ...prev, color: e.target.value } : null)}
                  className="col-span-3 h-10"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="linkedItem" className="text-right">
                  Привязать
                </Label>
                <Select
                  value={editingButton?.type === 'label' ? 'label-only' : editingButton?.linkedItem || ""}
                  onValueChange={handleLinkedItemChange}
                  disabled={editingButton?.type === 'exit'}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={
                      editingButton?.type === 'exit' 
                        ? "Выход из режима просмотра чарта" 
                        : editingButton?.type === 'label'
                        ? "Только текстовое обозначение"
                        : "Выберите чарт/диапазон"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {editingButton?.type === 'exit' ? (
                      <SelectItem value="exit-chart-placeholder" disabled>Выход из режима просмотра чарта</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="label-only">Только текстовое обозначение</SelectItem>
                        {allRanges.map(range => (
                          <SelectItem key={range.id} value={range.id}>
                            {range.name}
                          </SelectItem>
                        ))}
                        {allRanges.length === 0 && (
                          <SelectItem value="no-ranges-available-placeholder" disabled>Нет доступных диапазонов</SelectItem>
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Font Settings */}
              <div className="grid grid-cols-4 items-center gap-4 border-t pt-4 mt-2">
                <Label className="text-right">Шрифт</Label>
                <div className="col-span-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="adaptiveFont"
                      checked={editingButton?.isFontAdaptive ?? true}
                      onCheckedChange={(checked) => {
                        setEditingButton(prev => prev ? { ...prev, isFontAdaptive: !!checked } : null);
                      }}
                    />
                    <Label htmlFor="adaptiveFont" className="font-normal">Адаптивный</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      id="fontSize"
                      type="number"
                      value={editingButton?.fontSize || 16}
                      onChange={(e) => setEditingButton(prev => prev ? { ...prev, fontSize: parseInt(e.target.value) || 16 } : null)}
                      className="w-16 h-8"
                      min="1"
                      disabled={editingButton?.isFontAdaptive ?? true}
                    />
                    <Label htmlFor="fontSize" className="font-normal text-sm text-muted-foreground">px</Label>
                  </div>

                  <RadioGroup
                    value={editingButton?.fontColor || 'white'}
                    onValueChange={(value: 'white' | 'black') => {
                      setEditingButton(prev => prev ? { ...prev, fontColor: value } : null);
                    }}
                    className="flex gap-4"
                    disabled={editingButton?.isFontAdaptive ?? true}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="white" id="fontWhite" />
                      <Label htmlFor="fontWhite" className="font-normal">Белый</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="black" id="fontBlack" />
                      <Label htmlFor="fontBlack" className="font-normal">Черный</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Width and Height Settings */}
              <div className="grid grid-cols-4 items-center gap-4 border-t pt-4 mt-2">
                <Label htmlFor="buttonWidth" className="text-right">
                  Ширина
                </Label>
                <Input
                  id="buttonWidth"
                  type="number"
                  value={editingButton?.width || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setEditingButton(prev => prev ? { ...prev, width: isNaN(value) ? 0 : value } : null);
                  }}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="buttonHeight" className="text-right">
                  Высота
                </Label>
                <Input
                  id="buttonHeight"
                  type="number"
                  value={editingButton?.height || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setEditingButton(prev => prev ? { ...prev, height: isNaN(value) ? 0 : value } : null);
                  }}
                  className="col-span-3"
                />
              </div>

              {/* Legend Checkbox */}
              <div className="grid grid-cols-4 items-center gap-4 border-t pt-4 mt-2">
                <Label className="text-right col-start-1">Опции</Label>
                <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox
                        id="showLegend"
                        checked={editingButton?.showLegend ?? false}
                        onCheckedChange={(checked) => {
                            setEditingButton(prev => prev ? { ...prev, showLegend: !!checked } : null);
                        }}
                        disabled={editingButton?.type === 'label' || editingButton?.type === 'exit'}
                    />
                    <Label htmlFor="showLegend" className="font-normal">
                        Показать легенду
                    </Label>
                    {editingButton?.showLegend && editingButton?.type === 'normal' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 ml-2"
                        onClick={handleOpenLegendPreview}
                      >
                        Предпросмотр
                      </Button>
                    )}
                </div>
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelButtonProperties}>Отмена</Button>
              <Button onClick={handleSaveButtonProperties}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Legend Preview Dialog */}
        <Dialog open={isLegendPreviewOpen} onOpenChange={setIsLegendPreviewOpen}>
          <DialogContent className="max-w-4xl sm:max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Предпросмотр и редактирование легенды</DialogTitle>
            </DialogHeader>
            {linkedRangeForPreview && (
              <div>
                <PokerMatrix
                  selectedHands={linkedRangeForPreview.hands}
                  onHandSelect={() => {}}
                  activeAction=""
                  actionButtons={actionButtons}
                  readOnly={true}
                  isBackgroundMode={false}
                  sizeVariant="editorPreview"
                />
                <div className="mt-4 space-y-3">
                  <h4 className="font-semibold">Редактировать названия:</h4>
                  {actionsInPreviewedRange.map(action => (
                    <div key={action.id} className="grid grid-cols-[auto_1fr] items-center gap-4">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <div className="w-4 h-4 rounded-sm border flex-shrink-0" style={getActionButtonStyle(action, actionButtons)} />
                        <Label htmlFor={`legend-override-${action.id}`}>{action.name}:</Label>
                      </div>
                      <Input
                        id={`legend-override-${action.id}`}
                        value={tempLegendOverrides[action.id] || ''}
                        onChange={(e) => setTempLegendOverrides(prev => ({ ...prev, [action.id]: e.target.value }))}
                        placeholder={`По умолчанию: ${action.name}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLegendPreviewOpen(false)}>Отмена</Button>
              <Button onClick={handleSaveLegendOverrides}>Сохранить легенду</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
