// AI Opponent logic for HandiCricket
class AIOpponent {
  constructor(difficulty = 'medium', format = '20', callbacks = {}) {
    this.difficulty = difficulty;
    this.format = format;
    this.callbacks = {
      onMove: callbacks.onMove || (() => {}),
      onThinking: callbacks.onThinking || (() => {}),
      onInsight: callbacks.onInsight || (() => {}),
      onError: callbacks.onError || (() => {})
    };
    
    // AI personality based on difficulty
    this.personality = this.getPersonality(difficulty);
    
    // Game analysis data
    this.gameHistory = [];
    this.playerTendencies = {
      mostUsedNumbers: {},
      patterns: [],
      recentChoices: [],
      aggressiveness: 0.5
    };
    
    // AI state
    this.confidence = 0.5;
    this.currentStrategy = 'balanced';
    this.adaptationLevel = 0;
    
    // Decision tree weights
    this.decisionWeights = this.getDecisionWeights(difficulty);
    
    // Think time simulation
    this.thinkTimeRange = this.getThinkTimeRange(difficulty);
  }

  getPersonality(difficulty) {
    const personalities = {
      easy: {
        randomness: 0.7,
        adaptation: 0.1,
        aggression: 0.3,
        patternRecognition: 0.2,
        riskTaking: 0.4,
        strategyConsistency: 0.3
      },
      medium: {
        randomness: 0.4,
        adaptation: 0.5,
        aggression: 0.5,
        patternRecognition: 0.6,
        riskTaking: 0.5,
        strategyConsistency: 0.6
      },
      hard: {
        randomness: 0.2,
        adaptation: 0.8,
        aggression: 0.7,
        patternRecognition: 0.8,
        riskTaking: 0.6,
        strategyConsistency: 0.8
      },
      expert: {
        randomness: 0.1,
        adaptation: 0.9,
        aggression: 0.8,
        patternRecognition: 0.9,
        riskTaking: 0.7,
        strategyConsistency: 0.9
      }
    };
    
    return personalities[difficulty] || personalities.medium;
  }

  getDecisionWeights(difficulty) {
    const baseWeights = {
      situational: 1.0,      // Current game situation
      historical: 0.5,       // Past performance in similar situations
      pattern: 0.3,          // Player pattern recognition
      psychological: 0.2,    // Psychological factors
      random: 0.1           // Random factor
    };
    
    // Adjust weights based on difficulty
    switch (difficulty) {
      case 'easy':
        return {
          ...baseWeights,
          random: 0.5,
          pattern: 0.1,
          psychological: 0.1
        };
      case 'hard':
        return {
          ...baseWeights,
          pattern: 0.7,
          psychological: 0.5,
          random: 0.05
        };
      case 'expert':
        return {
          ...baseWeights,
          pattern: 0.9,
          psychological: 0.8,
          historical: 0.8,
          random: 0.02
        };
      default:
        return baseWeights;
    }
  }

  getThinkTimeRange(difficulty) {
    const ranges = {
      easy: [500, 1500],     // 0.5-1.5 seconds
      medium: [1000, 2500],  // 1-2.5 seconds
      hard: [1500, 3500],    // 1.5-3.5 seconds
      expert: [2000, 4000]   // 2-4 seconds
    };
    
    return ranges[difficulty] || ranges.medium;
  }

  async makeMove(gameContext) {
    try {
      // Show thinking indicator
      this.callbacks.onThinking(true, this.getThinkingMessage(gameContext));
      
      // Simulate thinking time
      const thinkTime = Math.random() * 
        (this.thinkTimeRange[1] - this.thinkTimeRange[0]) + 
        this.thinkTimeRange[0];
      
      await this.delay(thinkTime);
      
      // Analyze game context
      const analysis = this.analyzeGameSituation(gameContext);
      
      // Update player tendencies
      this.updatePlayerTendencies(gameContext);
      
      // Make decision
      const choice = this.makeDecision(gameContext, analysis);
      
      // Update AI state
      this.updateAIState(gameContext, choice);
      
      // Generate reasoning
      const reasoning = this.generateReasoning(gameContext, analysis, choice);
      
      // Hide thinking indicator
      this.callbacks.onThinking(false);
      
      // Record move in history
      this.gameHistory.push({
        gameContext: { ...gameContext },
        choice: choice,
        reasoning: reasoning,
        confidence: this.confidence,
        timestamp: Date.now()
      });
      
      // Trigger callbacks
      this.callbacks.onMove(choice, reasoning);
      this.callbacks.onInsight({
        confidence: this.confidence,
        strategy: this.currentStrategy,
        reasoning: reasoning,
        prediction: this.predictPlayerMove(gameContext)
      });
      
      return choice;
      
    } catch (error) {
      this.callbacks.onError('AI decision error: ' + error.message);
      // Fallback to random choice
      return Math.floor(Math.random() * 7);
    }
  }

  analyzeGameSituation(context) {
    const analysis = {
      phase: this.getGamePhase(context),
      pressure: this.calculatePressure(context),
      momentum: this.calculateMomentum(context),
      riskLevel: this.calculateRiskLevel(context),
      opportunity: this.calculateOpportunity(context),
      playerPattern: this.analyzePlayerPattern(context)
    };
    
    // Calculate overall situation score
    analysis.situationScore = this.calculateSituationScore(analysis);
    
    return analysis;
  }

  getGamePhase(context) {
    const { overs, balls, target, innings } = context;
    const totalOvers = this.getFormatOvers();
    const oversCompleted = overs + (balls / 6);
    const progressPct = (oversCompleted / totalOvers) * 100;
    
    if (innings === 1) {
      if (progressPct <= 30) return 'early';
      if (progressPct <= 70) return 'middle';
      return 'death';
    } else {
      if (target && context.runs < target * 0.3) return 'building';
      if (target && context.runs > target * 0.8) return 'finishing';
      return 'middle_chase';
    }
  }

  calculatePressure(context) {
    let pressure = 0;
    
    // Time pressure
    if (context.innings === 2 && context.target) {
      const ballsLeft = (this.getFormatOvers() * 6) - context.balls;
      const runsNeeded = context.target - context.runs;
      const requiredRate = ballsLeft > 0 ? (runsNeeded / (ballsLeft / 6)) : 0;
      
      if (requiredRate > 12) pressure += 0.8;
      else if (requiredRate > 8) pressure += 0.5;
      else if (requiredRate > 6) pressure += 0.3;
    }
    
    // Wicket pressure
    const wicketsLeft = 10 - Math.floor(context.wickets);
    if (wicketsLeft <= 3) pressure += 0.6;
    else if (wicketsLeft <= 5) pressure += 0.3;
    
    // Lives pressure (HandiCricket specific)
    if (context.batterLives <= 1) pressure += 0.4;
    
    return Math.min(pressure, 1.0);
  }

  calculateMomentum(context) {
    if (this.gameHistory.length < 3) return 0.5;
    
    const recentBalls = this.gameHistory.slice(-5);
    let momentum = 0;
    
    recentBalls.forEach(ball => {
      if (ball.gameContext.runs > context.runs) {
        // Recent scoring
        momentum += 0.2;
      }
      if (ball.gameContext.wickets > context.wickets) {
        // Recent wicket
        momentum -= 0.3;
      }
    });
    
    return Math.max(0, Math.min(1, 0.5 + momentum));
  }

  calculateRiskLevel(context) {
    let risk = 0;
    
    // Format-based risk
    const formatRisk = {
      '5': 0.7,   // High risk in short format
      '10': 0.6,
      '20': 0.5,
      '50': 0.3,
      'test': 0.2
    };
    risk += formatRisk[context.format] || 0.5;
    
    // Situation-based risk
    if (context.isPowerplay) risk += 0.2;
    if (context.isDeadOver) risk += 0.3;
    if (context.freeHit) risk -= 0.4; // Lower risk on free hit
    
    // Phase-based risk
    const phase = this.getGamePhase(context);
    const phaseRisk = {
      'early': 0.2,
      'middle': 0.4,
      'death': 0.8,
      'building': 0.3,
      'middle_chase': 0.5,
      'finishing': 0.9
    };
    risk += phaseRisk[phase] || 0.4;
    
    return Math.max(0, Math.min(1, risk));
  }

  calculateOpportunity(context) {
    let opportunity = 0.5;
    
    // Special conditions
    if (context.freeHit) opportunity += 0.4;
    if (context.isPowerplay) opportunity += 0.2;
    if (context.isDeadOver) opportunity += 0.3;
    
    // Bowling analysis (if available)
    if (context.bowlerStats) {
      const economy = context.bowlerStats.economy || 6;
      if (economy > 8) opportunity += 0.2;
      else if (economy < 4) opportunity -= 0.2;
    }
    
    return Math.max(0, Math.min(1, opportunity));
  }

  analyzePlayerPattern(context) {
    if (this.playerTendencies.recentChoices.length < 3) {
      return { predictability: 0.1, nextMove: 3 };
    }
    
    const recent = this.playerTendencies.recentChoices.slice(-5);
    const patterns = this.detectPatterns(recent);
    
    let predictability = 0;
    let nextMove = 3;
    
    // Check for repeating patterns
    if (patterns.isRepeating) {
      predictability = 0.8;
      nextMove = recent[recent.length - 1];
    } else if (patterns.isAlternating) {
      predictability = 0.6;
      nextMove = patterns.nextInSequence;
    } else if (patterns.isAscending || patterns.isDescending) {
      predictability = 0.4;
      nextMove = patterns.nextInSequence;
    }
    
    // Adjust based on AI's pattern recognition ability
    predictability *= this.personality.patternRecognition;
    
    return { predictability, nextMove, patterns };
  }

  detectPatterns(choices) {
    if (choices.length < 3) return { isRandom: true };
    
    const last3 = choices.slice(-3);
    
    // Check for repeating
    if (last3[0] === last3[1] && last3[1] === last3[2]) {
      return { isRepeating: true, nextInSequence: last3[0] };
    }
    
    // Check for alternating
    if (choices.length >= 4) {
      const last4 = choices.slice(-4);
      if (last4[0] === last4[2] && last4[1] === last4[3] && last4[0] !== last4[1]) {
        return { isAlternating: true, nextInSequence: last4[0] };
      }
    }
    
    // Check for ascending/descending
    if (last3[0] < last3[1] && last3[1] < last3[2]) {
      const nextValue = Math.min(6, last3[2] + (last3[2] - last3[1]));
      return { isAscending: true, nextInSequence: nextValue };
    }
    
    if (last3[0] > last3[1] && last3[1] > last3[2]) {
      const nextValue = Math.max(0, last3[2] - (last3[1] - last3[2]));
      return { isDescending: true, nextInSequence: nextValue };
    }
    
    return { isRandom: true };
  }

  calculateSituationScore(analysis) {
    // Combine all factors into a single score
    let score = 0.5; // Base neutral score
    
    // Adjust based on pressure (higher pressure = more conservative)
    score -= analysis.pressure * 0.3;
    
    // Adjust based on opportunity (higher opportunity = more aggressive)
    score += analysis.opportunity * 0.3;
    
    // Adjust based on momentum
    score += (analysis.momentum - 0.5) * 0.2;
    
    // Risk adjustment based on AI personality
    const riskAdjustment = (analysis.riskLevel - 0.5) * this.personality.riskTaking;
    score += riskAdjustment * 0.2;
    
    return Math.max(0, Math.min(1, score));
  }

  makeDecision(context, analysis) {
    // Determine base strategy
    this.currentStrategy = this.determineStrategy(context, analysis);
    
    // Get strategy-specific probabilities
    const probabilities = this.getStrategyProbabilities(this.currentStrategy, context, analysis);
    
    // Apply player pattern recognition
    if (analysis.playerPattern.predictability > 0.5) {
      const predictedMove = analysis.playerPattern.nextMove;
      probabilities[predictedMove] *= 0.1; // Avoid predicted move
      
      // Redistribute probability
      const totalOtherProb = probabilities.reduce((sum, prob, i) => 
        i === predictedMove ? sum : sum + prob, 0);
      const boost = probabilities[predictedMove] * 0.9 / totalOtherProb;
      
      probabilities.forEach((prob, i) => {
        if (i !== predictedMove) {
          probabilities[i] = prob + (prob * boost);
        }
      });
    }
    
    // Apply randomness based on difficulty
    this.applyRandomness(probabilities);
    
    // Select choice based on probabilities
    const choice = this.selectFromProbabilities(probabilities);
    
    // Update confidence
    this.confidence = this.calculateConfidence(context, analysis, choice);
    
    return choice;
  }

  determineStrategy(context, analysis) {
    const { phase, pressure, opportunity, riskLevel } = analysis;
    
    // Base strategy on game phase
    if (phase === 'early' || phase === 'building') {
      return pressure > 0.6 ? 'aggressive' : 'conservative';
    } else if (phase === 'middle' || phase === 'middle_chase') {
      return 'balanced';
    } else if (phase === 'death' || phase === 'finishing') {
      return opportunity > 0.6 ? 'aggressive' : 'defensive';
    }
    
    // Adjust based on special conditions
    if (context.freeHit) return 'aggressive';
    if (context.batterLives <= 1) return 'defensive';
    if (context.isPowerplay) return 'aggressive';
    
    return 'balanced';
  }

  getStrategyProbabilities(strategy, context, analysis) {
    const baseProbabilities = [0.1, 0.15, 0.15, 0.2, 0.15, 0.15, 0.1]; // 0-6
    
    switch (strategy) {
      case 'aggressive':
        return [0.05, 0.1, 0.1, 0.15, 0.2, 0.2, 0.2]; // Favor higher numbers
      
      case 'defensive':
        return [0.3, 0.25, 0.2, 0.15, 0.05, 0.03, 0.02]; // Favor lower numbers
      
      case 'conservative':
        return [0.2, 0.2, 0.2, 0.2, 0.1, 0.05, 0.05]; // Favor safe choices
      
      case 'balanced':
      default:
        return baseProbabilities;
    }
  }

  applyRandomness(probabilities) {
    const randomFactor = this.personality.randomness;
    const uniformProb = 1 / probabilities.length;
    
    probabilities.forEach((prob, i) => {
      probabilities[i] = prob * (1 - randomFactor) + uniformProb * randomFactor;
    });
  }

  selectFromProbabilities(probabilities) {
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i];
      if (random <= cumulative) {
        return i;
      }
    }
    
    return probabilities.length - 1; // Fallback
  }

  calculateConfidence(context, analysis, choice) {
    let confidence = 0.5;
    
    // Higher confidence in familiar situations
    if (this.gameHistory.length > 10) {
      const similarSituations = this.gameHistory.filter(h => 
        Math.abs(h.gameContext.runs - context.runs) < 20 &&
        Math.abs(h.gameContext.wickets - context.wickets) < 2
      );
      
      if (similarSituations.length > 3) {
        confidence += 0.2;
      }
    }
    
    // Confidence based on pattern recognition
    if (analysis.playerPattern.predictability > 0.7) {
      confidence += 0.3;
    }
    
    // Confidence based on special conditions
    if (context.freeHit || context.isPowerplay) {
      confidence += 0.1;
    }
    
    // Adjust based on difficulty
    confidence *= this.personality.strategyConsistency;
    
    return Math.max(0.1, Math.min(0.9, confidence));
  }

  updatePlayerTendencies(context) {
    // This would be called with the player's actual choice after they make it
    if (context.playerChoice !== undefined) {
      this.playerTendencies.recentChoices.push(context.playerChoice);
      
      // Keep only recent choices
      if (this.playerTendencies.recentChoices.length > 20) {
        this.playerTendencies.recentChoices.shift();
      }
      
      // Update most used numbers
      this.playerTendencies.mostUsedNumbers[context.playerChoice] = 
        (this.playerTendencies.mostUsedNumbers[context.playerChoice] || 0) + 1;
      
      // Update patterns
      if (this.playerTendencies.recentChoices.length >= 3) {
        const patterns = this.detectPatterns(this.playerTendencies.recentChoices);
        this.playerTendencies.patterns.push(patterns);
        
        // Keep only recent patterns
        if (this.playerTendencies.patterns.length > 10) {
          this.playerTendencies.patterns.shift();
        }
      }
      
      // Update aggressiveness
      const avgChoice = this.playerTendencies.recentChoices.reduce((a, b) => a + b, 0) / 
                       this.playerTendencies.recentChoices.length;
      this.playerTendencies.aggressiveness = avgChoice / 6;
    }
  }

  updateAIState(context, choice) {
    // Adapt based on game outcome (would be called after result is known)
    this.adaptationLevel = Math.min(1.0, this.adaptationLevel + 0.1);
    
    // Update strategy consistency
    if (this.gameHistory.length > 5) {
      const recentStrategies = this.gameHistory.slice(-5).map(h => h.reasoning);
      // Analyze strategy consistency and adjust
    }
  }

  generateReasoning(context, analysis, choice) {
    const reasons = [];
    
    // Primary reasoning based on strategy
    switch (this.currentStrategy) {
      case 'aggressive':
        reasons.push(`Going aggressive - ${this.getAggressiveReason(context, choice)}`);
        break;
      case 'defensive':
        reasons.push(`Playing safe - ${this.getDefensiveReason(context, choice)}`);
        break;
      case 'conservative':
        reasons.push(`Being conservative - ${this.getConservativeReason(context, choice)}`);
        break;
      default:
        reasons.push(`Balanced approach - choosing ${choice} for equilibrium`);
    }
    
    // Add contextual reasoning
    if (context.freeHit) {
      reasons.push('Free hit opportunity');
    }
    if (context.isPowerplay) {
      reasons.push('Powerplay advantage');
    }
    if (context.isDeadOver) {
      reasons.push('Dead over situation');
    }
    if (analysis.playerPattern.predictability > 0.6) {
      reasons.push(`Avoiding player's likely choice: ${analysis.playerPattern.nextMove}`);
    }
    
    return reasons.join(', ');
  }

  getAggressiveReason(context, choice) {
    const reasons = [
      `targeting boundaries with ${choice}`,
      `taking calculated risk for ${choice} runs`,
      `capitalizing on scoring opportunity`,
      `pressing advantage with ${choice}`
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  getDefensiveReason(context, choice) {
    const reasons = [
      `minimizing risk with ${choice}`,
      `protecting wicket with safe ${choice}`,
      `building pressure with dot balls`,
      `forcing patient approach`
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  getConservativeReason(context, choice) {
    const reasons = [
      `steady scoring with ${choice}`,
      `maintaining run rate balance`,
      `avoiding unnecessary risks`,
      `building partnership steadily`
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  getThinkingMessage(context) {
    const messages = [
      'Analyzing game situation...',
      'Calculating optimal strategy...',
      'Reading player patterns...',
      'Assessing risk factors...',
      'Planning next move...',
      'Evaluating opportunities...',
      'Processing game data...'
    ];
    
    // Add context-specific messages
    if (context.freeHit) {
      messages.push('Free hit - considering aggressive options...');
    }
    if (context.isPowerplay) {
      messages.push('Powerplay active - weighing attacking moves...');
    }
    if (context.pressure > 0.7) {
      messages.push('High pressure situation - calculating carefully...');
    }
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  predictPlayerMove(context) {
    const pattern = this.analyzePlayerPattern(context);
    
    if (pattern.predictability > 0.6) {
      return `Likely to choose ${pattern.nextMove} (${Math.round(pattern.predictability * 100)}% confidence)`;
    } else {
      const mostUsed = this.getMostUsedNumber();
      return `Unpredictable - tends to use ${mostUsed}`;
    }
  }

  getMostUsedNumber() {
    const numbers = this.playerTendencies.mostUsedNumbers;
    return Object.keys(numbers).reduce((a, b) => numbers[a] > numbers[b] ? a : b, '3');
  }

  getFormatOvers() {
    const formatOvers = {
      '5': 5,
      '10': 10,
      '20': 20,
      '50': 50,
      'test': 90
    };
    return formatOvers[this.format] || 20;
  }

  getConfidence() {
    return this.confidence;
  }

  getCurrentStrategy() {
    return this.currentStrategy;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for external access
  getDifficulty() {
    return this.difficulty;
  }

  getPersonalityTraits() {
    return { ...this.personality };
  }

  getPlayerTendencies() {
    return { ...this.playerTendencies };
  }

  getGameHistory() {
    return [...this.gameHistory];
  }

  reset() {
    this.gameHistory = [];
    this.playerTendencies = {
      mostUsedNumbers: {},
      patterns: [],
      recentChoices: [],
      aggressiveness: 0.5
    };
    this.confidence = 0.5;
    this.currentStrategy = 'balanced';
    this.adaptationLevel = 0;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIOpponent;
} else {
  window.AIOpponent = AIOpponent;
}
