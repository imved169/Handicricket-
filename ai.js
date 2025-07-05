// ai.js - AI opponent logic
export class AIOpponent {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
    this.lastPlay = null;
    this.pattern = [];
    this.currentPatternIndex = 0;
  }

  makeDecision(gameState) {
    // Game state includes: runs, wickets, balls left, target (if 2nd innings)
    let decision;
    
    switch(this.difficulty) {
      case 'easy':
        decision = this.easyAI();
        break;
      case 'medium':
        decision = this.mediumAI(gameState);
        break;
      case 'hard':
        decision = this.hardAI(gameState);
        break;
      default:
        decision = this.mediumAI(gameState);
    }
    
    this.lastPlay = decision;
    return decision;
  }

  easyAI() {
    // Random plays with slight bias toward 0,1,2
    const options = [0,0,1,1,2,2,3,4,5,6];
    return options[Math.floor(Math.random() * options.length)];
  }

  mediumAI(gameState) {
    // More strategic - responds to game situation
    const { runs, wickets, ballsLeft, target } = gameState;
    
    if (target) {
      // Bowling in 2nd innings - defensive when ahead
      const runsNeeded = target - runs;
      const requiredRate = runsNeeded / (ballsLeft / 6);
      
      if (requiredRate > 8) {
        // Aggressive bowling - more wickets
        return this.getWicketBall();
      } else if (requiredRate > 4) {
        // Mixed strategy
        return Math.random() < 0.6 ? this.getWicketBall() : this.getDotBall();
      } else {
        // Defensive - contain runs
        return this.getDotBall();
      }
    } else {
      // Batting or bowling in 1st innings
      if (wickets < 3) {
        // Early innings - build foundation
        return Math.random() < 0.7 ? this.getRunBall() : this.getWicketBall();
      } else if (wickets < 6) {
        // Middle overs - balance
        return Math.random() < 0.5 ? this.getRunBall() : this.getWicketBall();
      } else {
        // Death overs - aggressive
        return Math.random() < 0.3 ? this.getRunBall() : this.getWicketBall();
      }
    }
  }

  hardAI(gameState) {
    // Advanced pattern recognition and counter-play
    if (this.pattern.length === 0 || this.currentPatternIndex >= this.pattern.length) {
      this.generatePattern(gameState);
      this.currentPatternIndex = 0;
    }
    
    const decision = this.pattern[this.currentPatternIndex];
    this.currentPatternIndex++;
    return decision;
  }

  getWicketBall() {
    // Returns 1-6 with higher probability for middle numbers
    const options = [1,2,3,3,4,4,5,5,6];
    return options[Math.floor(Math.random() * options.length)];
  }

  getDotBall() {
    // Returns 0 with 70% chance, otherwise low numbers
    return Math.random() < 0.7 ? 0 : 
           Math.random() < 0.5 ? 1 : 2;
  }

  getRunBall() {
    // Returns 1-6 with higher probability for boundary shots
    const options = [1,2,3,4,4,5,5,6,6,6];
    return options[Math.floor(Math.random() * options.length)];
  }

  generatePattern(gameState) {
    // Creates a sequence of 3-5 plays based on game situation
    this.pattern = [];
    const patternLength = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < patternLength; i++) {
      if (gameState.ballsLeft < 10 && gameState.target) {
        // Death bowling - yorkers and slower balls
        this.pattern.push(Math.random() < 0.6 ? 0 : 1);
      } else {
        // Normal play
        this.pattern.push(this.mediumAI(gameState));
      }
    }
  }
}
