
export class CricketEngine {
  constructor(format) {
    this.format = format;
    this.runs = 0;
    this.wickets = 0;
    this.isFreeHit = false;
    this.isDeadOver = false;
  }

  resolveCards(batCard, bowlCard) {
    if (this.isFreeHit) return this._resolveFreeHit(batCard);
    if (this.isDeadOver) return this._resolveDeadOver(batCard, bowlCard);
    if (this.format === 'test') return this._resolveTestMatch(batCard, bowlCard);
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
    return this._resolveStandard(batCard, bowlCard);
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
}
