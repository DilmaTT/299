import { Button } from "@/components/ui/button";
    import {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
    } from "@/components/ui/dialog";
    import { Card } from "@/components/ui/card";
    import { Trophy, Clock, Target, CheckCircle, Calendar } from "lucide-react";

    interface TrainingResultsDialogProps {
      open: boolean;
      onClose: () => void;
      results: {
        trainingName: string;
        type: string;
        duration: number;
        accuracy: number;
        totalQuestions: number;
        correctAnswers: number;
        timestamp: number;
      };
    }

    export const TrainingResultsDialog = ({ open, onClose, results }: TrainingResultsDialogProps) => {
      const formatDuration = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      };

      const formatDate = (ts: number) => {
        const date = new Date(ts);
        return date.toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      const getPerformanceLevel = (accuracy: number) => {
        if (accuracy >= 90) return { level: "Отлично!", color: "text-green-600", icon: Trophy };
        if (accuracy >= 75) return { level: "Хорошо!", color: "text-blue-600", icon: Target };
        if (accuracy >= 60) return { level: "Неплохо", color: "text-yellow-600", icon: CheckCircle };
        return { level: "Нужна практика", color: "text-red-600", icon: Target };
      };

      const performance = getPerformanceLevel(results.accuracy);
      const Icon = performance.icon;

      return (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon className={`w-8 h-8 ${performance.color}`} />
              </div>
              <DialogTitle className="text-xl">Тренировка завершена!</DialogTitle>
              <DialogDescription>
                <p className="text-base">{results.trainingName}</p>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(results.timestamp)}
                </p>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${performance.color}`}>
                      {results.accuracy.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Точность</div>
                    <div className={`text-sm font-medium ${performance.color}`}>
                      {performance.level}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                      <Clock className="w-5 h-5" />
                      {formatDuration(results.duration)}
                    </div>
                    <div className="text-sm text-muted-foreground">Время</div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4 text-center">
                <Card className="p-3">
                  <div className="text-lg font-bold text-green-600">
                    {results.correctAnswers}
                  </div>
                  <div className="text-sm text-muted-foreground">Правильно</div>
                </Card>
                
                <Card className="p-3">
                  <div className="text-lg font-bold text-red-600">
                    {results.totalQuestions - results.correctAnswers}
                  </div>
                  <div className="text-sm text-muted-foreground">Ошибок</div>
                </Card>
              </div>

              <Card className="p-3 text-center">
                <div className="text-lg font-bold text-primary">
                  {results.totalQuestions}
                </div>
                <div className="text-sm text-muted-foreground">
                  {results.type === 'classic' ? 'Всего рук' : 'Всего ренжей'}
                </div>
              </Card>
            </div>

            <DialogFooter className="mt-6">
              <Button onClick={onClose} className="w-full" size="lg">
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };
