import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useRangeContext, ActionButton, SimpleActionButton } from "@/contexts/RangeContext";
import { cn } from "@/lib/utils";

interface CreateActionButtonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (button: ActionButton) => void;
}

const PRESET_COLORS = ['#8b5cf6', '#ef4444', '#10b981'];

export const CreateActionButtonDialog = ({ open, onOpenChange, onSave }: CreateActionButtonDialogProps) => {
  const { actionButtons } = useRangeContext();
  
  const [buttonType, setButtonType] = useState<'simple' | 'weighted'>('simple');
  const [name, setName] = useState("");
  
  // Simple button state
  const [color, setColor] = useState(PRESET_COLORS[0]);

  // Weighted button state
  const [action1Id, setAction1Id] = useState<string>('fold');
  const [action2Id, setAction2Id] = useState<string>('');
  const [weight, setWeight] = useState(50);

  const weightableActions = useMemo(() => {
    const foldAction: SimpleActionButton = { id: 'fold', name: 'Fold', color: '#6b7280', type: 'simple' };
    const simpleActions = actionButtons.filter(b => b.type === 'simple') as SimpleActionButton[];
    return [foldAction, ...simpleActions];
  }, [actionButtons]);

  const handleSave = () => {
    if (!name.trim()) return;

    let newButton: ActionButton;

    if (buttonType === 'simple') {
      newButton = {
        id: Date.now().toString(),
        type: 'simple',
        name: name.trim(),
        color,
      };
    } else {
      if (!action1Id || !action2Id) return;
      newButton = {
        id: Date.now().toString(),
        type: 'weighted',
        name: name.trim(),
        action1Id,
        action2Id,
        weight,
      };
    }
    
    onSave(newButton);
    resetAndClose();
  };

  const resetAndClose = () => {
    setName("");
    setButtonType('simple');
    setColor(PRESET_COLORS[0]);
    setAction1Id('fold');
    setAction2Id('');
    setWeight(50);
    onOpenChange(false);
  };

  const isSaveDisabled = !name.trim() || (buttonType === 'weighted' && (!action1Id || !action2Id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Создать кнопку действия</DialogTitle>
          <DialogDescription>
            Настройте простую или взвешенную кнопку для вашей стратегии.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="action-name">Название кнопки</Label>
            <Input
              id="action-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="например, 3-bet"
            />
          </div>

          <RadioGroup value={buttonType} onValueChange={(v: any) => setButtonType(v)} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="simple" id="simple" />
              <Label htmlFor="simple">Простой цвет</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weighted" id="weighted" />
              <Label htmlFor="weighted">Взвешенный</Label>
            </div>
          </RadioGroup>

          {buttonType === 'simple' && (
            <div className="space-y-3">
              <Label>Цвет</Label>
              <div className="flex items-center gap-3">
                {PRESET_COLORS.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      color === preset ? 'border-ring' : 'border-transparent'
                    )}
                    style={{ backgroundColor: preset }}
                    onClick={() => setColor(preset)}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-full border-2 cursor-pointer"
                />
              </div>
            </div>
          )}

          {buttonType === 'weighted' && (
            <div className="space-y-4 rounded-md border p-4">
              <h4 className="font-medium">Веса</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Действие 1</Label>
                  <Select value={action1Id} onValueChange={setAction1Id}>
                    <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                    <SelectContent>
                      {weightableActions.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: a.color }} />
                            <span>{a.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Действие 2</Label>
                  <Select value={action2Id} onValueChange={setAction2Id}>
                    <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                    <SelectContent>
                      {weightableActions.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: a.color }} />
                            <span>{a.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Соотношение</Label>
                  <span>{weight}% / {100 - weight}%</span>
                </div>
                <Slider
                  value={[weight]}
                  onValueChange={(v) => setWeight(v[0])}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>Отмена</Button>
          <Button onClick={handleSave} disabled={isSaveDisabled}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
