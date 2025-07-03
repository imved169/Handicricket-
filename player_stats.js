
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

  getMVP() {
    let top = null;
    let maxRuns = 0;
    for (const [name, stats] of Object.entries(this.batters)) {
      if (stats.runs > maxRuns) {
        maxRuns = stats.runs;
        top = name;
      }
    }
    return top;
  }
}
