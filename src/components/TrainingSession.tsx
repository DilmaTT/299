import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PokerMatrix } from "./PokerMatrix";
import { PokerCard } from "./PokerCard";
import { TrainingResultsDialog } from "./TrainingResultsDialog";
import { X, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRangeContext, ActionButton } from "@/contexts/RangeContext";
import { useToast } from "@/hooks/use-toast";

interface TrainingSessionProps {
  training: any;
  onStop: () => void;
}

const allHands = [
  'AA', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'AKo', 'KK', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  'AQo', 'KQo', 'QQ', 'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
  'AJo', 'KJo', 'QJo', 'JJ', 'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s',
  'ATo', 'KTo', 'QTo', 'JTo', 'TT', 'T9s', 'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s',
  'A9o', 'K9o', 'Q9o', 'J9o', 'T9o', '99', '98s', '97s', '96s', '95s', '94s', '93s', '92s',
  'A8o', 'K8o', 'Q8o', 'J8o', 'T8o', '98o', '88', '87s', '86s', '85s', '84s', '83s', '82s',
  'A7o', 'K7o', 'Q7o', 'J7o', 'T7o', '97o', '87o', '77', '76s', '75s', '74s', '73s', '72s',
  'A6o', 'K6o', 'Q6o', 'J6o', 'T6o', '96o', '86o', '76o', '66', '65s', '64s', '63s', '62s',
  'A5o', 'K5o', 'Q5o', 'J5o', 'T5o', '95o', '85o', '75o', '65o', '55', '54s', '53s', '52s',
  'A4o', 'K4o', 'Q4o', 'J4o', 'T4o', '94o', '84o', '74o', '64o', '54o', '44', '43s', '42s',
  'A3o', 'K3o', 'Q3o', 'J3o', 'T3o', '93o', '83o', '73o', '63o', '53o', '43o', '33', '32s',
  'A2o', 'K2o', 'Q2o', 'J2o', 'T2o', '92o', '82o', '72o', '62o', '52o', '42o', '32o', '22'
];

/**
 * Calculates the number of combinations for a given poker hand notation.
 * - Pocket pairs (e.g., 'AA'): 6 combos
 * - Suited hands (e.g., 'AKs'): 4 combos
 * - Off-suited hands (e.g., 'AKo'): 12 combos
 */
const getCombinationsForHand = (hand: string): number => {
  // e.g., 'AKs' or 'AKo'
  if (hand.length === 3) {
    if (hand[2] === 's') return 4;
    if (hand[2] === 'o') return 12;
  }
  // e.g., 'AA'
  if (hand.length === 2 && hand[0] === hand[1]) {
    return 6;
  }
  // Should not be reached with valid notations from `allHands`
  return 0;
};

// Create a weighted list of all 1326 possible hand combinations
const allPossibleHands = allHands.flatMap(hand => {
  const combos = getCombinationsForHand(hand);
  return Array(combos).fill(hand);
});

const getActionColor = (actionId: string, allButtons: ActionButton[]): string => {
    if (actionId === 'fold') return '#6b7280';
    const button = allButtons.find(b => b.id === actionId);
    if (button && button.type === 'simple') {
        return button.color;
    }
    return '#ffffff';
};

const getActionButtonStyle = (button: ActionButton, allButtons: ActionButton[]) => {
    if (button.type === 'simple') {
        return { backgroundColor: button.color, color: 'white' };
    }
    if (button.type === 'weighted') {
        const color1 = getActionColor(button.action1Id, allButtons);
        const color2 = getActionColor(button.action2Id, allButtons);
        return {
            background: `linear-gradient(to right, ${color1} ${button.weight}%, ${color2} ${button.weight}%)`,
            color: 'white',
        };
    }
    return {};
};

export const TrainingSession = ({ training, onStop }: TrainingSessionProps) => {
  const { folders, actionButtons } = useRangeContext();
  const { toast } = useToast();
  
  const [currentHandIndex, setCurrentHandIndex] = useState(0);
  const [currentRangeIndex, setCurrentRangeIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    startTime: Date.now(),
    hands: [] as Array<{hand: string, correct: boolean, userAction?: string, correctAction?: string}>,
    accuracy: 0
  });
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showCorrectRange, setShowCorrectRange] = useState(false);
  const [userMatrix, setUserMatrix] = useState<Record<string, string>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [activeAction, setActiveAction] = useState<string>('fold');
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [trainingResults, setTrainingResults] = useState<any>(null);

  // Get current training data
  const getTrainingRanges = () => {
    const ranges = [];
    if (!training.ranges) return [];
    for (const rangeId of training.ranges) {
      for (const folder of folders) {
        const range = folder.ranges.find(r => r.id === rangeId);
        if (range) {
          ranges.push({ ...range, folderName: folder.name });
        }
      }
    }
    return ranges;
  };

  const trainingRanges = getTrainingRanges();
  const currentRange = trainingRanges[currentRangeIndex];

  // Generate hands for classic training
  const generateHands = () => {
    if (training.type === 'classic') {
      if (training.subtype === 'all-hands') {
        // Shuffle the full list of 1326 hand categories, weighted by their frequency
        return [...allPossibleHands].sort(() => Math.random() - 0.5);
      } else if (training.subtype === 'border-check') {
        // Generate hands near range borders (2 cells away)
        // The current implementation is a placeholder, but we'll keep it for now.
        // It just takes a random slice of the 169 categories.
        return allHands.sort(() => Math.random() - 0.5).slice(0, 20);
      }
    }
    return [];
  };

  const [hands] = useState(generateHands());
  const currentHand = hands[currentHandIndex];

  // Get correct action for current hand
  const getCorrectAction = (hand: string) => {
    if (!currentRange) return 'fold';
    return currentRange.hands[hand] || 'fold';
  };

  // Handle classic training answer
  const handleClassicAnswer = (action: string) => {
    if (feedback) return; // Already answered

    const correctAction = getCorrectAction(currentHand);
    const isCorrect = action === correctAction;
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    const newHandStat = {
      hand: currentHand,
      correct: isCorrect,
      userAction: action,
      correctAction
    };
    
    setSessionStats(prev => {
      const newHands = [...prev.hands, newHandStat];
      const correctCount = newHands.filter(h => h.correct).length;
      const accuracy = (correctCount / newHands.length) * 100;
      return { ...prev, hands: newHands, accuracy };
    });

    if (isCorrect) {
      setTimeout(() => {
        proceedToNext();
      }, 3000);
    } else {
      setShowCorrectRange(true);
    }
  };

  // Handle border repeat training
  const handleMatrixSelect = (hand: string) => {
    if (isChecked) return;
    
    const newMatrix = { ...userMatrix };
    if (newMatrix[hand] === activeAction) {
      delete newMatrix[hand];
    } else {
      newMatrix[hand] = activeAction;
    }
    setUserMatrix(newMatrix);
  };

  const checkBorderRepeat = () => {
    if (!currentRange) return;
    
    const correctHands = currentRange.hands;
    const isCorrect = Object.keys(correctHands).every(hand => 
      userMatrix[hand] === correctHands[hand]
    ) && Object.keys(userMatrix).every(hand => 
      correctHands[hand] === userMatrix[hand]
    );
    
    setIsChecked(true);
    setCanProceed(true);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    if (!isCorrect) {
      setShowCorrectRange(true);
    }

    const newRangeStat = {
      hand: currentRange.name,
      correct: isCorrect,
      userAction: 'matrix',
      correctAction: 'matrix'
    };
    
    setSessionStats(prev => {
      const newHands = [...prev.hands, newRangeStat];
      const correctCount = newHands.filter(h => h.correct).length;
      const accuracy = (correctCount / newHands.length) * 100;
      return { ...prev, hands: newHands, accuracy };
    });
  };

  const proceedToNext = () => {
    if (training.type === 'classic') {
      if (currentHandIndex < hands.length - 1) {
        setCurrentHandIndex(prev => prev + 1);
      } else {
        finishTraining();
        return;
      }
    } else {
      if (currentRangeIndex < trainingRanges.length - 1) {
        setCurrentRangeIndex(prev => prev + 1);
        setUserMatrix({});
        setIsChecked(false);
        setCanProceed(false);
        setActiveAction('fold');
      } else {
        finishTraining();
        return;
      }
    }
    
    setFeedback(null);
    setShowCorrectRange(false);
  };

  const finishTraining = () => {
    const finishTime = Date.now();
    const duration = finishTime - sessionStats.startTime;
    const correctAnswers = sessionStats.hands.filter(h => h.correct).length;
    const totalQuestions = sessionStats.hands.length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    // Only save stats if at least one question was answered
    if (totalQuestions > 0) {
      const sessionDataToSave = {
        trainingId: training.id,
        timestamp: finishTime,
        duration: duration,
        totalQuestions: totalQuestions,
        correctAnswers: correctAnswers,
      };
      
      const savedStats = JSON.parse(localStorage.getItem('training-statistics') || '[]');
      savedStats.push(sessionDataToSave);
      localStorage.setItem('training-statistics', JSON.stringify(savedStats));
    }
    
    const resultsForDialog = {
      trainingName: training.name,
      type: training.type,
      duration: duration,
      accuracy: accuracy,
      totalQuestions: totalQuestions,
      correctAnswers: correctAnswers,
      timestamp: finishTime,
    };

    setTrainingResults(resultsForDialog);
    setShowResultsDialog(true);
  };

  const handleCloseResults = () => {
    setShowResultsDialog(false);
    onStop();
  };

  const formatTime = () => {
    const elapsed = Date.now() - sessionStats.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentRange) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-lg text-muted-foreground">Ренжи для тренировки не найдены</p>
          <Button onClick={onStop} className="mt-4">Вернуться</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col sm:flex-row">
      {/* Desktop sidebar with stats */}
      <div className="hidden sm:block w-80 bg-card border-r p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Статистика</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={finishTraining}>
              Завершить
            </Button>
            <Button size="sm" variant="outline" onClick={onStop}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{formatTime()}</div>
            <div className="text-sm text-muted-foreground">Время</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{sessionStats.accuracy.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Точность</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{sessionStats.hands.length}</div>
            <div className="text-sm text-muted-foreground">
              {training.type === 'classic' ? 'Рук сыграно' : 'Ренжей проверено'}
            </div>
          </div>
        </div>

        {/* Hands/Ranges history */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <h3 className="text-sm font-medium text-muted-foreground">История</h3>
          {sessionStats.hands.map((stat, index) => (
            <div
              key={index}
              className={cn(
                "p-2 rounded text-sm",
                stat.correct 
                  ? "bg-green-500/20 text-green-700 dark:text-green-300" 
                  : "bg-red-500/20 text-red-700 dark:text-red-300"
              )}
            >
              {stat.hand}
            </div>
          ))}
        </div>
      </div>

      {/* Main training area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="sm:hidden p-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">
              {currentRange.folderName} - {currentRange.name}
            </div>
            {/* Removed the X button as it duplicates the "Завершить" button */}
          </div>
        </div>

        {/* Training content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Desktop range title */}
            <div className="hidden sm:block text-center">
              <h1 className="text-2xl font-bold mb-2">
                {currentRange.folderName} - {currentRange.name}
              </h1>
              {training.type === 'classic' && (
                <p className="text-muted-foreground">
                  Текущая рука: {currentHand} ({currentHandIndex + 1}/{hands.length})
                </p>
              )}
            </div>

            {training.type === 'classic' ? (
              // Classic training interface
              <div className="space-y-6">
                {/* Poker table */}
                <div className="relative mx-auto w-full max-w-2xl">
                  {/* Table surface */}
                  <div className={cn(
                    "relative bg-poker-felt rounded-full border-8 border-poker-table shadow-2xl transition-all duration-300",
                    "w-full aspect-[3/2] max-w-lg mx-auto",
                    feedback === 'correct' && "shadow-green-500/50",
                    feedback === 'incorrect' && "shadow-red-500/50"
                  )}>
                    {/* Table felt pattern */}
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-poker-felt to-poker-green opacity-90"></div>
                    
                    {/* Dealer position (black circle with cards) */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-black rounded-full p-4 shadow-xl border-4 border-gray-800">
                        <PokerCard hand={currentHand} className="scale-90 sm:scale-100" />
                      </div>
                    </div>
                    
                    {/* Next hand button - positioned right of cards */}
                    {feedback === 'incorrect' && (
                      <div className="absolute top-1/2 right-8 sm:right-12 transform -translate-y-1/2">
                        <Button
                          onClick={proceedToNext}
                          className="bg-gray-500 hover:bg-gray-600 text-white w-[45px] h-[45px] sm:w-[55px] sm:h-[55px] rounded-lg shadow-xl border-2 border-gray-700"
                          size="icon"
                        >
                          <Play className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Table decorative elements */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                      <div className="text-white/60 text-sm font-semibold">DEALER</div>
                    </div>
                  </div>
                  
                  {/* Mobile current hand info */}
                  <div className="sm:hidden text-center mt-4">
                    <p className="text-muted-foreground text-sm">
                      Рука {currentHandIndex + 1} из {hands.length}: <span className="font-bold text-primary">{currentHand}</span>
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-center gap-2 sm:gap-3 flex-wrap px-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleClassicAnswer('fold')}
                    disabled={!!feedback}
                    className={cn(
                      "bg-gray-500 text-white hover:bg-gray-600 text-xs sm:text-sm px-3 sm:px-4",
                      feedback === 'incorrect' && getCorrectAction(currentHand) === 'fold' && "ring-2 ring-green-500"
                    )}
                  >
                    FOLD
                  </Button>
                  {actionButtons.map((button) => (
                    <Button
                      key={button.id}
                      size="sm"
                      onClick={() => handleClassicAnswer(button.id)}
                      disabled={!!feedback}
                      style={getActionButtonStyle(button, actionButtons)}
                      className={cn(
                        "text-white hover:opacity-80 text-xs sm:text-sm px-3 sm:px-4",
                        feedback === 'incorrect' && getCorrectAction(currentHand) === button.id && "ring-2 ring-green-500"
                      )}
                    >
                      {button.name}
                    </Button>
                  ))}
                </div>

                {/* Show correct range if wrong */}
                {showCorrectRange && (
                  <div className="space-y-4">
                    <h3 className="text-center text-lg font-semibold">Правильный ренж:</h3>
                    <div className="overflow-x-auto">
                      <PokerMatrix
                        selectedHands={currentRange.hands}
                        onHandSelect={() => {}}
                        activeAction=""
                        actionButtons={actionButtons}
                        readOnly
                      />
                    </div>
                  </div>
                )}

                {/* Control buttons - always visible */}
                <div className="text-center mt-6">
                  <Button onClick={finishTraining} variant="destructive" size="lg">
                    Завершить
                  </Button>
                </div>
              </div>
            ) : (
              // Border repeat training interface
              <div className="space-y-4 sm:space-y-6">
                <div className="overflow-x-auto pb-4">
                  <PokerMatrix
                    selectedHands={showCorrectRange ? currentRange.hands : userMatrix}
                    onHandSelect={handleMatrixSelect}
                    activeAction={activeAction}
                    actionButtons={actionButtons}
                    readOnly={isChecked}
                  />
                </div>

                {/* Action selection buttons */}
                <div className="flex justify-center gap-2 sm:gap-3 flex-wrap px-2 sm:px-4">
                  <Button
                    variant={activeAction === 'fold' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setActiveAction('fold')}
                    disabled={isChecked}
                    className={cn(
                      "bg-gray-500 text-white hover:bg-gray-600 text-xs sm:text-sm px-2 sm:px-4",
                      activeAction === 'fold' && "ring-2 ring-primary"
                    )}
                  >
                    FOLD
                  </Button>
                  {actionButtons.map((button) => (
                    <Button
                      key={button.id}
                      size="sm"
                      onClick={() => setActiveAction(button.id)}
                      disabled={isChecked}
                      style={{ backgroundColor: button.color }}
                      className={cn(
                        "text-white hover:opacity-80 text-xs sm:text-sm px-2 sm:px-4",
                        activeAction === button.id && "ring-2 ring-white"
                      )}
                    >
                      {button.name}
                    </Button>
                  ))}
                </div>

                {/* Control buttons */}
                <div className="flex justify-center gap-2 sm:gap-4 px-4">
                  <Button
                    onClick={checkBorderRepeat}
                    disabled={isChecked}
                    variant={feedback === 'correct' ? 'default' : feedback === 'incorrect' ? 'destructive' : 'poker'}
                    className={feedback === 'correct' ? 'bg-green-600 hover:bg-green-700' : ''}
                    size="sm"
                  >
                    Проверить
                  </Button>
                  {canProceed && (
                    <Button
                      onClick={proceedToNext}
                      className="bg-gray-500 hover:bg-gray-600 text-white w-8 h-8 rounded-lg shadow-lg border-2 border-gray-700"
                      size="icon"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {/* Завершить тренировку - всегда под кнопками действий */}
                <div className="text-center mt-4">
                  <Button 
                    onClick={finishTraining} 
                    variant="destructive" 
                    size="sm"
                  >
                    Завершить
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile stats footer */}
        <div className="sm:hidden p-3 border-t bg-card">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div className="text-base font-bold text-primary">{formatTime()}</div>
              <div className="text-xs text-muted-foreground">Время</div>
            </div>
            
            <div>
              <div className="text-base font-bold text-primary">{sessionStats.accuracy.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Точность</div>
            </div>
            
            <div>
              <div className="text-base font-bold text-primary">{sessionStats.hands.length}</div>
              <div className="text-xs text-muted-foreground">
                {training.type === 'classic' ? 'Рук' : 'Ренжей'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Training Results Dialog */}
      {trainingResults && (
        <TrainingResultsDialog
          open={showResultsDialog}
          onClose={handleCloseResults}
          results={trainingResults}
        />
      )}
    </div>
  );
};
