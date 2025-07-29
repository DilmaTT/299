import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { X, ArrowLeft, Circle, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRangeContext } from "@/contexts/RangeContext";
import { PokerMatrix } from "@/components/PokerMatrix";
import { useIsMobile } from "@/hooks/use-mobile";

interface LibraryProps {
  isMobileMode?: boolean;
}

interface CellData {
  rangeId: string;
  rangeName: string;
  shortName: string;
  color: string;
  shape: 'circle' | 'square';
  position: number;
}

export const Library = ({ isMobileMode = false }: LibraryProps) => {
  const { folders } = useRangeContext();
  const [gridSize, setGridSize] = useState({ rows: 2, cols: 2 });
  const [mode, setMode] = useState<'edit' | 'view'>('edit');
  const [cells, setCells] = useState<CellData[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [viewingRange, setViewingRange] = useState<CellData | null>(null);
  const isMobile = useIsMobile();

  // Get all available ranges from folders
  const availableRanges = folders.flatMap(folder => 
    folder.ranges.map(range => ({
      id: range.id,
      name: range.name,
      folderName: folder.name,
      hands: range.hands
    }))
  );

  const totalCells = gridSize.rows * gridSize.cols;

  const getCellAt = (position: number) => {
    return cells.find(cell => cell.position === position);
  };

  const handleCellConfig = (position: number, rangeId: string, shortName: string, color: string, shape: 'circle' | 'square') => {
    const range = availableRanges.find(r => r.id === rangeId);
    if (!range) return;

    setCells(prev => {
      const filtered = prev.filter(cell => cell.position !== position);
      return [...filtered, {
        rangeId,
        rangeName: range.name,
        shortName,
        color,
        shape,
        position
      }];
    });
    setSelectedCell(null);
  };

  const handleCellClick = (position: number) => {
    if (mode === 'edit') {
      setSelectedCell(position);
    } else {
      const cell = getCellAt(position);
      if (cell) {
        setViewingRange(cell);
      }
    }
  };

  const canShow = cells.length === totalCells;

  const colorOptions = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
  ];

  if (viewingRange) {
    const range = availableRanges.find(r => r.id === viewingRange.rangeId);
    
    return (
      <div className="bg-background p-6 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={() => setViewingRange(null)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 px-4 leading-tight">{viewingRange.shortName}</h2>
            <p className="text-muted-foreground text-sm sm:text-base px-4 break-words">{viewingRange.rangeName}</p>
          </div>

          {range && (
            <div className="space-y-6">
              <PokerMatrix
                selectedHands={range.hands}
                actionButtons={[{ id: viewingRange.rangeId, name: viewingRange.shortName, color: viewingRange.color }]}
                onHandSelect={() => {}}
                activeAction=""
                readOnly={true}
              />
              
              <div className="flex justify-center">
                <div className="flex items-center gap-2 p-3 bg-card rounded-lg border">
                  <div 
                    className={cn(
                      "w-4 h-4",
                      viewingRange.shape === 'circle' ? "rounded-full" : "rounded-sm"
                    )}
                    style={{ backgroundColor: viewingRange.color }}
                  />
                  <span className="font-medium">{viewingRange.shortName}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'view') {
    return (
      <div className="bg-background p-6 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-end mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode('edit')}
              className="p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div 
            className="grid gap-4"
            style={{ 
              gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize.rows}, 1fr)`
            }}
          >
            {Array.from({ length: totalCells }, (_, index) => {
              const cell = getCellAt(index);
              return (
                <div
                  key={index}
                  className="aspect-square p-6 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform bg-card rounded-lg border"
                  onClick={() => handleCellClick(index)}
                >
                  {cell ? (
                    <div className="text-center">
                      <div 
                        className={cn(
                          "flex items-center justify-center text-white font-bold mx-auto mb-2",
                          cell.shape === 'circle' ? "rounded-full" : "rounded-lg",
                          isMobileMode ? "w-12 h-12 text-sm" : "w-16 h-16 text-xl"
                        )}
                        style={{ backgroundColor: cell.color }}
                      >
                        {cell.shortName}
                      </div>
                      <span className={cn(
                        "font-medium",
                        isMobileMode ? "text-xs" : "text-sm"
                      )}>
                        {cell.shortName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Пусто</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background p-6 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Выбор ренжа</h1>
        </div>

        {/* Grid Size Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Настройки сетки</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Строки:</label>
              <Input
                type="number"
                min="1"
                max="6"
                value={gridSize.rows}
                onChange={(e) => setGridSize(prev => ({ ...prev, rows: parseInt(e.target.value) || 1 }))}
                className="w-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Столбцы:</label>
              <Input
                type="number"
                min="1"
                max="6"
                value={gridSize.cols}
                onChange={(e) => setGridSize(prev => ({ ...prev, cols: parseInt(e.target.value) || 1 }))}
                className="w-20"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              Всего ячеек: {totalCells}
            </span>
          </div>
        </Card>

        {/* Grid Editor */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Редактор ячеек</h2>
            <Button 
              onClick={() => setMode('view')}
              variant="poker"
            >
              Show
            </Button>
          </div>
          
          <div 
            className="grid gap-2 mb-4"
            style={{ 
              gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize.rows}, 1fr)`
            }}
          >
            {Array.from({ length: totalCells }, (_, index) => {
              const cell = getCellAt(index);
              return (
                <div
                  key={index}
                  className="aspect-square border-2 border-dashed border-muted rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleCellClick(index)}
                >
                  {cell ? (
                    <div className="text-center">
                      <div 
                        className={cn(
                          "flex items-center justify-center text-white font-bold mx-auto mb-1",
                          cell.shape === 'circle' ? "rounded-full" : "rounded-sm",
                          "w-8 h-8 text-sm"
                        )}
                        style={{ backgroundColor: cell.color }}
                      >
                        {cell.shortName}
                      </div>
                      <span className="text-xs font-medium">{cell.shortName}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">+</span>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Заполнено: {cells.length}/{totalCells}
          </div>
        </Card>

        {/* Cell Configuration Dialog */}
        <Dialog open={selectedCell !== null} onOpenChange={() => setSelectedCell(null)}>
          <DialogContent mobileFullscreen={isMobile}>
            <DialogHeader>
              {isMobile ? (
                <DialogTitle>Выбор ренжа</DialogTitle>
              ) : (
                <>
                  <DialogTitle>Управление ренжами</DialogTitle>
                  <DialogDescription>
                    Создавайте, удаляйте и выбирайте папки и ренжи.
                  </DialogDescription>
                </>
              )}
            </DialogHeader>
            
            <CellConfigForm
              ranges={availableRanges}
              onSave={(rangeId, shortName, color, shape) => {
                if (selectedCell !== null) {
                  handleCellConfig(selectedCell, rangeId, shortName, color, shape);
                }
              }}
              onCancel={() => setSelectedCell(null)}
              existingCell={selectedCell !== null ? getCellAt(selectedCell) : undefined}
              onDelete={() => {
                if (selectedCell !== null) {
                  setCells(prev => prev.filter(cell => cell.position !== selectedCell));
                  setSelectedCell(null);
                }
              }}
              colorOptions={colorOptions}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

interface CellConfigFormProps {
  ranges: Array<{ id: string; name: string; folderName: string; hands: Record<string, string> }>;
  onSave: (rangeId: string, shortName: string, color: string, shape: 'circle' | 'square') => void;
  onCancel: () => void;
  onDelete: () => void;
  existingCell?: CellData;
  colorOptions: string[];
}

const CellConfigForm = ({ ranges, onSave, onCancel, onDelete, existingCell, colorOptions }: CellConfigFormProps) => {
  const [selectedRangeId, setSelectedRangeId] = useState(existingCell?.rangeId || '');
  const [shortName, setShortName] = useState(existingCell?.shortName || '');
  const [color, setColor] = useState(existingCell?.color || colorOptions[0]);
  const [shape, setShape] = useState<'circle' | 'square'>(existingCell?.shape || 'circle');

  const canSave = selectedRangeId && shortName.trim();

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Выберите ренж</label>
        <Select value={selectedRangeId} onValueChange={setSelectedRangeId}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите ренж" />
          </SelectTrigger>
          <SelectContent>
            {ranges.map((range) => (
              <SelectItem key={range.id} value={range.id}>
                {range.folderName} / {range.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Короткое название</label>
        <Input
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          placeholder="Например: RFI"
          maxLength={4}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Цвет</label>
        <div className="grid grid-cols-8 gap-2">
          {colorOptions.map((colorOption) => (
            <button
              key={colorOption}
              className={cn(
                "w-8 h-8 rounded-full border-2",
                color === colorOption ? "border-primary" : "border-muted"
              )}
              style={{ backgroundColor: colorOption }}
              onClick={() => setColor(colorOption)}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Форма</label>
        <div className="flex gap-2">
          <Button
            variant={shape === 'circle' ? 'default' : 'outline'}
            onClick={() => setShape('circle')}
            className="flex items-center gap-2"
          >
            <Circle className="w-4 h-4" />
            Круг
          </Button>
          <Button
            variant={shape === 'square' ? 'default' : 'outline'}
            onClick={() => setShape('square')}
            className="flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Квадрат
          </Button>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <div>
          {existingCell && (
            <Button variant="destructive" onClick={onDelete}>
              Удалить
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button 
            onClick={() => canSave && onSave(selectedRangeId, shortName, color, shape)}
            disabled={!canSave}
          >
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
};
