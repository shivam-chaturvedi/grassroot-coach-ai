import { evaluatePlayerScore, selectBestPlaying11, type BestXIPlayer, type EvaluatedPlayer } from "./player-algorithm";
import type { PlayerMatchStatsRow, PlayerRow, SeasonStatsRow } from "./supabase-api";

export type GeminiTeamInsights = {
  headline: string;
  keyStrengths: string[];
  tacticalRecommendations: string[];
  playerFocus: { player: string; insight: string }[];
  modelUsed: string;
  isAiGenerated: boolean;
};

export type GeminiPlaying11Response = {
  playingXI: BestXIPlayer[];
  aiTacticalOverview: string;
  keySelectionHighlights: string[];
  modelUsed: string;
  isAiGenerated: boolean;
};

function getApiKey(): string | null {
  const key = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
  return key && key.trim() !== "" ? key.trim() : null;
}

function getModelName(): string {
  return import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash-lite";
}

export async function generateGeminiTeamInsights(
  teamName: string,
  players: PlayerRow[],
  seasonStats: SeasonStatsRow[] = [],
  matchStats: PlayerMatchStatsRow[] = [],
): Promise<GeminiTeamInsights> {
  const apiKey = getApiKey();
  const model = getModelName();

  const seasonMap = new Map(seasonStats.map((s) => [s.player_id, s]));
  const statsGrouped = new Map<string, PlayerMatchStatsRow[]>();
  for (const stat of matchStats) {
    const arr = statsGrouped.get(stat.player_id) || [];
    arr.push(stat);
    statsGrouped.set(stat.player_id, arr);
  }

  const evaluated = players.map((p) =>
    evaluatePlayerScore(p, seasonMap.get(p.id), statsGrouped.get(p.id) || []),
  );

  const topScorers = [...evaluated].sort((a, b) => b.compositeScore - a.compositeScore).slice(0, 5);

  if (!apiKey) {
    return {
      headline: `${teamName || "Academy Squad"} displays balanced depth with an average squad score of ${Math.round(
        evaluated.reduce((acc, p) => acc + p.compositeScore, 0) / Math.max(1, evaluated.length),
      )}/100.`,
      keyStrengths: [
        `Strong top-order foundation led by ${topScorers[0]?.full_name || "key batters"}.`,
        `High team average confidence rating across recent match reviews.`,
        `Disciplined bowling economy in current season matches.`,
      ],
      tacticalRecommendations: [
        "Maintain current bowling rotatational spells to preserve death-overs discipline.",
        "Encourage mid-inning rotation of strike against spin bowlers.",
        "Ensure post-match self-feedback forms are submitted within 24 hours of match completion.",
      ],
      playerFocus: topScorers.slice(0, 3).map((p) => ({
        player: p.full_name,
        insight: `Maintain consistency score (${p.compositeScore}/100) with focus on boundary rotation and high coach rating (${p.coachScore}/100).`,
      })),
      modelUsed: "Algorithmic Engine (Local Fallback)",
      isAiGenerated: false,
    };
  }

  const prompt = `You are a world-class head cricket analyst and tactical coach using Gemini 2.5 Flash Lite.
Analyze the following team data for "${teamName || "Academy Squad"}":

Squad Players & Ratings:
${evaluated
  .map(
    (p) =>
      `- ${p.full_name} (${p.player_role}): Composite Rating ${p.compositeScore}/100, Coach Rating ${p.coachScore}/100, Batting Score ${p.battingScore}, Bowling Score ${p.bowlingScore}, Fitness ${p.fitnessScore}`,
  )
  .join("\n")}

Respond ONLY with JSON matching this structure:
{
  "headline": "Brief high-impact single sentence executive summary of squad form",
  "keyStrengths": ["Strength 1", "Strength 2", "Strength 3"],
  "tacticalRecommendations": ["Actionable recommendation 1", "Actionable recommendation 2", "Actionable recommendation 3"],
  "playerFocus": [
    {"player": "Player Name", "insight": "Specific key area for this player"}
  ]
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API HTTP error ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      headline: parsed.headline || "Squad is in optimal shape for upcoming matches.",
      keyStrengths: parsed.keyStrengths || ["Strong team balance", "Solid coach ratings"],
      tacticalRecommendations: parsed.tacticalRecommendations || ["Focus on fielding drills"],
      playerFocus: parsed.playerFocus || [],
      modelUsed: "AI Engine",
      isAiGenerated: true,
    };
  } catch (err) {
    console.warn("Gemini API call failed, using algorithm fallback:", err);
    return {
      headline: `${teamName || "Squad"} performance evaluated across ${evaluated.length} rostered players.`,
      keyStrengths: [
        `Pace & spin bowling balance led by top composite performers.`,
        `Solid overall coach score of ${Math.round(
          evaluated.reduce((acc, p) => acc + p.coachScore, 0) / Math.max(1, evaluated.length),
        )}/100.`,
      ],
      tacticalRecommendations: [
        "Focus training sessions on reducing middle-overs dot ball percentage.",
        "Promote high-performing all-rounders in tight pressure scenarios.",
      ],
      playerFocus: topScorers.slice(0, 3).map((p) => ({
        player: p.full_name,
        insight: `Coach Score: ${p.coachScore} · Composite: ${p.compositeScore}`,
      })),
      modelUsed: "Algorithmic Engine (Fallback)",
      isAiGenerated: false,
    };
  }
}

export async function generateGeminiBestPlaying11(
  players: PlayerRow[],
  seasonStats: SeasonStatsRow[] = [],
  matchStats: PlayerMatchStatsRow[] = [],
): Promise<GeminiPlaying11Response> {
  const apiKey = getApiKey();
  const model = getModelName();

  const seasonMap = new Map(seasonStats.map((s) => [s.player_id, s]));
  const statsGrouped = new Map<string, PlayerMatchStatsRow[]>();
  for (const stat of matchStats) {
    const arr = statsGrouped.get(stat.player_id) || [];
    arr.push(stat);
    statsGrouped.set(stat.player_id, arr);
  }

  const evaluated = players.map((p) =>
    evaluatePlayerScore(p, seasonMap.get(p.id), statsGrouped.get(p.id) || []),
  );

  const squadResult = selectBestPlaying11(evaluated);

  if (!apiKey) {
    return {
      playingXI: squadResult.playingXI,
      aiTacticalOverview: `Selected optimal 11 based on composite player ratings (Avg: ${squadResult.teamBalance.avgCompositeScore}/100) and balanced squad role metrics (${squadResult.teamBalance.battersCount} Batters, ${squadResult.teamBalance.allRoundersCount} All-Rounders, ${squadResult.teamBalance.bowlersCount} Bowlers, ${squadResult.teamBalance.wicketKeepersCount} Wicketkeeper).`,
      keySelectionHighlights: [
        `Top 4 batters selected based on average & strike rate metrics.`,
        `Wicketkeeper assigned to position 5/6 to stabilize middle order.`,
        `Death bowling & powerplay duties distributed to top rated bowlers.`,
      ],
      modelUsed: "Algorithmic Selection Engine",
      isAiGenerated: false,
    };
  }

  const prompt = `You are a cricket head strategist powered by Gemini 2.5 Flash Lite.
Review the following algorithmically selected Playing XI and provide tactical rationale for each player position:

Playing XI:
${squadResult.playingXI
  .map(
    (p) =>
      `Pos ${p.assignedPosition}: ${p.full_name} (${p.player_role}) - Rating ${p.compositeScore}/100 (Coach ${p.coachScore}, Batting ${p.battingScore}, Bowling ${p.bowlingScore})`,
  )
  .join("\n")}

Respond strictly with JSON in this format:
{
  "aiTacticalOverview": "Comprehensive 2-sentence tactical analysis of this Playing 11 combination",
  "keySelectionHighlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
  "playerReasons": {
    "${squadResult.playingXI[0]?.id || "id"}": "Tactical reason for this player at position 1",
    "${squadResult.playingXI[1]?.id || "id"}": "Tactical reason for position 2"
  }
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1000 },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API HTTP error ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    const updatedXI = squadResult.playingXI.map((p) => {
      const customReason = parsed.playerReasons?.[p.id];
      return {
        ...p,
        selectionReason: customReason || p.selectionReason,
      };
    });

    return {
      playingXI: updatedXI,
      aiTacticalOverview: parsed.aiTacticalOverview || "Balanced lineup optimizing powerplay and death overs.",
      keySelectionHighlights: parsed.keySelectionHighlights || ["Optimized batting depth", "Strong bowling options"],
      modelUsed: "AI Engine",
      isAiGenerated: true,
    };
  } catch (err) {
    console.warn("Gemini API Best XI call failed, using algorithm:", err);
    return {
      playingXI: squadResult.playingXI,
      aiTacticalOverview: `Selected 11 based on player performance scores (Avg: ${squadResult.teamBalance.avgCompositeScore}/100).`,
      keySelectionHighlights: [
        "High coach rating selection",
        "Role-balanced 11",
      ],
      modelUsed: "Algorithmic Engine (Fallback)",
      isAiGenerated: false,
    };
  }
}
