import { cn } from "@/lib/utils";

interface PokerCardProps {
  hand: string;
  className?: string;
}

export const PokerCard = ({ hand, className }: PokerCardProps) => {
  // Parse hand like "AA", "AKs", "72o" etc.
  const getCardInfo = (hand: string) => {
    if (hand.length === 2) {
      // Pocket pairs like AA, KK, etc.
      return [
        { rank: hand[0], suit: 'spades' },
        { rank: hand[1], suit: 'hearts' }
      ];
    } else if (hand.length === 3) {
      // Suited or offsuit like AKs, AKo
      const suited = hand[2] === 's';
      return [
        { rank: hand[0], suit: suited ? 'spades' : 'spades' },
        { rank: hand[1], suit: suited ? 'spades' : 'hearts' }
      ];
    }
    return [
      { rank: 'A', suit: 'spades' },
      { rank: 'A', suit: 'hearts' }
    ];
  };

  const cards = getCardInfo(hand);

  const getSuitStyles = (suit: string) => {
    switch (suit) {
      case 'hearts':
        return 'bg-red-600 text-white';
      case 'diamonds':
        return 'bg-blue-600 text-white';
      case 'clubs':
        return 'bg-green-600 text-white';
      case 'spades':
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts':
        return '♥';
      case 'diamonds':
        return '♦';
      case 'clubs':
        return '♣';
      case 'spades':
      default:
        return '♠';
    }
  };

  const formatRank = (rank: string) => {
    if (rank === 'T') return '10';
    return rank;
  };

  return (
    <div className={cn("flex gap-1", className)}>
      {cards.map((card, index) => (
        <div
          key={index}
          className={cn(
            "rounded-lg border-2 border-gray-300 shadow-lg w-12 h-16 sm:w-16 sm:h-20 flex items-center justify-center relative",
            getSuitStyles(card.suit)
          )}
        >
          {/* Suit symbol in top-left corner */}
          <div className="absolute top-1 left-1 text-white text-sm sm:text-lg font-bold opacity-90">
            {getSuitSymbol(card.suit)}
          </div>
          
          <div className="text-2xl sm:text-4xl font-bold">
            {formatRank(card.rank)}
          </div>
        </div>
      ))}
    </div>
  );
};
