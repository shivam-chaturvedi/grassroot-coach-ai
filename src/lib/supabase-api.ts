import { supabase } from "@/lib/supabase";

export type UserRole = "super_admin" | "academy_owner" | "coach" | "analyst" | "player";

export type PlayerRole = "batsman" | "bowler" | "all_rounder" | "wicket_keeper";
export type BattingStyle = "right_hand" | "left_hand";
export type BowlingStyle =
  | "right_arm_fast"
  | "right_arm_medium"
  | "left_arm_fast"
  | "left_arm_medium"
  | "right_arm_off_break"
  | "right_arm_leg_break"
  | "left_arm_spin"
  | "slow_left_arm"
  | "none";

export type MatchFormat = "t10" | "t20" | "odi" | "test" | "practice_match";
export type MatchStatus = "scheduled" | "live" | "completed" | "abandoned" | "cancelled";
export type TossSide = "our_team" | "opponent";
export type TossDecision = "bat_first" | "bowl_first";
export type NotificationType = "match" | "milestone" | "ai" | "alert" | "system";
export type ReportType = "pdf" | "csv" | "xlsx" | "json";
export type SessionType =
  | "batting_nets"
  | "bowling_practice"
  | "match_simulation"
  | "fielding_drills"
  | "fitness_recovery"
  | "team_meeting";
export type RecommendationType =
  | "tactical"
  | "player"
  | "lineup"
  | "bowling"
  | "batting"
  | "fielding"
  | "simulation";
export type PriorityLevel = "low" | "medium" | "high";
export type AcademyJoinRequestStatus = "pending" | "approved" | "rejected";

export type ProfileRow = {
  id: string;
  user_id: string;
  academy_id: string | null;
  full_name: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  bio: string | null;
  is_active: boolean;
  last_sign_in_at: string | null;
};

export type AcademyRow = {
  id: string;
  name: string;
  slug: string;
  founded_year: number | null;
  district_rank: number | null;
  state_rank: number | null;
  currency_code: string;
  revenue_monthly_amount: string;
  revenue_annual_amount: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  address: string | null;
  timezone: string;
};

export type AcademyDirectoryRow = {
  id: string;
  name: string;
  slug: string;
  founded_year: number | null;
  district_rank: number | null;
  state_rank: number | null;
  address: string | null;
};

export type TeamRow = {
  id: string;
  academy_id: string;
  season_id: string | null;
  name: string;
  age_group: string | null;
  level: string | null;
  coach_profile_id: string | null;
  record_wins: number;
  record_losses: number;
  record_draws: number;
};

export type PlayerRow = {
  id: string;
  academy_id: string;
  current_team_id: string | null;
  profile_id: string | null;
  full_name: string;
  short_name: string | null;
  age: number;
  player_role: PlayerRole;
  batting_style: BattingStyle;
  bowling_style: BowlingStyle;
  jersey_number: number;
  position: string | null;
  strength_summary: string | null;
  weakness_summary: string | null;
  fitness_rating: number;
  consistency_rating: number;
  aggression_rating: number;
  photo_url: string | null;
  notes: string | null;
  is_active: boolean;
};

export type MatchRow = {
  id: string;
  academy_id: string;
  team_id: string | null;
  season_id: string | null;
  match_name: string | null;
  opponent_name: string;
  scheduled_at: string;
  match_format: MatchFormat;
  overs: number;
  venue: string | null;
  ground: string | null;
  status: MatchStatus;
  toss_winner_side: TossSide | null;
  toss_decision: TossDecision | null;
  team_runs: number | null;
  team_wickets: number | null;
  opponent_runs: number | null;
  opponent_wickets: number | null;
  result_summary: string | null;
  result_margin_runs: number | null;
  result_margin_wickets: number | null;
  notes: string | null;
};

export type MatchSquadRow = {
  id: string;
  match_id: string;
  player_id: string;
  batting_position: number | null;
  is_selected: boolean;
  is_captain: boolean;
  is_vice_captain: boolean;
  is_available: boolean;
  role_in_match: string | null;
  selection_reason: string | null;
};

export type PlayerMatchStatsRow = {
  id: string;
  match_id: string;
  player_id: string;
  did_bat: boolean;
  did_bowl: boolean;
  batting_order: number | null;
  role_performed: string | null;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  dismissal_type: string | null;
  dismissal_details: string | null;
  ones_taken: number;
  twos_taken: number;
  wickets: number;
  overs_bowled: number;
  runs_conceded: number;
  maidens: number;
  catches: number;
  run_outs: number;
  dot_balls: number;
  stumpings: number;
  dropped_catches: number;
  missed_chances: number;
  bowling_spell: string | null;
  positive_tags: string[];
  mistake_tags: string[];
  self_feedback: string | null;
  improvement_goal: string | null;
  self_confidence_rating: number;
  self_energy_rating: number;
  self_focus_rating: number;
  pressure_handling_rating: number;
  match_impact_rating: number;
  submitted_by_player_at: string | null;
  coach_feedback: string | null;
  coach_action_points: string | null;
  coach_tags: string[];
  coach_rating: number;
  reviewed_by_coach_id: string | null;
  reviewed_at: string | null;
  notes: string | null;
};

export type SeasonStatsRow = {
  id: string;
  player_id: string;
  season_id: string;
  matches: number;
  runs: number;
  batting_average: number;
  strike_rate: number;
  wickets: number;
  fifties: number;
  hundreds: number;
  catches: number;
  maidens: number;
  economy_rate: number;
  highest_score: number;
  best_bowling: string | null;
};

export type NotificationRow = {
  id: string;
  academy_id: string | null;
  recipient_user_id: string | null;
  notification_type: NotificationType;
  title: string;
  message: string;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
};

export type ReportRow = {
  id: string;
  academy_id: string;
  season_id: string | null;
  report_name: string;
  report_type: ReportType;
  file_url: string | null;
  generated_at: string;
};

export type TrainingSessionRow = {
  id: string;
  academy_id: string;
  team_id: string | null;
  season_id: string | null;
  day_of_week: string;
  start_time: string;
  session_name: string;
  session_type: SessionType;
  venue: string | null;
  notes: string | null;
};

export type RecommendationRow = {
  id: string;
  academy_id: string;
  team_id: string | null;
  match_id: string | null;
  recommendation_type: RecommendationType;
  priority: PriorityLevel;
  title: string;
  description: string;
  context: Record<string, unknown>;
  resolved_at: string | null;
};

export type CoachFeedbackRow = {
  id: string;
  academy_id: string;
  player_id: string;
  coach_profile_id: string | null;
  feedback_date: string;
  subject: string | null;
  message: string;
  tags: string[];
};

export type AcademyJoinRequestRow = {
  id: string;
  academy_id: string;
  requester_user_id: string;
  requested_role: UserRole;
  requested_player_role: PlayerRole;
  status: AcademyJoinRequestStatus;
  response_message: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SignupPayload = {
  email: string;
  password: string;
  fullName: string;
};

export type OnboardingPayload = {
  academyName: string;
  academySlug: string;
  foundedYear?: number | null;
};

export type PlayerPayload = {
  fullName: string;
  age: number;
  playerRole: PlayerRole;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  jerseyNumber: number;
  position?: string | null;
  strengthSummary?: string | null;
  weaknessSummary?: string | null;
  notes?: string | null;
  fitnessRating?: number;
  consistencyRating?: number;
  aggressionRating?: number;
};

export type MatchPayload = {
  matchName?: string | null;
  opponentName: string;
  scheduledAt: string;
  matchFormat: MatchFormat;
  overs: number;
  venue?: string | null;
  ground?: string | null;
  tossWinnerSide?: TossSide | null;
  tossDecision?: TossDecision | null;
  teamId?: string | null;
  seasonId?: string | null;
  selectedPlayerIds: string[];
};

export type MatchStatsPayload = {
  matchId: string;
  playerId: string;
  didBat: boolean;
  didBowl: boolean;
  battingOrder?: number | null;
  rolePerformed?: string | null;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  dismissalType?: string | null;
  dismissalDetails?: string | null;
  onesTaken: number;
  twosTaken: number;
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  maidens: number;
  catches: number;
  runOuts: number;
  dotBalls: number;
  stumpings: number;
  droppedCatches: number;
  missedChances: number;
  bowlingSpell?: string | null;
  positiveTags?: string[];
  mistakeTags?: string[];
  selfFeedback?: string | null;
  improvementGoal?: string | null;
  selfConfidenceRating: number;
  selfEnergyRating: number;
  selfFocusRating: number;
  pressureHandlingRating: number;
  matchImpactRating: number;
  coachFeedback?: string | null;
  coachActionPoints?: string | null;
  coachTags?: string[];
  coachRating: number;
  reviewedByCoachId?: string | null;
  notes?: string | null;
};

export type TeamRosterPayload = {
  teamId: string;
  seasonId: string | null;
  roster: Array<{
    playerId: string;
    battingPosition: number;
    isAvailable: boolean;
    isCaptain: boolean;
    isViceCaptain: boolean;
  }>;
};

export async function fetchSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

export async function fetchAcademy(academyId: string) {
  const { data, error } = await supabase
    .from("academies")
    .select("*")
    .eq("id", academyId)
    .maybeSingle();
  if (error) throw error;
  return data as AcademyRow | null;
}

export async function fetchAcademyDirectory(searchTerm = "") {
  const { data, error } = await supabase.rpc("list_academy_directory", {
    search_term: searchTerm.trim() ? searchTerm.trim() : null,
  });
  if (error) throw error;
  return (data ?? []) as AcademyDirectoryRow[];
}

export async function fetchTeams(academyId: string) {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("academy_id", academyId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TeamRow[];
}

export async function fetchPlayers(academyId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("academy_id", academyId)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PlayerRow[];
}

export async function fetchMatches(academyId: string) {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("academy_id", academyId)
    .order("scheduled_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MatchRow[];
}

export async function fetchMatch(matchId: string) {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();
  if (error) throw error;
  return data as MatchRow | null;
}

export async function fetchMatchSquads(matchIds: string[]) {
  if (matchIds.length === 0) return [] as MatchSquadRow[];
  const { data, error } = await supabase
    .from("match_squads")
    .select("*")
    .in("match_id", matchIds);
  if (error) throw error;
  return (data ?? []) as MatchSquadRow[];
}

export async function fetchPlayerMatchStats(matchIds: string[]) {
  if (matchIds.length === 0) return [] as PlayerMatchStatsRow[];
  const { data, error } = await supabase
    .from("player_match_stats")
    .select("*")
    .in("match_id", matchIds);
  if (error) throw error;
  return (data ?? []) as PlayerMatchStatsRow[];
}

export async function fetchPlayerMatchStatsForMatch(matchId: string) {
  const { data, error } = await supabase
    .from("player_match_stats")
    .select("*")
    .eq("match_id", matchId);
  if (error) throw error;
  return (data ?? []) as PlayerMatchStatsRow[];
}

export async function fetchPlayerSeasonStats(playerIds: string[]) {
  if (playerIds.length === 0) return [] as SeasonStatsRow[];
  const { data, error } = await supabase
    .from("player_season_stats")
    .select("*")
    .in("player_id", playerIds);
  if (error) throw error;
  return (data ?? []) as SeasonStatsRow[];
}

export async function fetchTeamRoster(teamId: string) {
  const { data, error } = await supabase
    .from("team_roster")
    .select("*")
    .eq("team_id", teamId)
    .order("batting_position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    team_id: string;
    player_id: string;
    season_id: string | null;
    batting_position: number;
    is_available: boolean;
    is_captain: boolean;
    is_vice_captain: boolean;
    notes: string | null;
  }>;
}

export async function fetchNotifications(userId: string, academyId?: string | null) {
  let query = supabase
    .from("notifications")
    .select("*")
    .or(`recipient_user_id.eq.${userId}${academyId ? `,academy_id.eq.${academyId}` : ""}`)
    .order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

export async function fetchMyJoinRequests() {
  const { data, error } = await supabase
    .from("academy_join_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AcademyJoinRequestRow[];
}

export async function fetchAcademyJoinRequests(academyId: string) {
  const { data, error } = await supabase
    .from("academy_join_requests")
    .select("*")
    .eq("academy_id", academyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AcademyJoinRequestRow[];
}

export async function submitAcademyJoinRequest(academyId: string, playerRole: PlayerRole) {
  const { data, error } = await supabase.rpc("submit_academy_join_request", {
    target_academy_id: academyId,
    target_player_role: playerRole,
  });
  if (error) throw error;
  return data as AcademyJoinRequestRow;
}

export async function reviewAcademyJoinRequest(
  requestId: string,
  decision: AcademyJoinRequestStatus,
  responseMessage?: string | null,
) {
  const { data, error } = await supabase.rpc("review_academy_join_request", {
    p_request_id: requestId,
    p_decision: decision,
    p_response_message: responseMessage ?? null,
  });
  if (error) throw error;
  return data as AcademyJoinRequestRow;
}

export async function fetchReports(academyId: string) {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("academy_id", academyId)
    .order("generated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReportRow[];
}

export async function fetchTrainingSessions(academyId: string) {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("academy_id", academyId)
    .order("day_of_week", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TrainingSessionRow[];
}

export async function fetchRecommendations(academyId: string) {
  const { data, error } = await supabase
    .from("ai_recommendations")
    .select("*")
    .eq("academy_id", academyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RecommendationRow[];
}

export async function fetchCoachFeedback(playerId: string) {
  const { data, error } = await supabase
    .from("coach_feedback")
    .select("*")
    .eq("player_id", playerId)
    .order("feedback_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CoachFeedbackRow[];
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp({ email, password, fullName }: SignupPayload) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        display_name: fullName,
        role: "player",
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function createAcademyOnboarding(userId: string, payload: OnboardingPayload, role: UserRole) {
  const slug = payload.academySlug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const { data: academy, error: academyError } = await supabase
    .from("academies")
    .insert({
      name: payload.academyName,
      slug,
      founded_year: payload.foundedYear ?? null,
      created_by: userId,
    })
    .select("*")
    .single();
  if (academyError) throw academyError;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      academy_id: academy.id,
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (profileError) throw profileError;

  const { error: membershipError } = await supabase
    .from("academy_memberships")
    .update({
      role,
      is_primary: true,
      updated_at: new Date().toISOString(),
    })
    .eq("academy_id", academy.id)
    .eq("user_id", userId);
  if (membershipError) throw membershipError;

  const { error: teamError } = await supabase.from("teams").insert({
    academy_id: academy.id,
    name: "First XI",
    level: "Senior",
  });
  if (teamError) throw teamError;

  return academy as AcademyRow;
}

export async function createPlayer(academyId: string, payload: PlayerPayload) {
  const { data, error } = await supabase
    .from("players")
    .insert({
      academy_id: academyId,
      full_name: payload.fullName,
      short_name: payload.fullName,
      age: payload.age,
      player_role: payload.playerRole,
      batting_style: payload.battingStyle,
      bowling_style: payload.bowlingStyle,
      jersey_number: payload.jerseyNumber,
      position: payload.position ?? null,
      strength_summary: payload.strengthSummary ?? null,
      weakness_summary: payload.weaknessSummary ?? null,
      notes: payload.notes ?? null,
      fitness_rating: payload.fitnessRating ?? 0,
      consistency_rating: payload.consistencyRating ?? 0,
      aggression_rating: payload.aggressionRating ?? 0,
      is_active: true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PlayerRow;
}

export async function updatePlayer(playerId: string, payload: PlayerPayload) {
  const { data, error } = await supabase
    .from("players")
    .update({
      full_name: payload.fullName,
      short_name: payload.fullName,
      age: payload.age,
      player_role: payload.playerRole,
      batting_style: payload.battingStyle,
      bowling_style: payload.bowlingStyle,
      jersey_number: payload.jerseyNumber,
      position: payload.position ?? null,
      strength_summary: payload.strengthSummary ?? null,
      weakness_summary: payload.weaknessSummary ?? null,
      notes: payload.notes ?? null,
      fitness_rating: payload.fitnessRating ?? 0,
      consistency_rating: payload.consistencyRating ?? 0,
      aggression_rating: payload.aggressionRating ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", playerId)
    .select("*")
    .single();
  if (error) throw error;
  return data as PlayerRow;
}

export async function removeAcademyPlayer(playerId: string) {
  const { data, error } = await supabase.rpc("remove_academy_player", {
    p_player_id: playerId,
  });
  if (error) throw error;
  return data as string;
}

export async function createMatch(academyId: string, payload: MatchPayload) {
  const { data, error } = await supabase
    .from("matches")
    .insert({
      academy_id: academyId,
      team_id: payload.teamId ?? null,
      season_id: payload.seasonId ?? null,
      match_name: payload.matchName ?? null,
      opponent_name: payload.opponentName,
      scheduled_at: payload.scheduledAt,
      match_format: payload.matchFormat,
      overs: payload.overs,
      venue: payload.venue ?? null,
      ground: payload.ground ?? null,
      toss_winner_side: payload.tossWinnerSide ?? null,
      toss_decision: payload.tossDecision ?? null,
      status: "scheduled",
    })
    .select("*")
    .single();
  if (error) throw error;

  if (payload.selectedPlayerIds.length > 0) {
    const squads = payload.selectedPlayerIds.map((playerId, index) => ({
      match_id: data.id,
      player_id: playerId,
      batting_position: index + 1,
      is_selected: true,
      is_available: true,
      is_captain: index === 0,
      is_vice_captain: index === 1,
      role_in_match: null,
      selection_reason: null,
    }));
    const { error: squadError } = await supabase.from("match_squads").insert(squads);
    if (squadError) throw squadError;
  }

  return data as MatchRow;
}

export async function completeMatch(
  matchId: string,
  payload: {
    teamRuns: number;
    teamWickets: number;
    opponentRuns: number;
    opponentWickets: number;
    resultSummary: string;
    notes?: string | null;
  },
) {
  const { data, error } = await supabase
    .from("matches")
    .update({
      status: "completed",
      team_runs: payload.teamRuns,
      team_wickets: payload.teamWickets,
      opponent_runs: payload.opponentRuns,
      opponent_wickets: payload.opponentWickets,
      result_summary: payload.resultSummary,
      notes: payload.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId)
    .select("*")
    .single();
  if (error) throw error;
  return data as MatchRow;
}

export async function createMatchStats(payload: MatchStatsPayload) {
  const { data, error } = await supabase
    .from("player_match_stats")
    .upsert({
      match_id: payload.matchId,
      player_id: payload.playerId,
      did_bat: payload.didBat,
      did_bowl: payload.didBowl,
      batting_order: payload.battingOrder ?? null,
      role_performed: payload.rolePerformed ?? null,
      runs: payload.runs,
      balls_faced: payload.ballsFaced,
      fours: payload.fours,
      sixes: payload.sixes,
      dismissal_type: payload.dismissalType ?? null,
      dismissal_details: payload.dismissalDetails ?? null,
      ones_taken: payload.onesTaken,
      twos_taken: payload.twosTaken,
      wickets: payload.wickets,
      overs_bowled: payload.oversBowled,
      runs_conceded: payload.runsConceded,
      maidens: payload.maidens,
      catches: payload.catches,
      run_outs: payload.runOuts,
      dot_balls: payload.dotBalls,
      stumpings: payload.stumpings,
      dropped_catches: payload.droppedCatches,
      missed_chances: payload.missedChances,
      bowling_spell: payload.bowlingSpell ?? null,
      positive_tags: payload.positiveTags ?? [],
      mistake_tags: payload.mistakeTags ?? [],
      self_feedback: payload.selfFeedback ?? null,
      improvement_goal: payload.improvementGoal ?? null,
      self_confidence_rating: payload.selfConfidenceRating,
      self_energy_rating: payload.selfEnergyRating,
      self_focus_rating: payload.selfFocusRating,
      pressure_handling_rating: payload.pressureHandlingRating,
      match_impact_rating: payload.matchImpactRating,
      submitted_by_player_at: new Date().toISOString(),
      coach_feedback: payload.coachFeedback ?? null,
      coach_action_points: payload.coachActionPoints ?? null,
      coach_tags: payload.coachTags ?? [],
      coach_rating: payload.coachRating,
      reviewed_by_coach_id: payload.reviewedByCoachId ?? null,
      reviewed_at: payload.reviewedByCoachId ? new Date().toISOString() : null,
      notes: payload.notes ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "match_id,player_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as PlayerMatchStatsRow;
}

export async function upsertTeamRoster(payload: TeamRosterPayload) {
  const rosterByPlayerId = new Map(payload.roster.map((entry) => [entry.playerId, entry]));
  const cleanRoster = [...rosterByPlayerId.values()].map((entry, index) => ({
    team_id: payload.teamId,
    player_id: entry.playerId,
    season_id: payload.seasonId,
    batting_position: index + 1,
    is_available: entry.isAvailable,
    is_captain: entry.isCaptain,
    is_vice_captain: entry.isViceCaptain,
  }));

  const { error: deleteError } = await supabase
    .from("team_roster")
    .delete()
    .eq("team_id", payload.teamId);
  if (deleteError) throw deleteError;

  if (cleanRoster.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("team_roster")
    .insert(cleanRoster)
    .select("*");
  if (error) throw error;
  return (data ?? []) as MatchSquadRow[];
}

export function formatEnumLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
