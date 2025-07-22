interface Player {
  id: string;
  name: string;
}

interface GameResult {
  playerId: string;
  points: number;
  isWinner: boolean;
}

export interface PaymentRecord {
  from: string;
  to: string;
  amount: number;
}

export interface PlayerBalance {
  playerId: string;
  playerName: string;
  totalPaid: number;
  totalReceived: number;
  netBalance: number;
}

const POINTS_TO_YEN = 10;

export function calculateGamePayments(results: GameResult[], players: Player[]): PaymentRecord[] {
  const payments: PaymentRecord[] = [];
  const winner = results.find(r => r.isWinner);
  
  if (!winner) return payments;

  results.forEach(result => {
    if (!result.isWinner && result.points > 0) {
      payments.push({
        from: result.playerId,
        to: winner.playerId,
        amount: result.points * POINTS_TO_YEN,
      });
    }
  });

  return payments;
}

export function calculateTotalBalances(
  allGamesResults: GameResult[][],
  players: Player[]
): PlayerBalance[] {
  const balances: Record<string, PlayerBalance> = {};
  
  players.forEach(player => {
    balances[player.id] = {
      playerId: player.id,
      playerName: player.name,
      totalPaid: 0,
      totalReceived: 0,
      netBalance: 0,
    };
  });

  allGamesResults.forEach(gameResults => {
    const payments = calculateGamePayments(gameResults, players);
    
    payments.forEach(payment => {
      balances[payment.from].totalPaid += payment.amount;
      balances[payment.to].totalReceived += payment.amount;
    });
  });

  Object.values(balances).forEach(balance => {
    balance.netBalance = balance.totalReceived - balance.totalPaid;
  });

  return Object.values(balances);
}