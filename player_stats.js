export class PlayerStats {
  constructor() {
    this.batters = {};
    this.bowlers = {};
  }

  updateBatter(name, runs, isOut) {
    if (!this.batters[name]) {
      this.batters[name] = { runs: 0, balls: 0, outs: 0 };
    }
    this.batters[name].runs += runs;
    this.batters[name].balls++;
    if (isOut) this.batters[name].outs++;
  }

  updateBowler(name, runs, isWicket) {
    if (!this.bowlers[name]) {
      this.bowlers[name] = { runs: 0, balls: 0, wickets: 0 };
    }
    this.bowlers[name].runs += runs;
    this.bowlers[name].balls++;
    if (isWicket) this.bowlers[name].wickets++;
  }

  getMVP() {
    let topPlayer = null;
    let maxImpact = 0;

    for (const [name, stats] of Object.entries(this.batters)) {
      const impact = stats.runs * (1 - (stats.outs / 10));
      if (impact > maxImpact) {
        maxImpact = impact;
        topPlayer = name;
      }
    }

    return topPlayer || "No MVP";
  }
}
