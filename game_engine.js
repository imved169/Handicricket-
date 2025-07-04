export class CricketEngine {
  constructor(format) {
    this.format = format;
    this.runs = 0;
    this.wickets = 0;
    this.isFreeHit = false;
    this.isDeadOver = false;
    this.innings = 1;
    this.isTestMatch = format === 'test';
  }

  resolveCards(batCard, bowlCard) {
    if (this.isFreeHit) return this._resolveFreeHit(batCard);
    if (this.isDeadOver) return this._resolveDeadOver(batCard, bowlCard);
    if (this.isTestMatch) return this._resolveTestMatch(batCard, bowlCard);
    return this._resolveStandard(batCard, bowlCard);
  }

  _resolveFreeHit(batCard) {
    this.isFreeHit = false;
    this.runs += parseInt(batCard);
    return { runs: parseInt(batCard), isWicket: false, type: "freehit" };
  }

  _resolveDeadOver(batCard, bowlCard) {
    return { runs: 0, isWicket: false, type: "dead" };
  }

  _resolveTestMatch(batCard, bowlCard) {
    // Special test match rules
    if (batCard === bowlCard) {
      return { runs: 0, isWicket: true, type: "wicket" };
    }
    const runs = parseInt(batCard);
    this.runs += runs;
    return { runs, isWicket: false, type: "normal" };
  }

  _resolveStandard(batCard, bowlCard) {
    if (batCard === bowlCard) {
      this.wickets += 1;
      return { runs: 0, isWicket: true, type: "wicket" };
    }
    const runs = parseInt(batCard);
    this.runs += runs;
    return { runs, isWicket: false, type: "normal" };
  }

  shouldEndInning(totalOvers, ballsBowled, totalWickets) {
    if (this.isTestMatch) {
      return this.wickets >= totalWickets;
    }
    return this.wickets >= totalWickets || ballsBowled >= totalOvers * 6;
  }

  nextInning() {
    if (!this.isTestMatch && this.innings >= 2) {
      return false; // Game over for limited overs
    }
    if (this.isTestMatch && this.innings >= 4) {
      return false; // Game over for test match
    }
    
    this.innings++;
    this.runs = 0;
    this.wickets = 0;
    this.isFreeHit = false;
    return true;
  }
}
