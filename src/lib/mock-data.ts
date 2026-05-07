// Mock data for the cricket analytics platform

export const currentUser = {
  name: "Rajesh Kumar",
  role: "coach" as const,
  academy: "Chennai Lions Academy",
  avatar: "RK",
  teamName: "Chennai Lions U-19",
};

export const upcomingMatches = [
  { id: 1, opponent: "Mumbai Tigers", date: "May 12, 2026", time: "09:30 AM", overs: 20, venue: "SMS Ground", status: "upcoming" },
  { id: 2, opponent: "Delhi Warriors", date: "May 18, 2026", time: "02:00 PM", overs: 50, venue: "Chepauk Stadium", status: "upcoming" },
  { id: 3, opponent: "Kolkata Knights", date: "May 25, 2026", time: "10:00 AM", overs: 20, venue: "Eden Gardens B", status: "upcoming" },
];

export const recentMatches = [
  { id: 10, opponent: "Pune Strikers", date: "May 3, 2026", result: "Won by 32 runs", overs: 20, score: "178/4", oppScore: "146/8" },
  { id: 11, opponent: "Hyderabad Hawks", date: "Apr 28, 2026", result: "Lost by 3 wickets", overs: 50, score: "234/9", oppScore: "237/7" },
  { id: 12, opponent: "Bangalore Blasters", date: "Apr 22, 2026", result: "Won by 5 wickets", overs: 20, score: "165/5", oppScore: "162/8" },
];

export const players = [
  { id: 1, name: "Arjun Patel", age: 19, role: "Batsman", battingStyle: "Right-hand", bowlingType: "Right-arm medium", jersey: 7, runs: 1240, avg: 42.8, sr: 138.5, wickets: 2, matches: 34, fifties: 8, hundreds: 3, catches: 12, strengths: "Power hitting, Square cut", weaknesses: "Short ball", position: "Opener", fitness: 88, consistency: 82, aggression: 91 },
  { id: 2, name: "Vikram Singh", age: 21, role: "All-rounder", battingStyle: "Left-hand", bowlingType: "Left-arm spin", jersey: 11, runs: 890, avg: 31.4, sr: 125.2, wickets: 42, matches: 34, fifties: 5, hundreds: 1, catches: 18, strengths: "Spin bowling, Lower order hitting", weaknesses: "Pace bowling", position: "5", fitness: 92, consistency: 78, aggression: 72 },
  { id: 3, name: "Suresh Menon", age: 20, role: "Bowler", battingStyle: "Right-hand", bowlingType: "Right-arm fast", jersey: 22, runs: 120, avg: 8.5, sr: 95.2, wickets: 68, matches: 34, fifties: 0, hundreds: 0, catches: 8, strengths: "Yorkers, Bouncers", weaknesses: "Death overs pressure", position: "10", fitness: 85, consistency: 88, aggression: 85 },
  { id: 4, name: "Rahul Dravid Jr.", age: 18, role: "Batsman", battingStyle: "Right-hand", bowlingType: "Right-arm off-break", jersey: 5, runs: 980, avg: 38.2, sr: 118.4, wickets: 5, matches: 30, fifties: 7, hundreds: 2, catches: 15, strengths: "Technique, Patience", weaknesses: "Spin bowling", position: "3", fitness: 90, consistency: 92, aggression: 55 },
  { id: 5, name: "Kiran Naidu", age: 22, role: "Wicket-keeper", battingStyle: "Right-hand", bowlingType: "None", jersey: 1, runs: 720, avg: 28.8, sr: 132.1, wickets: 0, matches: 34, fifties: 4, hundreds: 1, catches: 45, strengths: "Glovework, Quick stumping", weaknesses: "Bounce", position: "6", fitness: 87, consistency: 75, aggression: 78 },
  { id: 6, name: "Priya Sharma", age: 19, role: "Bowler", battingStyle: "Left-hand", bowlingType: "Left-arm fast", jersey: 33, runs: 85, avg: 7.1, sr: 88.5, wickets: 55, matches: 30, fifties: 0, hundreds: 0, catches: 5, strengths: "Swing bowling, New ball", weaknesses: "Batting", position: "11", fitness: 91, consistency: 84, aggression: 79 },
  { id: 7, name: "Anil Kapoor", age: 20, role: "All-rounder", battingStyle: "Right-hand", bowlingType: "Right-arm leg-break", jersey: 44, runs: 650, avg: 26.0, sr: 112.8, wickets: 38, matches: 32, fifties: 3, hundreds: 0, catches: 14, strengths: "Leg spin, Middle order", weaknesses: "Fast short pitch", position: "7", fitness: 83, consistency: 70, aggression: 68 },
  { id: 8, name: "Deepak Reddy", age: 21, role: "Batsman", battingStyle: "Left-hand", bowlingType: "Slow left-arm", jersey: 18, runs: 1100, avg: 39.3, sr: 128.9, wickets: 8, matches: 33, fifties: 9, hundreds: 2, catches: 10, strengths: "Cover drive, Sweep shot", weaknesses: "Outside off stump", position: "4", fitness: 86, consistency: 85, aggression: 76 },
];

export const teamStats = {
  matches: 34,
  wins: 22,
  losses: 10,
  draws: 2,
  winPercentage: 64.7,
  totalRuns: 5890,
  totalWickets: 218,
  avgScore: 173.2,
  highestScore: 248,
  lowestScore: 98,
};

export const dashboardStats = [
  { label: "Matches", value: "34", change: "+3", trend: "up" },
  { label: "Total Runs", value: "5,890", change: "+412", trend: "up" },
  { label: "Avg Strike Rate", value: "128.4", change: "+2.1", trend: "up" },
  { label: "Wickets", value: "218", change: "+18", trend: "up" },
  { label: "Economy", value: "6.82", change: "-0.3", trend: "down" },
  { label: "Win Rate", value: "64.7%", change: "+4.2%", trend: "up" },
];

export const aiRecommendations = [
  { type: "tactical", title: "Powerplay Strategy", desc: "Increase aggression in overs 1-6. Current PP score rate is 7.2, team average is 8.1.", priority: "high" },
  { type: "player", title: "Arjun Patel — Rest Recommended", desc: "Workload index at 88%. Consider resting for next T20 match.", priority: "medium" },
  { type: "lineup", title: "Batting Order Adjustment", desc: "Move Deepak Reddy to #3 against pace-heavy attacks. His avg vs pace: 52.3", priority: "high" },
  { type: "bowling", title: "Death Overs Rotation", desc: "Use Vikram Singh in overs 17-18. Economy of 6.2 in death overs.", priority: "low" },
];

export const workloadData = [
  { week: "W1", batting: 85, bowling: 72, fielding: 60 },
  { week: "W2", batting: 78, bowling: 80, fielding: 65 },
  { week: "W3", batting: 92, bowling: 68, fielding: 70 },
  { week: "W4", batting: 70, bowling: 85, fielding: 75 },
  { week: "W5", batting: 88, bowling: 75, fielding: 62 },
  { week: "W6", batting: 95, bowling: 70, fielding: 68 },
];

export const strikeRateData = [
  { match: "M1", sr: 128, avg: 125 },
  { match: "M2", sr: 135, avg: 126 },
  { match: "M3", sr: 118, avg: 125 },
  { match: "M4", sr: 142, avg: 128 },
  { match: "M5", sr: 131, avg: 128 },
  { match: "M6", sr: 148, avg: 130 },
  { match: "M7", sr: 125, avg: 129 },
  { match: "M8", sr: 139, avg: 130 },
];

export const winProbData = [
  { over: "1", team: 45, opp: 55 },
  { over: "5", team: 52, opp: 48 },
  { over: "10", team: 61, opp: 39 },
  { over: "15", team: 68, opp: 32 },
  { over: "20", team: 75, opp: 25 },
];

export const leaderboard = [
  { rank: 1, name: "Arjun Patel", stat: "1,240 runs", badge: "Top Scorer" },
  { rank: 2, name: "Suresh Menon", stat: "68 wickets", badge: "Top Wicket-taker" },
  { rank: 3, name: "Deepak Reddy", stat: "39.3 avg", badge: "Most Consistent" },
  { rank: 4, name: "Vikram Singh", stat: "1,432 pts", badge: "MVP" },
  { rank: 5, name: "Kiran Naidu", stat: "45 catches", badge: "Best Fielder" },
];

export const notifications = [
  { id: 1, text: "Match vs Mumbai Tigers in 5 days", time: "2h ago", type: "match" },
  { id: 2, text: "Arjun Patel crossed 1,200 runs milestone", time: "5h ago", type: "milestone" },
  { id: 3, text: "AI suggests changing powerplay strategy", time: "1d ago", type: "ai" },
  { id: 4, text: "Suresh Menon bowling workload high — rest recommended", time: "1d ago", type: "alert" },
];

export const matchTypes = ["T20", "ODI", "T10", "Test", "Practice Match"];
export const battingStyles = ["Right-hand", "Left-hand"];
export const bowlingTypes = ["Right-arm fast", "Right-arm medium", "Left-arm fast", "Left-arm medium", "Right-arm off-break", "Right-arm leg-break", "Left-arm spin", "Slow left-arm", "None"];
export const playerRoles = ["Batsman", "Bowler", "All-rounder", "Wicket-keeper"];

export const academyData = {
  name: "Chennai Lions Academy",
  founded: 2018,
  teams: 4,
  coaches: 6,
  totalPlayers: 72,
  activeSeasons: 8,
  rankings: { district: 3, state: 18 },
  revenue: { monthly: "₹2,45,000", annual: "₹28,40,000" },
};

export const scoutPlayers = [
  { id: 101, name: "Ravi Ashwin Jr.", age: 17, role: "All-rounder", sr: 142.5, consistency: 88, aggression: 82, fitness: 90, district: "Chennai", academy: "Sun Academy" },
  { id: 102, name: "Mohit Sharma", age: 18, role: "Bowler", sr: 78.2, consistency: 91, aggression: 75, fitness: 94, district: "Pune", academy: "Stallions CC" },
  { id: 103, name: "Ananya Rao", age: 16, role: "Batsman", sr: 148.8, consistency: 79, aggression: 95, fitness: 88, district: "Bangalore", academy: "Royal CC" },
  { id: 104, name: "Kabir Khan", age: 19, role: "Batsman", sr: 135.1, consistency: 85, aggression: 88, fitness: 82, district: "Delhi", academy: "Capital Stars" },
];
