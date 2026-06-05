import type {
  BattingStyle,
  BowlingStyle,
  MatchFormat,
  PlayerRole,
  SessionType,
  ReportType,
} from "@/lib/supabase-api";

export const playerRoles: PlayerRole[] = ["batsman", "bowler", "all_rounder", "wicket_keeper"];
export const battingStyles: BattingStyle[] = ["right_hand", "left_hand"];
export const bowlingTypes: BowlingStyle[] = [
  "right_arm_fast",
  "right_arm_medium",
  "left_arm_fast",
  "left_arm_medium",
  "right_arm_off_break",
  "right_arm_leg_break",
  "left_arm_spin",
  "slow_left_arm",
  "none",
];
export const matchTypes: MatchFormat[] = ["t10", "t20", "odi", "test", "practice_match"];
export const sessionTypes: SessionType[] = [
  "batting_nets",
  "bowling_practice",
  "match_simulation",
  "fielding_drills",
  "fitness_recovery",
  "team_meeting",
];
export const reportTypes: ReportType[] = ["pdf", "csv", "xlsx", "json"];

export function labelFromEnum(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
