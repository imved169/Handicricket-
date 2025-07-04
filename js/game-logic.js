// Core game logic for HandiCricket
class GameLogic {
  constructor(roomId, playerId, callbacks = {}) {
    this.roomId = roomId;
    this.playerId = playerId;
    this.opponentId = playerId === 'player1' ? 'player2' : 'player1';
    this.callbacks = {
      onGameUpdate: callbacks.onGameUpdate || (() => {}),
      onPlayerSelection: callbacks.onPlayerSelection || (() => {}),
      onMatchEnd: callbacks.onMatchEnd || (() => {}),
      onError: callbacks.onError || (() => {}),
      onBallResult: callbacks.onBallResult || (() => {})
    };
    
    this.isAIMode = callbacks.isAIMode || false;
    this.aiOpponent = callbacks.aiOpponent || null;
    
    // Game state
    this.gameState = this.initializeGameState();
    this.formatRules = this.getFormatRules();
    this.ballByBall = {};
    this.ballCount = 0;
    
    // Player choices
    this.playerChoices = {};
    this.waitingForOpponent = false;
    
    // Firebase references
    this.gameRef = null;
    this.movesRef = null;
    
    this.initializeFirebaseListeners();
  }

  initializeGameState() {
    return {
      // Match info
      format: '20',
      status: 'waiting',
      innings: 1,
      currentInnings: 1,
      
      // Current state
      runs: 0,
      wickets: 0,
      balls: 0,
      legalBalls: 0,
      currentOver: 0,
      ballInOver: 0,
      
      // Players
      currentBatter: null,
      currentBowler: null,
      battingTeam: null,
      bowlingTeam: null,
      battingFirst: null,
      
      // Special conditions
      isPowerplay: false,
      isDeadOver: false,
      freeHit: false,
      
      // Player stats
      batterStats: {},
      bowlerStats: {},
      teamStats: {
        player1: { runs: 0, wickets: 0, balls: 0 },
        player2: { runs: 0, wickets: 0, balls: 0 }
      },
      
      // Lives and special rules
      batterLives: {},
      bowlerOvers: {},
      deadOversUsed: [],
      zerosThisOver: { player1: 0, player2: 0 },
      
      // Match flow
      isWaitingForMove: false,
      currentTurn: null,
      isBatting: false,
      
      // Target (for second innings)
      target: null,
      
      // Last ball result
      lastBallResult: null,
      lastPlayerChoice: null,
      lastOpponentChoice: null,
      
      // Playing XI
      playing11: {
        player1: [],
        player2: []
      },
      
      // Teams
      teams: {
        team1: 'Team 1',
        team2: 'Team 2'
      }
    };
  }

  getFormatRules(format = '20') {
    const rules = {
      '5': {
        name: '5 Overs',
        totalOvers: 5,
        totalWickets: 11,
        powerplayOvers: 2,
        powerplayWicketValue: 0.5,
        regularWicketValue: 1,
        livesPerPlayer: 2,
        deadOvers: []
      },
      '10': {
        name: '10 Overs',
        totalOvers: 10,
        totalWickets: 11,
        powerplayOvers: 3,
        powerplayWicketValue: 0.5,
        regularWicketValue: 1,
        livesPerPlayer: 2,
        deadOvers: []
      },
      '20': {
        name: 'T20',
        totalOvers: 20,
        totalWickets: 11,
        powerplayOvers: 6,
        powerplayWicketValue: 0.5,
        regularWicketValue: 1,
        livesPerPlayer: 2,
        deadOvers: []
      },
      '50': {
        name: 'ODI',
        totalOvers: 50,
        totalWickets: 11,
        powerplayOvers: [1, 10, 21, 30, 41, 42],
        powerplayWicketValue: 0.25,
        regularWicketValue: 0.5,
        livesPerPlayer: 4,
        deadOvers: [11, 20, 31, 40]
      },
      'test': {
        name: 'Test Match',
        totalOvers: Infinity,
        totalWickets: 30,
        powerplayOvers: 0,
        powerplayWicketValue: 0.33,
        regularWicketValue: 0.33,
        livesPerPlayer: 3,
        deadOvers: []
      }
    };
    
    return rules[format] || rules['20'];
  }

  initializeFirebaseListeners() {
    if (!this.isAIMode && firebase && firebase.db) {
      this.gameRef = firebase.ref(firebase.db, `rooms/${this.roomId}/gameState`);
      this.movesRef = firebase.ref(firebase.db, `rooms/${this.roomId}/moves`);
      
      // Listen for game state changes
      firebase.onValue(this.gameRef, (snapshot) => {
        if (snapshot.exists()) {
          const serverState = snapshot.val();
          this.syncGameState(serverState);
        }
      });
      
      // Listen for opponent moves
      firebase.onValue(this.movesRef, (snapshot) => {
        if (snapshot.exists()) {
          const moves = snapshot.val();
          this.handleOpponentMove(moves);
        }
      });
    }
  }

  async initializeGame() {
    try {
      // Load room data
      const roomData = await this.loadRoomData();
      if (!roomData) {
        throw new Error('Room not found');
      }
      
      // Set up game state from room data
      this.gameState.format = roomData.player1?.format || '20';
      this.formatRules = this.getFormatRules(this.gameState.format);
      
      this.gameState.teams.team1 = roomData.player1?.teamName || 'Team 1';
      this.gameState.teams.team2 = roomData.player2?.teamName || 'Team 2';
      
      this.gameState.playing11.player1 = roomData.player1?.playing11 || [];
      this.gameState.playing11.player2 = roomData.player2?.playing11 || [];
      
      // Set batting order from toss result
      this.gameState.battingFirst = roomData.toss?.battingFirst || 'player1';
      this.gameState.battingTeam = this.gameState.battingFirst;
      this.gameState.bowlingTeam = this.gameState.battingFirst === 'player1' ? 'player2' : 'player1';
      
      // Initialize player lives
      this.initializePlayerLives();
      
      // Set initial players
      await this.setInitialPlayers();
      
      // Start the game
      this.gameState.status = 'playing';
      this.gameState.isWaitingForMove = true;
      this.gameState.currentTurn = this.gameState.battingTeam;
      this.gameState.isBatting = this.playerId === this.gameState.battingTeam;
      
      // Update special conditions
      this.updateSpecialConditions();
      
      // Save initial state
      await this.saveGameState();
      
      // Notify callback
      this.callbacks.onGameUpdate(this.getPublicGameState());
      
      return true;
    } catch (error) {
      this.callbacks.onError('Failed to initialize game: ' + error.message);
      throw error;
    }
  }

  async initializeAIGame(difficulty, format) {
    try {
      this.gameState.format = format;
      this.formatRules = this.getFormatRules(format);
      
      // Set up teams
      this.gameState.teams.team1 = 'Your Team';
      this.gameState.teams.team2 = 'AI Team';
      
      // Generate playing XI
      this.gameState.playing11.player1 = this.generatePlayingXI('Your Team');
      this.gameState.playing11.player2 = this.generatePlayingXI('AI Team');
      
      // Random toss
      this.gameState.battingFirst = Math.random() < 0.5 ? 'player1' : 'player2';
      this.gameState.battingTeam = this.gameState.battingFirst;
      this.gameState.bowlingTeam = this.gameState.battingFirst === 'player1' ? 'player2' : 'player1';
      
      // Initialize player lives
      this.initializePlayerLives();
      
      // Set initial players
      await this.setInitialPlayers();
      
      // Start the game
      this.gameState.status = 'playing';
      this.gameState.isWaitingForMove = true;
      this.gameState.currentTurn = this.gameState.battingTeam;
      this.gameState.isBatting = this.playerId === this.gameState.battingTeam;
      
      // Update special conditions
      this.updateSpecialConditions();
      
      // If AI bats first, make AI move
      if (this.gameState.battingTeam === 'player2') {
        setTimeout(() => this.makeAIMove(), 1000);
      }
      
      return true;
    } catch (error) {
      this.callbacks.onError('Failed to initialize AI game: ' + error.message);
      throw error;
    }
  }

  generatePlayingXI(teamName) {
    const positions = ['Opener', 'Batsman', 'All-rounder', 'Wicket-keeper', 'Bowler'];
    const names = [
      'Smith', 'Jones', 'Brown', 'Wilson', 'Taylor', 'Davis', 'Miller', 
      'Moore', 'Anderson', 'Jackson', 'White', 'Thompson', 'Garcia', 'Martinez'
    ];
    
    const players = [];
    for (let i = 1; i <= 11; i++) {
      const name = names[Math.floor(Math.random() * names.length)];
      const number = Math.floor(Math.random() * 99) + 1;
      players.push(`${name} ${number}`);
    }
    
    return players;
  }

  initializePlayerLives() {
    const lives = this.formatRules.livesPerPlayer;
    
    this.gameState.playing11.player1.forEach(player => {
      this.gameState.batterLives[player] = lives;
    });
    
    this.gameState.playing11.player2.forEach(player => {
      this.gameState.batterLives[player] = lives;
    });
  }

  async setInitialPlayers() {
    // Set initial batter (first player from batting team)
    const battingPlayers = this.gameState.playing11[this.gameState.battingTeam];
    this.gameState.currentBatter = battingPlayers[0];
    
    // Set initial bowler (first player from bowling team)
    const bowlingPlayers = this.gameState.playing11[this.gameState.bowlingTeam];
    this.gameState.currentBowler = bowlingPlayers[0];
    
    // Initialize stats
    this.initializePlayerStats(this.gameState.currentBatter, 'batter');
    this.initializePlayerStats(this.gameState.currentBowler, 'bowler');
  }

  initializePlayerStats(player, type) {
    if (type === 'batter') {
      this.gameState.batterStats[player] = {
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        howOut: null
      };
    } else if (type === 'bowler') {
      this.gameState.bowlerStats[player] = {
        overs: 0,
        runs: 0,
        wickets: 0,
        maidens: 0,
        ballsBowled: 0
      };
    }
  }

  async loadRoomData() {
    try {
      if (this.isAIMode) {
        return null;
      }
      
      const snapshot = await firebase.get(firebase.ref(firebase.db, `rooms/${this.roomId}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error loading room data:', error);
      return null;
    }
  }

  canMakeMove() {
    return this.gameState.isWaitingForMove && 
           this.gameState.currentTurn === this.playerId && 
           this.gameState.status === 'playing';
  }

  async makeMove(choice) {
    if (!this.canMakeMove()) {
      throw new Error('Cannot make move at this time');
    }
    
    try {
      this.gameState.lastPlayerChoice = choice;
      this.playerChoices[this.ballCount] = {
        player: this.playerId,
        choice: choice,
        timestamp: Date.now()
      };
      
      if (this.isAIMode) {
        // In AI mode, immediately get AI response
        const aiChoice = await this.getAIMove();
        this.gameState.lastOpponentChoice = aiChoice;
        
        this.playerChoices[this.ballCount].opponent = aiChoice;
        
        // Process the ball
        await this.processBall(choice, aiChoice);
      } else {
        // In multiplayer mode, wait for opponent
        this.gameState.isWaitingForMove = false;
        this.waitingForOpponent = true;
        
        // Save move to Firebase
        await firebase.set(
          firebase.ref(firebase.db, `rooms/${this.roomId}/moves/${this.ballCount}`),
          {
            [this.playerId]: choice,
            timestamp: Date.now()
          }
        );
        
        this.callbacks.onGameUpdate(this.getPublicGameState());
      }
    } catch (error) {
      this.callbacks.onError('Failed to make move: ' + error.message);
    }
  }

  async getAIMove() {
    if (this.aiOpponent) {
      const gameContext = this.getAIGameContext();
      return await this.aiOpponent.makeMove(gameContext);
    } else {
      // Simple random AI fallback
      return Math.floor(Math.random() * 7);
    }
  }

  getAIGameContext() {
    return {
      runs: this.gameState.runs,
      wickets: this.gameState.wickets,
      balls: this.gameState.balls,
      overs: Math.floor(this.gameState.balls / 6),
      ballInOver: this.gameState.balls % 6,
      target: this.gameState.target,
      innings: this.gameState.innings,
      format: this.gameState.format,
      isPowerplay: this.gameState.isPowerplay,
      isDeadOver: this.gameState.isDeadOver,
      freeHit: this.gameState.freeHit,
      isBatting: this.gameState.battingTeam === 'player2',
      batterLives: this.gameState.batterLives[this.gameState.currentBatter] || 0,
      recentBalls: this.getRecentBalls(5),
      playerTendencies: this.analyzePlayerTendencies()
    };
  }

  getRecentBalls(count) {
    const recent = [];
    const start = Math.max(0, this.ballCount - count);
    
    for (let i = start; i < this.ballCount; i++) {
      if (this.ballByBall[i]) {
        recent.push(this.ballByBall[i]);
      }
    }
    
    return recent;
  }

  analyzePlayerTendencies() {
    const choices = Object.values(this.playerChoices)
      .filter(choice => choice.player === this.playerId)
      .map(choice => choice.choice);
    
    if (choices.length === 0) return { mostUsed: 3, pattern: 'random' };
    
    const frequency = {};
    choices.forEach(choice => {
      frequency[choice] = (frequency[choice] || 0) + 1;
    });
    
    const mostUsed = Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );
    
    return {
      mostUsed: parseInt(mostUsed),
      frequency: frequency,
      recentChoices: choices.slice(-3),
      pattern: this.detectPattern(choices)
    };
  }

  detectPattern(choices) {
    if (choices.length < 3) return 'random';
    
    const recent = choices.slice(-3);
    
    // Check for ascending/descending patterns
    if (recent[0] < recent[1] && recent[1] < recent[2]) return 'ascending';
    if (recent[0] > recent[1] && recent[1] > recent[2]) return 'descending';
    
    // Check for repetition
    if (recent[0] === recent[1] && recent[1] === recent[2]) return 'repeating';
    
    // Check for alternating
    if (recent[0] === recent[2] && recent[0] !== recent[1]) return 'alternating';
    
    return 'random';
  }

  async handleOpponentMove(moves) {
    const currentBallMoves = moves[this.ballCount];
    if (!currentBallMoves || !this.waitingForOpponent) return;
    
    const opponentChoice = currentBallMoves[this.opponentId];
    const playerChoice = currentBallMoves[this.playerId];
    
    if (opponentChoice !== undefined && playerChoice !== undefined) {
      this.waitingForOpponent = false;
      this.gameState.lastOpponentChoice = opponentChoice;
      
      await this.processBall(playerChoice, opponentChoice);
    }
  }

  async processBall(playerChoice, opponentChoice) {
    try {
      // Determine batting and bowling choices
      let battingChoice, bowlingChoice;
      
      if (this.gameState.isBatting) {
        battingChoice = playerChoice;
        bowlingChoice = opponentChoice;
      } else {
        battingChoice = opponentChoice;
        bowlingChoice = playerChoice;
      }
      
      // Calculate ball result
      const ballResult = this.calculateBallResult(battingChoice, bowlingChoice);
      
      // Update game state
      this.updateGameStateAfterBall(ballResult);
      
      // Record ball in history
      this.ballByBall[this.ballCount] = {
        ball: this.ballCount + 1,
        over: Math.floor(this.gameState.balls / 6) + 1,
        ballInOver: (this.gameState.balls % 6) + 1,
        battingChoice: battingChoice,
        bowlingChoice: bowlingChoice,
        result: ballResult,
        runs: ballResult.runs,
        isWicket: ballResult.isWicket,
        description: ballResult.description,
        timestamp: Date.now()
      };
      
      this.ballCount++;
      
      // Check for match end conditions
      if (this.checkMatchEndConditions()) {
        await this.endMatch();
        return;
      }
      
      // Check for innings end
      if (this.checkInningsEndConditions()) {
        await this.endInnings();
        return;
      }
      
      // Check for over completion
      if (this.gameState.ballInOver === 6) {
        await this.completeOver();
      }
      
      // Check for player changes
      await this.checkPlayerChanges(ballResult);
      
      // Update special conditions
      this.updateSpecialConditions();
      
      // Set up next ball
      this.setupNextBall();
      
      // Save state and notify
      await this.saveGameState();
      this.callbacks.onGameUpdate(this.getPublicGameState());
      this.callbacks.onBallResult(ballResult, battingChoice, bowlingChoice);
      
    } catch (error) {
      this.callbacks.onError('Failed to process ball: ' + error.message);
    }
  }

  calculateBallResult(battingChoice, bowlingChoice) {
    const result = {
      runs: 0,
      isWicket: false,
      isLegal: true,
      description: '',
      type: 'normal',
      extras: 0
    };
    
    // Free hit logic
    if (this.gameState.freeHit) {
      result.isFreeHit = true;
      this.gameState.freeHit = false;
    }
    
    // Basic outcome logic
    if (battingChoice === bowlingChoice) {
      // Wicket (unless free hit)
      if (!result.isFreeHit) {
        result.isWicket = true;
        result.description = 'Wicket! Batsman out';
        result.type = 'wicket';
      } else {
        result.runs = 1;
        result.description = 'Free hit - Safe! 1 run';
      }
    } else {
      // Runs scored
      result.runs = battingChoice;
      
      if (battingChoice === 4) {
        result.description = 'FOUR! Boundary';
        result.type = 'boundary';
      } else if (battingChoice === 6) {
        result.description = 'SIX! Maximum';
        result.type = 'six';
      } else if (battingChoice === 0) {
        result.description = 'Dot ball';
        result.type = 'dot';
      } else {
        result.description = `${battingChoice} run${battingChoice > 1 ? 's' : ''}`;
        result.type = 'runs';
      }
    }
    
    // Apply format-specific modifications
    this.applyFormatSpecificRules(result);
    
    return result;
  }

  applyFormatSpecificRules(result) {
    // Powerplay wicket value modification
    if (result.isWicket && this.gameState.isPowerplay) {
      const wicketValue = this.formatRules.powerplayWicketValue;
      if (wicketValue < 1) {
        result.wicketValue = wicketValue;
        result.description += ` (Powerplay: ${wicketValue} wicket)`;
      }
    } else if (result.isWicket) {
      result.wicketValue = this.formatRules.regularWicketValue;
    }
    
    // Dead over modifications
    if (this.gameState.isDeadOver) {
      if (result.runs === 0) {
        // Convert dot ball to no ball in dead over
        result.runs = 1;
        result.isLegal = false;
        result.extras = 1;
        result.description = 'No ball (Dead over) - 1 extra';
        this.gameState.freeHit = true;
      }
    }
    
    // Special conditions for test match
    if (this.gameState.format === 'test') {
      if (result.isWicket) {
        result.wicketValue = 0.33; // Test wickets worth 1/3
      }
    }
  }

  updateGameStateAfterBall(ballResult) {
    // Update runs
    this.gameState.runs += ballResult.runs;
    this.gameState.teamStats[this.gameState.battingTeam].runs += ballResult.runs;
    
    // Update wickets
    if (ballResult.isWicket) {
      const wicketValue = ballResult.wicketValue || 1;
      this.gameState.wickets += wicketValue;
      this.gameState.teamStats[this.gameState.battingTeam].wickets += wicketValue;
      
      // Update batter lives
      if (this.gameState.currentBatter) {
        this.gameState.batterLives[this.gameState.currentBatter]--;
        
        if (this.gameState.batterLives[this.gameState.currentBatter] <= 0) {
          this.gameState.batterStats[this.gameState.currentBatter].isOut = true;
          this.gameState.batterStats[this.gameState.currentBatter].howOut = 'Bowled/Caught';
        }
      }
    }
    
    // Update balls (only for legal deliveries)
    if (ballResult.isLegal) {
      this.gameState.balls++;
      this.gameState.legalBalls++;
      this.gameState.ballInOver = this.gameState.balls % 6;
      this.gameState.teamStats[this.gameState.battingTeam].balls++;
    }
    
    // Update player stats
    this.updatePlayerStats(ballResult);
    
    // Update zero count for this over
    if (ballResult.runs === 0 && ballResult.isLegal) {
      this.gameState.zerosThisOver[this.gameState.battingTeam]++;
    }
    
    // Store last ball result
    this.gameState.lastBallResult = ballResult;
  }

  updatePlayerStats(ballResult) {
    // Update batter stats
    if (this.gameState.currentBatter) {
      const batterStats = this.gameState.batterStats[this.gameState.currentBatter];
      if (ballResult.isLegal) {
        batterStats.balls++;
      }
      batterStats.runs += ballResult.runs;
      
      if (ballResult.type === 'boundary') {
        batterStats.fours++;
      } else if (ballResult.type === 'six') {
        batterStats.sixes++;
      }
    }
    
    // Update bowler stats
    if (this.gameState.currentBowler) {
      const bowlerStats = this.gameState.bowlerStats[this.gameState.currentBowler];
      bowlerStats.runs += ballResult.runs;
      
      if (ballResult.isLegal) {
        bowlerStats.ballsBowled++;
      }
      
      if (ballResult.isWicket) {
        bowlerStats.wickets += (ballResult.wicketValue || 1);
      }
      
      // Calculate overs bowled
      bowlerStats.overs = Math.floor(bowlerStats.ballsBowled / 6) + (bowlerStats.ballsBowled % 6) / 10;
    }
  }

  checkMatchEndConditions() {
    // Check if all overs completed
    if (this.gameState.balls >= this.formatRules.totalOvers * 6) {
      return true;
    }
    
    // Check if all wickets fallen
    if (this.gameState.wickets >= this.formatRules.totalWickets) {
      return true;
    }
    
    // Check target reached (second innings)
    if (this.gameState.innings === 2 && this.gameState.target && this.gameState.runs >= this.gameState.target) {
      return true;
    }
    
    // Check if impossible to reach target
    if (this.gameState.innings === 2 && this.gameState.target) {
      const ballsRemaining = (this.formatRules.totalOvers * 6) - this.gameState.balls;
      const runsNeeded = this.gameState.target - this.gameState.runs;
      
      // If impossible to reach target even with maximum runs
      if (runsNeeded > ballsRemaining * 6) {
        return true;
      }
    }
    
    return false;
  }

  checkInningsEndConditions() {
    // Same as match end but only for first innings
    if (this.gameState.innings === 1) {
      return this.gameState.balls >= this.formatRules.totalOvers * 6 || 
             this.gameState.wickets >= this.formatRules.totalWickets;
    }
    return false;
  }

  async completeOver() {
    this.gameState.currentOver++;
    this.gameState.ballInOver = 0;
    
    // Reset zeros count for this over
    this.gameState.zerosThisOver = { player1: 0, player2: 0 };
    
    // Change bowler (in real cricket, this would be mandatory)
    // For HandiCricket, we'll keep the same bowler unless there's a specific reason to change
    
    // Update over-based conditions
    this.updateOverBasedConditions();
  }

  updateOverBasedConditions() {
    const currentOver = Math.floor(this.gameState.balls / 6);
    
    // Update powerplay status
    this.updatePowerplayStatus(currentOver);
    
    // Update dead over status
    this.updateDeadOverStatus(currentOver);
  }

  updatePowerplayStatus(currentOver) {
    if (Array.isArray(this.formatRules.powerplayOvers)) {
      // ODI format with multiple powerplay periods
      this.gameState.isPowerplay = this.formatRules.powerplayOvers.some((range, index) => {
        if (index % 2 === 0) { // Start of range
          const start = range;
          const end = this.formatRules.powerplayOvers[index + 1];
          return currentOver >= start && currentOver <= end;
        }
        return false;
      });
    } else {
      // Simple powerplay (first N overs)
      this.gameState.isPowerplay = currentOver < this.formatRules.powerplayOvers;
    }
  }

  updateDeadOverStatus(currentOver) {
    this.gameState.isDeadOver = this.formatRules.deadOvers.includes(currentOver + 1);
  }

  updateSpecialConditions() {
    const currentOver = Math.floor(this.gameState.balls / 6);
    this.updatePowerplayStatus(currentOver);
    this.updateDeadOverStatus(currentOver);
  }

  async checkPlayerChanges(ballResult) {
    // Check if batter needs to be changed (if out and no lives left)
    if (ballResult.isWicket && this.gameState.currentBatter) {
      const batterLives = this.gameState.batterLives[this.gameState.currentBatter];
      
      if (batterLives <= 0) {
        // Batter is out, need to select new batter
        const availableBatters = this.getAvailableBatters();
        
        if (availableBatters.length > 0) {
          if (this.isAIMode && this.gameState.battingTeam === 'player2') {
            // AI selects next batter
            this.gameState.currentBatter = availableBatters[0];
            this.initializePlayerStats(this.gameState.currentBatter, 'batter');
          } else if (this.gameState.battingTeam === this.playerId) {
            // Request player selection
            this.callbacks.onPlayerSelection(availableBatters, 'batter');
            return; // Wait for selection
          } else {
            // Auto-select first available
            this.gameState.currentBatter = availableBatters[0];
            this.initializePlayerStats(this.gameState.currentBatter, 'batter');
          }
        }
      }
    }
  }

  getAvailableBatters() {
    const battingPlayers = this.gameState.playing11[this.gameState.battingTeam];
    return battingPlayers.filter(player => 
      !this.gameState.batterStats[player]?.isOut && 
      this.gameState.batterLives[player] > 0 &&
      player !== this.gameState.currentBatter
    );
  }

  getAvailableBowlers() {
    const bowlingPlayers = this.gameState.playing11[this.gameState.bowlingTeam];
    return bowlingPlayers.filter(player => player !== this.gameState.currentBowler);
  }

  async selectPlayer(playerName) {
    if (this.getAvailableBatters().includes(playerName)) {
      this.gameState.currentBatter = playerName;
      this.initializePlayerStats(playerName, 'batter');
    } else if (this.getAvailableBowlers().includes(playerName)) {
      this.gameState.currentBowler = playerName;
      this.initializePlayerStats(playerName, 'bowler');
    }
    
    this.setupNextBall();
    await this.saveGameState();
    this.callbacks.onGameUpdate(this.getPublicGameState());
  }

  setupNextBall() {
    this.gameState.isWaitingForMove = true;
    this.gameState.currentTurn = this.gameState.battingTeam;
    
    // In AI mode, trigger AI move if it's AI's turn
    if (this.isAIMode && this.gameState.currentTurn === 'player2') {
      setTimeout(() => this.makeAIMove(), 1000);
    }
  }

  async makeAIMove() {
    if (this.aiOpponent && this.gameState.currentTurn === 'player2') {
      try {
        const gameContext = this.getAIGameContext();
        const aiChoice = await this.aiOpponent.makeMove(gameContext);
        
        // Make the move for AI
        this.gameState.lastOpponentChoice = aiChoice;
        this.playerChoices[this.ballCount] = {
          player: 'player2',
          choice: aiChoice,
          timestamp: Date.now()
        };
        
        // AI has made its choice, wait for human player
        this.gameState.currentTurn = 'player1';
        this.callbacks.onGameUpdate(this.getPublicGameState());
        
      } catch (error) {
        console.error('AI move failed:', error);
        this.callbacks.onError('AI opponent error');
      }
    }
  }

  async endInnings() {
    // Save first innings stats
    if (this.gameState.innings === 1) {
      this.gameState.firstInningsScore = this.gameState.runs;
      this.gameState.firstInningsWickets = this.gameState.wickets;
      this.gameState.firstInningsBalls = this.gameState.balls;
      
      // Set target for second innings
      this.gameState.target = this.gameState.runs + 1;
      
      // Switch innings
      this.gameState.innings = 2;
      this.gameState.currentInnings = 2;
      
      // Switch teams
      const tempBatting = this.gameState.battingTeam;
      this.gameState.battingTeam = this.gameState.bowlingTeam;
      this.gameState.bowlingTeam = tempBatting;
      
      // Reset match state for second innings
      this.gameState.runs = 0;
      this.gameState.wickets = 0;
      this.gameState.balls = 0;
      this.gameState.legalBalls = 0;
      this.gameState.currentOver = 0;
      this.gameState.ballInOver = 0;
      
      // Set new players
      await this.setInitialPlayers();
      
      // Update role
      this.gameState.isBatting = this.playerId === this.gameState.battingTeam;
      
      // Reset special conditions
      this.updateSpecialConditions();
      
      // Continue game
      this.setupNextBall();
      
      await this.saveGameState();
      this.callbacks.onGameUpdate(this.getPublicGameState());
    }
  }

  async endMatch() {
    this.gameState.status = 'completed';
    this.gameState.isWaitingForMove = false;
    
    // Calculate final result
    const result = this.calculateMatchResult();
    
    // Save match to history
    await this.saveMatchToHistory(result);
    
    // Notify callback
    this.callbacks.onMatchEnd(result);
  }

  calculateMatchResult() {
    let winner = null;
    let margin = '';
    
    if (this.gameState.innings === 1) {
      // Match ended in first innings (all out or overs completed)
      winner = 'incomplete';
      margin = 'Match incomplete';
    } else {
      // Second innings completed
      const targetScore = this.gameState.target;
      const chasingScore = this.gameState.runs;
      
      if (chasingScore >= targetScore) {
        // Chasing team won
        winner = this.gameState.battingTeam;
        const wicketsLeft = this.formatRules.totalWickets - this.gameState.wickets;
        const ballsLeft = (this.formatRules.totalOvers * 6) - this.gameState.balls;
        margin = `Won by ${wicketsLeft} wickets with ${ballsLeft} balls remaining`;
      } else {
        // First innings team won
        winner = this.gameState.bowlingTeam;
        const runsMargin = targetScore - chasingScore - 1;
        margin = `Won by ${runsMargin} runs`;
      }
    }
    
    // Determine if player won
    const playerWon = winner === this.playerId;
    
    return {
      winner: playerWon ? 'player' : (winner === this.opponentId ? 'opponent' : 'draw'),
      margin: margin,
      playerScore: this.getPlayerScore().runs,
      playerWickets: this.getPlayerScore().wickets,
      opponentScore: this.getOpponentScore().runs,
      opponentWickets: this.getOpponentScore().wickets,
      format: this.gameState.format,
      innings: this.gameState.innings,
      isAI: this.isAIMode
    };
  }

  getPlayerScore() {
    return this.gameState.teamStats[this.playerId] || { runs: 0, wickets: 0, balls: 0 };
  }

  getOpponentScore() {
    return this.gameState.teamStats[this.opponentId] || { runs: 0, wickets: 0, balls: 0 };
  }

  async saveMatchToHistory(result) {
    try {
      const matchData = {
        id: `${this.roomId}_${Date.now()}`,
        roomId: this.roomId,
        date: new Date().toISOString(),
        format: this.gameState.format,
        result: result,
        playerScore: result.playerScore,
        playerWickets: result.playerWickets,
        opponentScore: result.opponentScore,
        opponentWickets: result.opponentWickets,
        isAI: this.isAIMode,
        opponent: this.isAIMode ? 'AI' : (this.gameState.teams[this.opponentId] || 'Opponent'),
        ballByBall: this.ballByBall,
        playerStats: this.calculatePlayerStatistics(),
        duration: Date.now() - (this.gameState.startTime || Date.now())
      };
      
      // Save to localStorage
      const history = loadFromLocalStorage('matchHistory') || [];
      history.push(matchData);
      saveToLocalStorage('matchHistory', history);
      
      // Save to Firebase if not AI mode
      if (!this.isAIMode && firebase && firebase.db) {
        await firebase.set(
          firebase.ref(firebase.db, `matchHistory/${matchData.id}`),
          matchData
        );
      }
      
    } catch (error) {
      console.error('Error saving match to history:', error);
    }
  }

  calculatePlayerStatistics() {
    const playerBatting = this.gameState.battingFirst === this.playerId;
    let stats = {};
    
    if (playerBatting) {
      const batterName = this.gameState.playing11[this.playerId][0];
      const batterStats = this.gameState.batterStats[batterName] || {};
      
      stats = {
        runs: batterStats.runs || 0,
        balls: batterStats.balls || 0,
        strikeRate: batterStats.balls > 0 ? ((batterStats.runs / batterStats.balls) * 100).toFixed(2) : '0.00',
        boundaries: (batterStats.fours || 0) + (batterStats.sixes || 0),
        fours: batterStats.fours || 0,
        sixes: batterStats.sixes || 0
      };
    } else {
      const bowlerName = this.gameState.playing11[this.playerId][0];
      const bowlerStats = this.gameState.bowlerStats[bowlerName] || {};
      
      stats = {
        overs: bowlerStats.overs || 0,
        runs: bowlerStats.runs || 0,
        wickets: bowlerStats.wickets || 0,
        economy: bowlerStats.overs > 0 ? (bowlerStats.runs / bowlerStats.overs).toFixed(2) : '0.00'
      };
    }
    
    return stats;
  }

  async saveGameState() {
    try {
      if (!this.isAIMode && firebase && firebase.db) {
        await firebase.set(this.gameRef, this.gameState);
      }
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }

  syncGameState(serverState) {
    // Merge server state with local state
    this.gameState = { ...this.gameState, ...serverState };
    this.callbacks.onGameUpdate(this.getPublicGameState());
  }

  getPublicGameState() {
    return {
      // Basic game info
      format: this.gameState.format,
      status: this.gameState.status,
      innings: this.gameState.innings,
      
      // Current scores
      runs: this.gameState.runs,
      wickets: this.gameState.wickets,
      balls: this.gameState.balls,
      legalBalls: this.gameState.legalBalls,
      
      // Players
      currentBatter: this.gameState.currentBatter ? {
        name: this.gameState.currentBatter,
        runs: this.gameState.batterStats[this.gameState.currentBatter]?.runs || 0,
        balls: this.gameState.batterStats[this.gameState.currentBatter]?.balls || 0,
        lives: this.gameState.batterLives[this.gameState.currentBatter] || 0
      } : null,
      
      currentBowler: this.gameState.currentBowler ? {
        name: this.gameState.currentBowler,
        overs: this.gameState.bowlerStats[this.gameState.currentBowler]?.overs || 0,
        runs: this.gameState.bowlerStats[this.gameState.currentBowler]?.runs || 0,
        wickets: this.gameState.bowlerStats[this.gameState.currentBowler]?.wickets || 0,
        maidens: this.gameState.bowlerStats[this.gameState.currentBowler]?.maidens || 0
      } : null,
      
      // Special conditions
      isPowerplay: this.gameState.isPowerplay,
      isDeadOver: this.gameState.isDeadOver,
      freeHit: this.gameState.freeHit,
      
      // Game flow
      isWaitingForMove: this.gameState.isWaitingForMove,
      currentTurn: this.gameState.currentTurn,
      isBatting: this.gameState.isBatting,
      
      // Target info
      target: this.gameState.target,
      
      // Teams and playing XI
      teams: this.gameState.teams,
      playing11: this.gameState.playing11,
      battingFirst: this.gameState.battingFirst,
      
      // Last ball result
      lastBallResult: this.gameState.lastBallResult,
      
      // Statistics
      statistics: this.calculateLiveStatistics(),
      
      // Format rules
      totalOvers: this.formatRules.totalOvers,
      totalWickets: this.formatRules.totalWickets
    };
  }

  calculateLiveStatistics() {
    const boundaries = Object.values(this.ballByBall).filter(ball => [4, 6].includes(ball.runs));
    const dotBalls = Object.values(this.ballByBall).filter(ball => ball.runs === 0);
    
    return {
      boundaries: boundaries.filter(ball => ball.runs === 4).length,
      sixes: boundaries.filter(ball => ball.runs === 6).length,
      dotBalls: dotBalls.length,
      runRate: this.gameState.balls > 0 ? (this.gameState.runs / (this.gameState.balls / 6)).toFixed(2) : '0.00',
      partnership: this.gameState.runs, // Simplified
      ballsFaced: this.gameState.balls
    };
  }

  getGameState() {
    return this.getPublicGameState();
  }

  getLastPlayerChoice() {
    return this.gameState.lastPlayerChoice;
  }

  getLastBallOutcome() {
    return this.gameState.lastBallResult;
  }

  getDetailedStatistics() {
    return {
      gameState: this.gameState,
      ballByBall: this.ballByBall,
      playerChoices: this.playerChoices,
      formatRules: this.formatRules
    };
  }

  async saveGame() {
    try {
      const saveData = {
        roomId: this.roomId,
        gameState: this.gameState,
        ballByBall: this.ballByBall,
        playerChoices: this.playerChoices,
        savedAt: Date.now(),
        playerId: this.playerId
      };
      
      // Save to localStorage
      const savedGames = loadFromLocalStorage('savedGames') || {};
      savedGames[this.roomId] = saveData;
      saveToLocalStorage('savedGames', savedGames);
      
      // Save to Firebase if not AI mode
      if (!this.isAIMode && firebase && firebase.db) {
        await firebase.set(
          firebase.ref(firebase.db, `savedGames/${this.roomId}`),
          saveData
        );
      }
      
      return true;
    } catch (error) {
      throw new Error('Failed to save game: ' + error.message);
    }
  }

  async resumeGame() {
    try {
      // Load saved game data
      let saveData = null;
      
      // Try to load from Firebase first
      if (!this.isAIMode && firebase && firebase.db) {
        const snapshot = await firebase.get(firebase.ref(firebase.db, `savedGames/${this.roomId}`));
        if (snapshot.exists()) {
          saveData = snapshot.val();
        }
      }
      
      // Fallback to localStorage
      if (!saveData) {
        const savedGames = loadFromLocalStorage('savedGames') || {};
        saveData = savedGames[this.roomId];
      }
      
      if (!saveData) {
        throw new Error('No saved game found');
      }
      
      // Restore game state
      this.gameState = saveData.gameState;
      this.ballByBall = saveData.ballByBall || {};
      this.playerChoices = saveData.playerChoices || {};
      this.ballCount = Object.keys(this.ballByBall).length;
      
      // Restore format rules
      this.formatRules = this.getFormatRules(this.gameState.format);
      
      // Resume game
      this.gameState.status = 'playing';
      this.setupNextBall();
      
      return true;
    } catch (error) {
      throw new Error('Failed to resume game: ' + error.message);
    }
  }

  async declareInnings() {
    if (this.gameState.format === 'test' && this.gameState.innings === 1) {
      await this.endInnings();
      return true;
    }
    throw new Error('Cannot declare innings in this format or situation');
  }

  async enforceFollowOn() {
    if (this.gameState.format === 'test' && this.gameState.innings === 2) {
      // Implementation for follow-on
      return true;
    }
    throw new Error('Follow-on not applicable');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameLogic;
} else {
  window.GameLogic = GameLogic;
}
