// ai.js - AI opponent logic for toss and game decisions
export class AIOpponent {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
    this.lastPlay = null;
    this.pattern = [];
    this.currentPatternIndex = 0;
    this.playerPattern = [];
    this.learningRate = 0.1;
    this.memorySize = 5;
  }

  makeTossDecision(gameState) {
    const { format } = gameState;
    
    if (format === '5' || format === '10' || format === '20') {
      return Math.random() < 0.7 ? 'bat' : 'bowl';
    } else {
      return Math.random() < 0.3 ? 'bat' : 'bowl';
    }
  }

  makeDecision(gameState) {
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
    
    this.rememberPlayerMove(gameState.lastPlayerMove);
    this.lastPlay = decision;
    return decision;
  }

  easyAI() {
    const options = [0,0,1,1,2,2,3,4,5,6];
    return options[Math.floor(Math.random() * options.length)];
  }

  mediumAI(gameState) {
    const { runs, wickets, ballsLeft, target, lastPlayerMove } = gameState;
    
    if (target) {
      const runsNeeded = target - runs;
      const requiredRate = runsNeeded / (ballsLeft / 6);
      
      if (requiredRate > 8) {
        return this.getWicketBall();
      } else if (requiredRate > 4) {
        return Math.random() < 0.6 ? this.getWicketBall() : this.getDotBall();
      } else {
        return this.getDotBall();
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

  hardAI(gameState) {
    if (this.pattern.length === 0 || this.currentPatternIndex >= this.pattern.length) {
      this.generatePattern(gameState);
      this.currentPatternIndex = 0;
    }
    
    if (this.playerPattern.length >= 3) {
      const playerTrend = this.analyzePlayerPattern();
      if (playerTrend === 'defensive') {
        this.pattern[this.currentPatternIndex] = Math.min(6, this.pattern[this.currentPatternIndex] + 1);
      } else if (playerTrend === 'aggressive') {
        this.pattern[this.currentPatternIndex] = Math.max(0, this.pattern[this.currentPatternIndex] - 1);
      }
    }
    
    const decision = this.pattern[this.currentPatternIndex];
    this.currentPatternIndex++;
    return decision;
  }

  rememberPlayerMove(move) {
    if (move !== undefined && move !== null) {
      this.playerPattern.push(move);
      if (this.playerPattern.length > this.memorySize) {
        this.playerPattern.shift();
      }
    }
  }

  analyzePlayerPattern() {
    const avg = this.playerPattern.reduce((a, b) => a + b, 0) / this.playerPattern.length;
    if (avg < 2) return 'defensive';
    if (avg > 4) return 'aggressive';
    return 'balanced';
  }

  getWicketBall() {
    const options = [1,2,3,3,4,4,5,5,6];
    return options[Math.floor(Math.random() * options.length)];
  }

  getDotBall() {
    return Math.random() < 0.7 ? 0 : 
           Math.random() < 0.5 ? 1 : 2;
  }

  getRunBall() {
    const options = [1,2,3,4,4,5,5,6,6,6];
    return options[Math.floor(Math.random() * options.length)];
  }

  generatePattern(gameState) {
    this.pattern = [];
    const patternLength = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < patternLength; i++) {
      if (gameState.ballsLeft < 10 && gameState.target) {
        this.pattern.push(Math.random() < 0.6 ? 0 : 1);
      } else if (gameState.ballsLeft < 30 && !gameState.target) {
        this.pattern.push(Math.random() < 0.5 ? this.getWicketBall() : this.getRunBall());
      } else {
        const base = this.mediumAI(gameState);
        const variation = Math.floor(Math.random() * 3) - 1;
        this.pattern.push(Math.max(0, Math.min(6, base + variation)));
      }
    }
  }

  getConfidence() {
    if (this.difficulty === 'easy') return 0.4 + Math.random() * 0.3;
    if (this.difficulty === 'medium') return 0.6 + Math.random() * 0.3;
    
    if (this.playerPattern.length < 3) return 0.7;
    
    const playerTrend = this.analyzePlayerPattern();
    if (playerTrend === 'balanced') return 0.8;
    return 0.9;
  }

  getCurrentStrategy() {
    if (this.difficulty === 'easy') return "Random";
    
    const lastMove = this.lastPlay;
    if (lastMove === 0) return "Defensive (Dot Ball)";
    if (lastMove === 6) return "Aggressive (Boundary)";
    if (lastMove >= 4) return "Attacking";
    if (lastMove <= 2) return "Containment";
    return "Balanced";
  }
}
