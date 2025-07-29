import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Play, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";

// Define the interface for a single button on the chart
export interface ChartButton {
  id: string;
  name: string;
  color: string;
  linkedItem: string; // Can be a range ID, chart ID, or special values like 'label-only' or 'exit-chart'
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'normal' | 'label' | 'exit';
  isFontAdaptive?: boolean;
  fontSize?: number;
  fontColor?: 'white' | 'black';
  showLegend?: boolean;
  legendOverrides?: Record<string, string>; // To store custom legend names
}

// Define the interface for a stored chart configuration
export interface StoredChart {
  id: string;
  name: string;
  buttons: ChartButton[];
  canvasWidth?: number;
  canvasHeight?: number;
}

// Props for the main Chart component (the list view)
interface ChartProps {
  isMobileMode?: boolean;
  charts: StoredChart[];
  onCreateChart: (name: string) => void;
  onDeleteChart: (id: string) => void;
  onEditChart: (chart: StoredChart) => void;
  onPlayChart: (chart: StoredChart) => void;
}

function getButtonLabel(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'кнопок';
  }
  if (lastDigit === 1) {
    return 'кнопка';
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'кнопки';
  }
  return 'кнопок';
}

// The main component that Index.tsx renders
export const Chart: React.FC<ChartProps> = ({
  isMobileMode = false,
  charts,
  onCreateChart,
  onDeleteChart,
  onEditChart,
  onPlayChart,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newChartName, setNewChartName] = useState("");

  const handleCreate = () => {
    if (newChartName.trim()) {
      onCreateChart(newChartName.trim());
      setNewChartName("");
      setIsCreateModalOpen(false);
    }
  };

  return (
    <div className={cn("p-6", isMobileMode ? "flex-1 overflow-y-auto" : "min-h-screen")}>
      <div className={cn("mx-auto", isMobileMode ? "w-full" : "max-w-4xl")}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Чарты</h1>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Создать чарт
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать новый чарт</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="chartName" className="text-right">
                    Название
                  </Label>
                  <Input
                    id="chartName"
                    value={newChartName}
                    onChange={(e) => setNewChartName(e.target.value)}
                    className="col-span-3"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Отмена</Button>
                <Button onClick={handleCreate}>Создать</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {charts.length > 0 ? (
            charts.map((chart) => (
              <div
                key={chart.id}
                className="bg-card border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-lg">{chart.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {chart.buttons.length} {getButtonLabel(chart.buttons.length)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="icon" onClick={() => onPlayChart(chart)} title="Играть">
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => onEditChart(chart)} title="Редактировать">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => onDeleteChart(chart.id)} title="Удалить">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-semibold">Нет созданных чартов</h3>
              <p className="text-muted-foreground mt-2">Начните с создания вашего первого чарта.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
