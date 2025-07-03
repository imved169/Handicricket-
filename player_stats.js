export class PlayerStats {
  constructor() {
    this.batters = {};
    this.bowlers = {};
    this.teamStats = {};
  }

  updateBatter(team, name, runs, isBoundary, isOut) {
    if (!this.batters[name]) {
      this.batters[name] = { runs: 0, balls: 0, fours: 0, sixes: 0, outs: 0 };
    }
    this.batters[name].runs += runs;
    this.batters[name].balls++;
    if (isBoundary === 4) this.batters[name].fours++;
    if (isBoundary === 6) this.batters[name].sixes++;
    if (isOut) this.batters[name].outs++;

    this.teamStats[team] = this.teamStats[team] || { runs: 0, wickets: 0 };
    this.teamStats[team].runs += runs;
    if (isOut) this.teamStats[team].wickets++;
  }

  updateBowler(team, name, runs, isWicket, isMaiden) {
    if (!this.bowlers[name]) {
      this.bowlers[name] = { runs: 0, balls: 0, wickets: 0, maidens: 0 };
    }
    this.bowlers[name].runs += runs;
    this.bowlers[name].balls++;
    if (isWicket) this.bowlers[name].wickets++;
    if (isMaiden) this.bowlers[name].maidens++;
  }

  getMVP() {
    let mvp = null;
    let maxPoints = 0;

    for (const [name, stats] of Object.entries(this.batters)) {
      const points = stats.runs + (stats.outs * 25);
      if (points > maxPoints) {
        maxPoints = points;
        mvp = name;
      }
    }

    for (const [name, stats] of Object.entries(this.bowlers)) {
      const points = (stats.wickets * 25) - (stats.runs / 10);
      if (points > maxPoints) {
        maxPoints = points;
        mvp = name;
      }
    }

    return mvp;
  }
}
