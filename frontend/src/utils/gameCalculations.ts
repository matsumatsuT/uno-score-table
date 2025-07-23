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

export interface IndividualSettlement {
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  amount: number;
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

export function calculateIndividualSettlements(
  allGamesResults: GameResult[][],
  players: Player[]
): IndividualSettlement[] {
  const settlements: Record<string, number> = {};
  
  // 全ゲームの支払いを集計
  allGamesResults.forEach(gameResults => {
    const payments = calculateGamePayments(gameResults, players);
    
    payments.forEach(payment => {
      const key = `${payment.from}->${payment.to}`;
      settlements[key] = (settlements[key] || 0) + payment.amount;
    });
  });

  // 双方向の支払いをネット化
  const netSettlements: Record<string, number> = {};
  const processed = new Set<string>();
  
  Object.entries(settlements).forEach(([key, amount]) => {
    if (processed.has(key)) return;
    
    const [from, to] = key.split('->');
    const reverseKey = `${to}->${from}`;
    const reverseAmount = settlements[reverseKey] || 0;
    
    if (amount > reverseAmount) {
      netSettlements[key] = amount - reverseAmount;
    } else if (reverseAmount > amount) {
      netSettlements[reverseKey] = reverseAmount - amount;
    }
    
    processed.add(key);
    processed.add(reverseKey);
  });

  // IndividualSettlement形式に変換
  return Object.entries(netSettlements)
    .filter(([, amount]) => amount > 0)
    .map(([key, amount]) => {
      const [fromId, toId] = key.split('->');
      const fromPlayer = players.find(p => p.id === fromId);
      const toPlayer = players.find(p => p.id === toId);
      
      return {
        fromPlayerId: fromId,
        fromPlayerName: fromPlayer?.name || fromId,
        toPlayerId: toId,
        toPlayerName: toPlayer?.name || toId,
        amount
      };
    })
    .sort((a, b) => b.amount - a.amount);
}