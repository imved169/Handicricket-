// Spectator mode functionality for HandiCricket
class SpectatorManager {
  constructor(roomId, spectatorId, callbacks = {}) {
    this.roomId = roomId;
    this.spectatorId = spectatorId;
    this.callbacks = {
      onMatchUpdate: callbacks.onMatchUpdate || (() => {}),
      onReactionReceived: callbacks.onReactionReceived || (() => {}),
      onChatMessage: callbacks.onChatMessage || (() => {}),
      onSpectatorUpdate: callbacks.onSpectatorUpdate || (() => {}),
      onError: callbacks.onError || (() => {})
    };
    
    // Spectator state
    this.isConnected = false;
    this.lastPrediction = null;
    this.reactionCooldown = false;
    this.chatHistory = [];
    this.momentum = 50; // 0-100 scale
    this.statistics = {};
    
    // Firebase references
    this.roomRef = null;
    this.spectatorRef = null;
    this.reactionsRef = null;
    this.chatRef = null;
    
    // Reaction types
    this.reactionTypes = {
      fire: { emoji: '🔥', cooldown: 2000 },
      clap: { emoji: '👏', cooldown: 1000 },
      love: { emoji: '😍', cooldown: 3000 },
      shock: { emoji: '😱', cooldown: 2000 },
      power: { emoji: '💪', cooldown: 2500 },
      target: { emoji: '🎯', cooldown: 2000 },
      sad: { emoji: '😭', cooldown: 3000 },
      lightning: { emoji: '⚡', cooldown: 2500 }
    };
    
    this.initializeFirebaseRefs();
  }

  initializeFirebaseRefs() {
    if (firebase && firebase.db) {
      this.roomRef = firebase.ref(firebase.db, `rooms/${this.roomId}`);
      this.spectatorRef = firebase.ref(firebase.db, `rooms/${this.roomId}/spectators/${this.spectatorId}`);
      this.reactionsRef = firebase.ref(firebase.db, `rooms/${this.roomId}/reactions`);
      this.chatRef = firebase.ref(firebase.db, `rooms/${this.roomId}/spectatorChat`);
      this.spectatorDataRef = firebase.ref(firebase.db, `rooms/${this.roomId}/spectatorData`);
    }
  }

  async initialize() {
    try {
      // Check if room exists
      const roomSnapshot = await firebase.get(this.roomRef);
      if (!roomSnapshot.exists()) {
        throw new Error('Match room not found');
      }
      
      // Register as spectator
      await this.registerSpectator();
      
      // Set up real-time listeners
      this.setupRealtimeListeners();
      
      // Load initial data
      await this.loadInitialData();
      
      this.isConnected = true;
      
      return true;
    } catch (error) {
      this.callbacks.onError('Failed to initialize spectator mode: ' + error.message);
      throw error;
    }
  }

  async registerSpectator() {
    try {
      await firebase.set(this.spectatorRef, {
        joinedAt: Date.now(),
        online: true,
        lastSeen: Date.now(),
        reactions: 0,
        predictions: 0,
        chatMessages: 0
      });
      
      // Update spectator count
      await this.updateSpectatorCount();
      
    } catch (error) {
      throw new Error('Failed to register as spectator: ' + error.message);
    }
  }

  async updateSpectatorCount() {
    try {
      const spectatorsSnapshot = await firebase.get(
        firebase.ref(firebase.db, `rooms/${this.roomId}/spectators`)
      );
      
      const spectators = spectatorsSnapshot.val() || {};
      const onlineCount = Object.values(spectators).filter(s => s.online).length;
      
      await firebase.set(
        firebase.ref(firebase.db, `rooms/${this.roomId}/spectatorCount`),
        onlineCount
      );
      
    } catch (error) {
      console.error('Error updating spectator count:', error);
    }
  }

  setupRealtimeListeners() {
    // Listen for match updates
    firebase.onValue(this.roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.val();
        this.handleMatchUpdate(roomData);
      }
    });
    
    // Listen for reactions
    firebase.onValue(this.reactionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const reactions = snapshot.val();
        this.handleReactions(reactions);
      }
    });
    
    // Listen for chat messages
    firebase.onValue(this.chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const messages = snapshot.val();
        this.handleChatUpdates(messages);
      }
    });
    
    // Listen for other spectators
    firebase.onValue(
      firebase.ref(firebase.db, `rooms/${this.roomId}/spectators`),
      (snapshot) => {
        if (snapshot.exists()) {
          const spectators = snapshot.val();
          this.callbacks.onSpectatorUpdate(spectators);
        }
      }
    );
    
    // Listen for spectator data updates
    firebase.onValue(this.spectatorDataRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        this.handleSpectatorDataUpdate(data);
      }
    });
  }

  async loadInitialData() {
    try {
      // Load match data
      const roomSnapshot = await firebase.get(this.roomRef);
      if (roomSnapshot.exists()) {
        this.handleMatchUpdate(roomSnapshot.val());
      }
      
      // Load chat history
      const chatSnapshot = await firebase.get(this.chatRef);
      if (chatSnapshot.exists()) {
        this.chatHistory = Object.values(chatSnapshot.val())
          .sort((a, b) => a.timestamp - b.timestamp);
        
        // Show recent messages
        this.chatHistory.slice(-10).forEach(message => {
          this.callbacks.onChatMessage(message);
        });
      }
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  handleMatchUpdate(roomData) {
    try {
      const matchData = this.processMatchData(roomData);
      
      // Update momentum
      this.updateMomentum(matchData);
      
      // Update statistics
      this.updateStatistics(matchData);
      
      // Check for milestone achievements
      this.checkMilestones(matchData);
      
      // Trigger callback
      this.callbacks.onMatchUpdate(matchData);
      
    } catch (error) {
      console.error('Error handling match update:', error);
    }
  }

  processMatchData(roomData) {
    const gameState = roomData.gameState || {};
    const liveState = roomData.liveState || {};
    const toss = roomData.toss || {};
    
    return {
      // Basic match info
      format: roomData.player1?.format || '20',
      status: gameState.status || 'waiting',
      innings: gameState.currentInnings || 1,
      startTime: gameState.startedAt,
      
      // Teams
      teams: {
        team1: roomData.player1?.teamName || 'Team 1',
        team2: roomData.player2?.teamName || 'Team 2'
      },
      
      // Toss info
      tossWinner: toss.winner,
      battingFirst: toss.battingFirst,
      
      // Current score
      runs: liveState.runs || 0,
      wickets: liveState.wickets || 0,
      balls: liveState.legalBalls || 0,
      
      // Overs info
      totalOvers: this.getFormatOvers(roomData.player1?.format),
      
      // Target (if second innings)
      target: gameState.target,
      
      // Current players
      currentBatter: liveState.currentBatter,
      currentBowler: liveState.currentBowler,
      
      // Special conditions
      isPowerplay: liveState.isPowerplay || false,
      isFreeHit: liveState.freeHit || false,
      isDeadOver: liveState.isDeadOver || false,
      
      // Last ball result
      lastBallResult: liveState.lastBallResult,
      
      // Statistics
      boundaries: this.statistics.boundaries || 0,
      sixes: this.statistics.sixes || 0,
      dotBalls: this.statistics.dotBalls || 0,
      extras: this.statistics.extras || 0,
      partnership: this.statistics.partnership || 0,
      
      // Momentum
      momentum: this.momentum,
      
      // Spectator count
      spectatorCount: roomData.spectatorCount || 0,
      
      // Over summaries
      overSummaries: roomData.spectatorData?.overSummaries || {},
      
      // Match stats
      matchStats: roomData.spectatorData?.matchStats || {}
    };
  }

  updateMomentum(matchData) {
    // Calculate momentum based on recent events
    const prevMomentum = this.momentum;
    
    // Base momentum on run rate vs par
    const currentRate = matchData.balls > 0 ? (matchData.runs / (matchData.balls / 6)) : 0;
    const parRate = this.getParRate(matchData.format);
    
    if (currentRate > parRate * 1.5) {
      this.momentum = Math.min(90, this.momentum + 10);
    } else if (currentRate > parRate * 1.2) {
      this.momentum = Math.min(80, this.momentum + 5);
    } else if (currentRate < parRate * 0.7) {
      this.momentum = Math.max(10, this.momentum - 10);
    } else if (currentRate < parRate * 0.8) {
      this.momentum = Math.max(20, this.momentum - 5);
    }
    
    // Adjust based on special events
    if (matchData.lastBallResult) {
      const result = matchData.lastBallResult;
      
      if (result.type === 'six') {
        this.momentum = Math.min(95, this.momentum + 15);
      } else if (result.type === 'boundary') {
        this.momentum = Math.min(85, this.momentum + 10);
      } else if (result.type === 'wicket') {
        this.momentum = Math.max(15, this.momentum - 15);
      } else if (result.type === 'dot') {
        this.momentum = Math.max(25, this.momentum - 2);
      }
    }
    
    // Gradually drift towards 50 (balanced)
    if (this.momentum > 50) {
      this.momentum -= 0.5;
    } else if (this.momentum < 50) {
      this.momentum += 0.5;
    }
    
    this.momentum = Math.max(0, Math.min(100, this.momentum));
  }

  getParRate(format) {
    const parRates = {
      '5': 8.0,
      '10': 7.0,
      '20': 6.5,
      '50': 5.0,
      'test': 3.0
    };
    return parRates[format] || 6.0;
  }

  getFormatOvers(format) {
    const overs = {
      '5': 5,
      '10': 10,
      '20': 20,
      '50': 50,
      'test': 90
    };
    return overs[format] || 20;
  }

  updateStatistics(matchData) {
    // This would be updated from the actual game events
    // For now, we'll derive from the match data
    
    this.statistics = {
      boundaries: matchData.boundaries || 0,
      sixes: matchData.sixes || 0,
      dotBalls: matchData.dotBalls || 0,
      extras: matchData.extras || 0,
      partnership: matchData.runs || 0, // Simplified
      runRate: matchData.balls > 0 ? (matchData.runs / (matchData.balls / 6)).toFixed(2) : '0.00'
    };
  }

  checkMilestones(matchData) {
    // Check for notable milestones and trigger reactions
    const runs = matchData.runs;
    
    // Score milestones
    if (runs === 50 || runs === 100 || runs === 150 || runs === 200) {
      this.autoReact('clap', `${runs} runs reached!`);
    }
    
    // Wicket milestones
    if (matchData.wickets === 5 || matchData.wickets === 10) {
      this.autoReact('shock', `${matchData.wickets} wickets down!`);
    }
    
    // Format-specific milestones
    if (matchData.format === '20' && runs >= 180) {
      this.autoReact('fire', 'Massive total building!');
    }
    
    if (matchData.format === '5' && runs >= 50) {
      this.autoReact('lightning', 'Explosive start!');
    }
  }

  async autoReact(reactionType, message = '') {
    // Auto-reactions for major events (with rate limiting)
    if (!this.reactionCooldown) {
      try {
        await this.sendReaction(reactionType);
        if (message) {
          await this.sendChatMessage(`🤖 ${message}`);
        }
      } catch (error) {
        console.error('Auto reaction failed:', error);
      }
    }
  }

  handleReactions(reactions) {
    Object.values(reactions).forEach(reaction => {
      if (reaction.timestamp > Date.now() - 5000) { // Recent reactions only
        this.callbacks.onReactionReceived(reaction);
      }
    });
  }

  handleChatUpdates(messages) {
    const messageArray = Object.values(messages)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    // Find new messages
    const lastKnownTime = this.chatHistory.length > 0 ? 
      this.chatHistory[this.chatHistory.length - 1].timestamp : 0;
    
    const newMessages = messageArray.filter(msg => msg.timestamp > lastKnownTime);
    
    // Add new messages to history
    this.chatHistory.push(...newMessages);
    
    // Keep only recent messages in memory
    if (this.chatHistory.length > 100) {
      this.chatHistory = this.chatHistory.slice(-100);
    }
    
    // Trigger callbacks for new messages
    newMessages.forEach(message => {
      this.callbacks.onChatMessage(message);
    });
  }

  handleSpectatorDataUpdate(data) {
    if (data.momentum !== undefined) {
      this.momentum = data.momentum;
    }
    
    if (data.matchStats) {
      this.statistics = { ...this.statistics, ...data.matchStats };
    }
  }

  async sendReaction(reactionType) {
    if (this.reactionCooldown) {
      throw new Error('Reaction cooldown active');
    }
    
    if (!this.reactionTypes[reactionType]) {
      throw new Error('Invalid reaction type');
    }
    
    try {
      const reaction = {
        spectatorId: this.spectatorId,
        emoji: this.reactionTypes[reactionType].emoji,
        type: reactionType,
        timestamp: Date.now()
      };
      
      // Add reaction to Firebase
      const reactionRef = firebase.push(this.reactionsRef);
      await firebase.set(reactionRef, reaction);
      
      // Update spectator stats
      await this.updateSpectatorStats('reactions', 1);
      
      // Set cooldown
      this.reactionCooldown = true;
      setTimeout(() => {
        this.reactionCooldown = false;
      }, this.reactionTypes[reactionType].cooldown);
      
      // Auto-remove reaction after 5 seconds
      setTimeout(() => {
        firebase.remove(reactionRef);
      }, 5000);
      
      return true;
    } catch (error) {
      throw new Error('Failed to send reaction: ' + error.message);
    }
  }

  async sendChatMessage(message) {
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }
    
    if (message.length > 100) {
      throw new Error('Message too long (max 100 characters)');
    }
    
    try {
      const chatMessage = {
        spectatorId: this.spectatorId,
        message: message.trim(),
        timestamp: Date.now()
      };
      
      // Add message to Firebase
      const messageRef = firebase.push(this.chatRef);
      await firebase.set(messageRef, chatMessage);
      
      // Update spectator stats
      await this.updateSpectatorStats('chatMessages', 1);
      
      return true;
    } catch (error) {
      throw new Error('Failed to send chat message: ' + error.message);
    }
  }

  async makePrediction(prediction) {
    if (this.lastPrediction && Date.now() - this.lastPrediction.timestamp < 30000) {
      throw new Error('Can only make one prediction per 30 seconds');
    }
    
    try {
      const predictionData = {
        spectatorId: this.spectatorId,
        prediction: prediction,
        timestamp: Date.now(),
        ballNumber: Date.now() // Simplified ball tracking
      };
      
      // Store prediction
      await firebase.set(
        firebase.ref(firebase.db, `rooms/${this.roomId}/predictions/${this.spectatorId}`),
        predictionData
      );
      
      this.lastPrediction = predictionData;
      
      // Update spectator stats
      await this.updateSpectatorStats('predictions', 1);
      
      return true;
    } catch (error) {
      throw new Error('Failed to make prediction: ' + error.message);
    }
  }

  async updateSpectatorStats(statType, increment = 1) {
    try {
      const currentStats = await firebase.get(this.spectatorRef);
      const stats = currentStats.val() || {};
      
      stats[statType] = (stats[statType] || 0) + increment;
      stats.lastSeen = Date.now();
      
      await firebase.set(this.spectatorRef, stats);
    } catch (error) {
      console.error('Error updating spectator stats:', error);
    }
  }

  async setOnline(online) {
    try {
      await firebase.update(this.spectatorRef, {
        online: online,
        lastSeen: Date.now()
      });
      
      if (online) {
        await this.updateSpectatorCount();
      } else {
        // Delay before updating count to handle quick disconnects
        setTimeout(() => {
          this.updateSpectatorCount();
        }, 5000);
      }
      
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }

  async leaveMatch() {
    try {
      if (this.spectatorRef) {
        await firebase.remove(this.spectatorRef);
      }
      
      await this.updateSpectatorCount();
      this.isConnected = false;
      
    } catch (error) {
      console.error('Error leaving match:', error);
    }
  }

  // Utility methods for external access
  getSpectatorId() {
    return this.spectatorId;
  }

  getRoomId() {
    return this.roomId;
  }

  isOnline() {
    return this.isConnected;
  }

  getMomentum() {
    return this.momentum;
  }

  getStatistics() {
    return { ...this.statistics };
  }

  getChatHistory() {
    return [...this.chatHistory];
  }

  getReactionTypes() {
    return Object.keys(this.reactionTypes);
  }

  canReact() {
    return !this.reactionCooldown;
  }

  canPredict() {
    return !this.lastPrediction || 
           Date.now() - this.lastPrediction.timestamp >= 30000;
  }

  // Clean up resources
  disconnect() {
    this.setOnline(false);
    // Note: Firebase listeners are automatically cleaned up when the page unloads
  }
}

// Spectator utility functions
class SpectatorUtils {
  static formatMomentum(momentum) {
    if (momentum > 80) return 'Strongly Favoring Team A';
    if (momentum > 60) return 'Favoring Team A';
    if (momentum >= 40 && momentum <= 60) return 'Balanced';
    if (momentum < 20) return 'Strongly Favoring Team B';
    if (momentum < 40) return 'Favoring Team B';
    return 'Balanced';
  }
  
  static getMomentumColor(momentum) {
    if (momentum > 70) return '#4CAF50';
    if (momentum > 55) return '#8BC34A';
    if (momentum >= 45 && momentum <= 55) return '#2196F3';
    if (momentum < 30) return '#F44336';
    if (momentum < 45) return '#FF5722';
    return '#2196F3';
  }
  
  static formatReactionCount(count) {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }
  
  static generateSpectatorNickname() {
    const adjectives = ['Cricket', 'Super', 'Amazing', 'Cool', 'Awesome', 'Epic'];
    const nouns = ['Fan', 'Viewer', 'Watcher', 'Supporter', 'Enthusiast'];
    const number = Math.floor(Math.random() * 999) + 1;
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adj}${noun}${number}`;
  }
  
  static validateChatMessage(message) {
    if (!message || typeof message !== 'string') {
      return 'Message must be a string';
    }
    
    if (message.trim().length === 0) {
      return 'Message cannot be empty';
    }
    
    if (message.length > 100) {
      return 'Message too long (max 100 characters)';
    }
    
    // Check for spam patterns
    if (/(.)\1{4,}/.test(message)) {
      return 'Message contains too many repeated characters';
    }
    
    // Check for excessive caps
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsRatio > 0.7 && message.length > 10) {
      return 'Please reduce the use of capital letters';
    }
    
    return null; // Valid message
  }
  
  static formatChatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  }
  
  static predictionsToText(prediction) {
    const predictions = {
      dot: 'Dot Ball',
      single: 'Single Run',
      boundary: 'Boundary (4)',
      six: 'Six',
      wicket: 'Wicket',
      wide: 'Wide Ball',
      noball: 'No Ball'
    };
    
    return predictions[prediction] || prediction;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SpectatorManager, SpectatorUtils };
} else {
  window.SpectatorManager = SpectatorManager;
  window.SpectatorUtils = SpectatorUtils;
}
