export function checkFollowOn(team1Total, team2Total) {
  return (team1Total - team2Total) >= 200;
}

export function getInningsResult(runs1, runs2, runs3, runs4) {
  const team1Total = runs1 + runs3;
  const team2Total = runs2 + runs4;

  if (runs4 !== null) {
    if (team1Total > team2Total) return 'Team 1 wins';
    if (team2Total > team1Total) return 'Team 2 wins';
    return 'Draw';
  }
  return 'In Progress';
}

export function shouldStartInnings(currentInnings, team1, team2) {
  const conditions = [
    currentInnings === 1 && team1.allOut,
    currentInnings === 2 && team2.allOut,
    currentInnings === 3 && team1.allOut,
    currentInnings === 4 && team2.allOut
  ];
  return conditions.includes(true);
}
