export class AIOpponent {
  constructor(difficulty = "hard") {
    this.difficulty = difficulty;
  }

  playCard(gameState) {
    switch (this.difficulty) {
      case "hard":
        return this.hardAI(gameState);
      case "medium":
        return this.mediumAI();
      default:
        return this.easyAI();
    }
  }

  easyAI() {
    return Math.floor(Math.random() * 7);
  }

  mediumAI() {
    return Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 7);
  }

  hardAI(gameState) {
    const { runs, wickets, ballsLeft, target } = gameState;

    if (target) {
      const runsNeeded = target - runs;

      if (runsNeeded <= ballsLeft) {
        return Math.random() < 0.8 ? 0 : 1;
      } else if (runsNeeded / ballsLeft > 10) {
        return this.getWicketBall();
      } else {
        return Math.random() < 0.6 ? this.getDotBall() : this.getWicketBall();
      }
    } else {
      if (wickets < 3) {
        return Math.random() < 0.7 ? this.getRunBall() : this.getWicketBall();
      } else if (wickets < 6) {
        return Math.random() < 0.5 ? this.getRunBall() : this.getWicketBall();
      } else {
        return Math.random() < 0.3 ? this.getRunBall() : this.getWicketBall();
      }
    }
  }

  getRunBall() {
    return [1, 2, 3, 4][Math.floor(Math.random() * 4)];
  }

  getWicketBall() {
    return [5, 6][Math.floor(Math.random() * 2)];
  }

  getDotBall() {
    return 0;
  }
}
