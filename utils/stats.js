export function updateBatterStats(stats, batter, run) {
  if (!stats[batter]) stats[batter] = { runs: 0, dots: 0 };
  if (run === 0) stats[batter].dots += 1;
  else stats[batter].runs += run;
}

export function updateBowlerStats(stats, bowler, run, isWicket) {
  if (!stats[bowler]) stats[bowler] = { runs: 0, wickets: 0, balls: 0 };
  stats[bowler].balls += 1;
  stats[bowler].runs += run;
  if (isWicket) stats[bowler].wickets += 1;
}

export function resetPlayerStats() {
  return {};
}
