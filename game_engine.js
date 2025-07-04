class BatterLifeTracker {
  constructor(lives) {
    this.lives = lives;
    this.lost = 0;
  }

  loseLife() {
    this.lost++;
    return this.lost >= this.lives;
  }

  isOut() {
    return this.lost >= this.lives;
  }
}

class ZeroTracker {
  constructor() {
    this.count = 0;
  }

  useZero() {
    this.count++;
    return this.count > 3;
  }

  reset() {
    this.count = 0;
  }
}

function getMatchConfig(format, over) {
  if (format === "test") {
    return {
      lives: 3,
      wicketValue: 0.33,
      allowFreeHit: false,
    };
  }

  if (format === "odi") {
    const isPP = (over >= 1 && over <= 10) || (over >= 21 && over <= 30) || (over >= 41 && over <= 42);
    return {
      lives: isPP ? 4 : 2,
      wicketValue: isPP ? 0.25 : 0.5,
      allowFreeHit: true,
    };
  }

  // T20 / 10-over / 5-over
  const isPP = over <= (format === "t20" ? 6 : format === "10over" ? 3 : 2);
  return {
    lives: isPP ? 2 : 1,
    wicketValue: isPP ? 0.5 : 1.0,
    allowFreeHit: true,
  };
}

class CricketEngine {
  constructor(format) {
    this.matchFormat = format; // "t20", "odi", or "test"
    this.currentOver = 1;

    this.currentBatter = null;
    this.currentBowler = null;
    this.isFreeHit = false;

    this.batterLives = {};
    this.zeroTrackers = {};
  }

  setPlayers(batter, bowler) {
    this.currentBatter = batter;
    this.currentBowler = bowler;

    const config = getMatchConfig(this.matchFormat, this.currentOver);

    if (!this.batterLives[batter]) this.batterLives[batter] = new BatterLifeTracker(config.lives);
    if (!this.zeroTrackers[batter]) this.zeroTrackers[batter] = new ZeroTracker();
    if (!this.zeroTrackers[bowler]) this.zeroTrackers[bowler] = new ZeroTracker();
  }

  resetZeroTrackers() {
    for (const tracker of Object.values(this.zeroTrackers)) {
      tracker.reset();
    }
    this.logEvent("Zero counters reset for new over");
  }

  nextOver() {
    this.currentOver++;
    this.resetZeroTrackers();
  }

  resolveCards(batCard, bowlCard) {
    const config = getMatchConfig(this.matchFormat, this.currentOver);
    const batter = this.currentBatter;
    const bowler = this.currentBowler;

    let isWicket = false;
    let runs = 0;
    let allowFreeHit = config.allowFreeHit && this.isFreeHit;

    // Same card (wicket scenario)
    if (batCard === bowlCard && batCard !== 0) {
      if (!allowFreeHit) {
        const out = this.batterLives[batter].loseLife();
        if (out) {
          isWicket = true;
          this.logEvent(`${batter} is OUT!`);
        } else {
          this.logEvent(`${batter} lost a life.`);
        }
      } else {
        this.logEvent("Free Hit active — Wicket avoided.");
      }
      this.isFreeHit = false;
    }

    // Double 0 → No Ball + Free Hit + 1 run
    else if (batCard === 0 && bowlCard === 0) {
      runs = 1;
      this.isFreeHit = config.allowFreeHit;
      this.logEvent("Double 0: No Ball + Free Hit + 1 run");
    }

    // Batter 0, Bowler 1–6 → Bowler’s card = runs
    else if (batCard === 0 && bowlCard > 0) {
      runs = bowlCard;
    }

    // Bowler 0, Batter 1–6 → Dot ball
    else if (bowlCard === 0 && batCard > 0) {
      runs = 0;
    }

    // All other combos → Batter’s card = runs
    else {
      runs = batCard;
    }

    // Zero tracker check
    if (batCard === 0) {
      if (this.zeroTrackers[batter].useZero()) {
        runs -= 5;
        this.logEvent(`${batter} penalty: 4th zero! –5 runs`);
      }
    }

    if (bowlCard === 0) {
      if (this.zeroTrackers[bowler].useZero()) {
        this.isFreeHit = config.allowFreeHit;
        this.logEvent(`${bowler} bowled 4th zero: No Ball + Free Hit`);
      }
    }

    return {
      runs,
      isWicket,
    };
  }

  logEvent(msg) {
    console.log(`[HandiCricket] ${msg}`);
  }
}
