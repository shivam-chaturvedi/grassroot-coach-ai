import type { PlayerMatchStatsRow, PlayerRow, SeasonStatsRow } from "./supabase-api";

export type EvaluatedPlayer = PlayerRow & {
  compositeScore: number;
  battingScore: number;
  bowlingScore: number;
  coachScore: number;
  playerConfidenceScore: number;
  fitnessScore: number;
  recentImpactScore: number;
  primaryCategory: "batter" | "bowler" | "all_rounder" | "wicket_keeper";
  seasonStats?: SeasonStatsRow;
  matchStatsCount: number;
};

export type BestXIPlayer = EvaluatedPlayer & {
  assignedPosition: number;
  designatedRole: string;
  selectionReason: string;
};

export type BestXISquadResult = {
  playingXI: BestXIPlayer[];
  reserves: EvaluatedPlayer[];
  teamBalance: {
    battersCount: number;
    allRoundersCount: number;
    bowlersCount: number;
    wicketKeepersCount: number;
    avgCompositeScore: number;
    avgCoachScore: number;
  };
};

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function evaluatePlayerScore(
  player: PlayerRow,
  season?: SeasonStatsRow,
  matchStats: PlayerMatchStatsRow[] = [],
): EvaluatedPlayer {
  // 1. Batting Score (0 - 100)
  const avg = Number(season?.batting_average ?? 0);
  const sr = Number(season?.strike_rate ?? 0);
  const runs = season?.runs ?? 0;
  const fifties = season?.fifties ?? 0;

  const avgNorm = Math.min(100, (avg / 50) * 100);
  const srNorm = Math.min(100, (sr / 150) * 100);
  const volumeNorm = Math.min(100, (runs / 300) * 100);
  const battingScore = Math.round(avgNorm * 0.45 + srNorm * 0.35 + volumeNorm * 0.2);

  // 2. Bowling Score (0 - 100)
  const econ = Number(season?.economy_rate ?? 0);
  const wickets = season?.wickets ?? 0;
  const econNorm = econ > 0 ? Math.max(0, Math.min(100, (12 - econ) * 10)) : 50;
  const wicketsNorm = Math.min(100, (wickets / 20) * 100);
  const bowlingScore = Math.round(econNorm * 0.5 + wicketsNorm * 0.5);

  // 3. Coach & Self Ratings (0 - 100)
  const coachRatings = matchStats.map((s) => s.coach_rating).filter((r) => r > 0);
  const coachScore = coachRatings.length > 0 ? Math.round(average(coachRatings) * 10) : 70;

  const confRatings = matchStats.map((s) => s.self_confidence_rating).filter((r) => r > 0);
  const playerConfidenceScore = confRatings.length > 0 ? Math.round(average(confRatings) * 10) : 75;

  const impactRatings = matchStats.map((s) => s.match_impact_rating).filter((r) => r > 0);
  const recentImpactScore = impactRatings.length > 0 ? Math.round(average(impactRatings) * 10) : 70;

  // 4. Fitness & Consistency
  const fitnessScore = Math.round(
    (player.fitness_rating ?? 75) * 0.5 + (player.consistency_rating ?? 75) * 0.5,
  );

  // 5. Determine Primary Category based on style & stats
  const roleLower = (player.player_role || "").toLowerCase();
  let primaryCategory: EvaluatedPlayer["primaryCategory"] = "batter";

  if (roleLower.includes("keeper") || roleLower.includes("wk")) {
    primaryCategory = "wicket_keeper";
  } else if (roleLower.includes("all-rounder") || roleLower.includes("all rounder")) {
    primaryCategory = "all_rounder";
  } else if (roleLower.includes("bowler")) {
    primaryCategory = "bowler";
  } else if (bowlingScore > 65 && battingScore > 50) {
    primaryCategory = "all_rounder";
  } else if (bowlingScore > 70) {
    primaryCategory = "bowler";
  }

  // 6. Weighted Composite Score (0 - 100)
  let compositeScore = 0;
  switch (primaryCategory) {
    case "wicket_keeper":
      compositeScore =
        battingScore * 0.4 +
        coachScore * 0.2 +
        recentImpactScore * 0.15 +
        playerConfidenceScore * 0.15 +
        fitnessScore * 0.1;
      break;
    case "batter":
      compositeScore =
        battingScore * 0.5 +
        coachScore * 0.2 +
        recentImpactScore * 0.15 +
        playerConfidenceScore * 0.1 +
        fitnessScore * 0.05;
      break;
    case "bowler":
      compositeScore =
        bowlingScore * 0.5 +
        coachScore * 0.2 +
        recentImpactScore * 0.15 +
        playerConfidenceScore * 0.1 +
        fitnessScore * 0.05;
      break;
    case "all_rounder":
      compositeScore =
        battingScore * 0.3 +
        bowlingScore * 0.3 +
        coachScore * 0.15 +
        recentImpactScore * 0.15 +
        fitnessScore * 0.1;
      break;
  }

  return {
    ...player,
    compositeScore: Math.min(99, Math.max(40, Math.round(compositeScore))),
    battingScore,
    bowlingScore,
    coachScore,
    playerConfidenceScore,
    fitnessScore,
    recentImpactScore,
    primaryCategory,
    seasonStats: season,
    matchStatsCount: matchStats.length,
  };
}

export function selectBestPlaying11(evaluatedPlayers: EvaluatedPlayer[]): BestXISquadResult {
  if (evaluatedPlayers.length === 0) {
    return {
      playingXI: [],
      reserves: [],
      teamBalance: {
        battersCount: 0,
        allRoundersCount: 0,
        bowlersCount: 0,
        wicketKeepersCount: 0,
        avgCompositeScore: 0,
        avgCoachScore: 0,
      },
    };
  }

  const sorted = [...evaluatedPlayers].sort((a, b) => b.compositeScore - a.compositeScore);

  // Group by primary category
  const keepers = sorted.filter((p) => p.primaryCategory === "wicket_keeper");
  const batters = sorted.filter((p) => p.primaryCategory === "batter");
  const allRounders = sorted.filter((p) => p.primaryCategory === "all_rounder");
  const bowlers = sorted.filter((p) => p.primaryCategory === "bowler");

  const selectedSet = new Set<string>();
  const xi: EvaluatedPlayer[] = [];

  // Step 1: Select Best Wicketkeeper (mandatory 1)
  const bestKeeper = keepers[0] || sorted.find((p) => p.player_role.toLowerCase().includes("keeper")) || sorted[0];
  if (bestKeeper) {
    xi.push(bestKeeper);
    selectedSet.add(bestKeeper.id);
  }

  // Step 2: Select Top 4 Batters
  const topBatters = batters.filter((p) => !selectedSet.has(p.id)).slice(0, 4);
  for (const b of topBatters) {
    xi.push(b);
    selectedSet.add(b.id);
  }

  // Step 3: Select Top 2 All-Rounders
  const topAllRounders = allRounders.filter((p) => !selectedSet.has(p.id)).slice(0, 2);
  for (const ar of topAllRounders) {
    xi.push(ar);
    selectedSet.add(ar.id);
  }

  // Step 4: Select Top 3 Bowlers
  const topBowlers = bowlers.filter((p) => !selectedSet.has(p.id)).slice(0, 3);
  for (const bw of topBowlers) {
    xi.push(bw);
    selectedSet.add(bw.id);
  }

  // Step 5: Fill remaining spots up to 11 from highest remaining composite scores
  const remainingNeeded = Math.min(11 - xi.length, sorted.length - selectedSet.size);
  const remainingAvailable = sorted.filter((p) => !selectedSet.has(p.id));
  for (let i = 0; i < remainingNeeded; i++) {
    const nextBest = remainingAvailable[i];
    if (nextBest) {
      xi.push(nextBest);
      selectedSet.add(nextBest.id);
    }
  }

  // Sort selected XI into tactical batting order (1 to 11)
  const xiBatters = xi.filter((p) => p.primaryCategory === "batter" || p.primaryCategory === "wicket_keeper")
    .sort((a, b) => b.battingScore - a.battingScore);
  const xiAllRounders = xi.filter((p) => p.primaryCategory === "all_rounder")
    .sort((a, b) => b.compositeScore - a.compositeScore);
  const xiBowlers = xi.filter((p) => p.primaryCategory === "bowler")
    .sort((a, b) => b.bowlingScore - a.bowlingScore);
  const others = xi.filter((p) => !xiBatters.includes(p) && !xiAllRounders.includes(p) && !xiBowlers.includes(p));

  const orderedXI: EvaluatedPlayer[] = [...xiBatters, ...xiAllRounders, ...xiBowlers, ...others];

  const bestXIPlayers: BestXIPlayer[] = orderedXI.slice(0, 11).map((player, index) => {
    const pos = index + 1;
    let designatedRole = "Middle Order Batter";
    if (pos === 1 || pos === 2) designatedRole = "Opening Batter";
    else if (pos === 3 || pos === 4) designatedRole = "Top Order Specialist";
    else if (pos === 5 || pos === 6) {
      designatedRole = player.primaryCategory === "wicket_keeper" ? "Wicketkeeper Batter" : "Finisher / All-Rounder";
    } else if (pos >= 7 && pos <= 8) designatedRole = "Bowling All-Rounder";
    else designatedRole = "Specialist Bowler";

    if (player.id === bestKeeper?.id) {
      designatedRole = `${designatedRole} (WK)`;
    }

    const reason = `Rating ${player.compositeScore}/100 · Coach Rating ${player.coachScore}/100 · Batting Score ${player.battingScore} · Bowling Score ${player.bowlingScore}`;

    return {
      ...player,
      assignedPosition: pos,
      designatedRole,
      selectionReason: reason,
    };
  });

  const reserves = sorted.filter((p) => !bestXIPlayers.some((x) => x.id === p.id));

  const teamBalance = {
    battersCount: bestXIPlayers.filter((p) => p.primaryCategory === "batter").length,
    allRoundersCount: bestXIPlayers.filter((p) => p.primaryCategory === "all_rounder").length,
    bowlersCount: bestXIPlayers.filter((p) => p.primaryCategory === "bowler").length,
    wicketKeepersCount: bestXIPlayers.filter((p) => p.primaryCategory === "wicket_keeper").length,
    avgCompositeScore: Math.round(average(bestXIPlayers.map((p) => p.compositeScore))),
    avgCoachScore: Math.round(average(bestXIPlayers.map((p) => p.coachScore))),
  };

  return {
    playingXI: bestXIPlayers,
    reserves,
    teamBalance,
  };
}
