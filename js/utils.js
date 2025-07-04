// Utility functions for HandiCricket game

// Room code generation
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Format name mapping
function getFormatName(format) {
  const formatMap = {
    '5': '5 Overs',
    '10': '10 Overs',
    '20': 'T20',
    '50': 'ODI',
    'test': 'Test Match'
  };
  return formatMap[format] || '5 Overs';
}

// Loading state management
function showLoading(message = 'Loading...') {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    const text = overlay.querySelector('p');
    if (text) text.textContent = message;
  }
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// Error handling
function showError(message) {
  const modal = document.getElementById('error-modal');
  const messageEl = document.getElementById('error-message');
  
  if (modal && messageEl) {
    messageEl.textContent = message;
    modal.style.display = 'flex';
  } else {
    alert(message); // Fallback
  }
}

function hideError() {
  const modal = document.getElementById('error-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Notification system
function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type} fade-in`;
  notification.textContent = message;
  
  // Style the notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    max-width: 300px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;
  
  // Set background color based on type
  const colors = {
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336'
  };
  notification.style.backgroundColor = colors[type] || colors.info;
  
  document.body.appendChild(notification);
  
  // Remove notification after duration
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, duration);
}

// Local storage utilities
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
}

function loadFromLocalStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
}

function removeFromLocalStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
}

// Date and time utilities
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

// Game format utilities
function getFormatRules(format) {
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
  
  return rules[format] || rules['5'];
}

// Score calculation utilities
function calculateRunRate(runs, balls) {
  if (balls === 0) return 0;
  return (runs / (balls / 6)).toFixed(2);
}

function calculateRequiredRate(target, runs, ballsRemaining) {
  if (ballsRemaining === 0) return 0;
  const runsNeeded = target - runs;
  return (runsNeeded / (ballsRemaining / 6)).toFixed(2);
}

function formatOvers(balls) {
  const overs = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return `${overs}.${remainingBalls}`;
}

// Validation utilities
function validateTeamName(name) {
  if (!name || name.trim().length === 0) {
    return 'Team name is required';
  }
  if (name.length > 50) {
    return 'Team name must be 50 characters or less';
  }
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    return 'Team name can only contain letters, numbers, spaces, hyphens, and underscores';
  }
  return null;
}

function validatePlayerName(name) {
  if (!name || name.trim().length === 0) {
    return 'Player name is required';
  }
  if (name.length > 30) {
    return 'Player name must be 30 characters or less';
  }
  if (!/^[a-zA-Z\s\-_]+$/.test(name)) {
    return 'Player name can only contain letters, spaces, hyphens, and underscores';
  }
  return null;
}

function validateRoomCode(code) {
  if (!code || code.trim().length === 0) {
    return 'Room code is required';
  }
  if (code.length !== 5) {
    return 'Room code must be 5 characters';
  }
  if (!/^[A-Z0-9]+$/.test(code)) {
    return 'Room code can only contain uppercase letters and numbers';
  }
  return null;
}

// Animation utilities
function animateElement(element, animationClass, duration = 1000) {
  if (!element) return;
  
  element.classList.add(animationClass);
  
  setTimeout(() => {
    element.classList.remove(animationClass);
  }, duration);
}

function createConfetti() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#66BB6A'];
  
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}vw;
      top: -10px;
      z-index: 1000;
      pointer-events: none;
    `;
    
    document.body.appendChild(confetti);
    
    setTimeout(() => {
      if (confetti.parentNode) {
        confetti.parentNode.removeChild(confetti);
      }
    }, 3000);
  }
}

// Device detection
function isMobile() {
  return window.innerWidth <= 768;
}

function isTablet() {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
}

function isDesktop() {
  return window.innerWidth > 1024;
}

// Touch event handling
function addTouchSupport(element, callback) {
  if (!element) return;
  
  let startX, startY, startTime;
  
  element.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
  });
  
  element.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const endTime = Date.now();
    
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const deltaTime = endTime - startTime;
    
    // Simple tap detection
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
      callback('tap');
    }
    
    // Simple swipe detection
    if (deltaTime < 500) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 50) callback('swipeRight');
        else if (deltaX < -50) callback('swipeLeft');
      } else {
        if (deltaY > 50) callback('swipeDown');
        else if (deltaY < -50) callback('swipeUp');
      }
    }
  });
}

// URL parameter utilities
function getUrlParameter(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function setUrlParameter(name, value) {
  const params = new URLSearchParams(window.location.search);
  params.set(name, value);
  window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
}

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility
function throttle(func, wait) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, wait);
    }
  };
}

// Copy to clipboard
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve();
  }
}

// Share functionality
function shareRoom(roomCode) {
  const shareData = {
    title: 'Join my HandiCricket match!',
    text: `Join my cricket match with room code: ${roomCode}`,
    url: window.location.origin + `?join=${roomCode}`
  };
  
  if (navigator.share) {
    navigator.share(shareData);
  } else {
    copyToClipboard(shareData.url).then(() => {
      showNotification('Room link copied to clipboard!', 'success');
    });
  }
}

// Export functions for global use
window.generateRoomCode = generateRoomCode;
window.getFormatName = getFormatName;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showError = showError;
window.hideError = hideError;
window.showNotification = showNotification;
window.saveToLocalStorage = saveToLocalStorage;
window.loadFromLocalStorage = loadFromLocalStorage;
window.removeFromLocalStorage = removeFromLocalStorage;
window.formatDate = formatDate;
window.formatRelativeTime = formatRelativeTime;
window.getFormatRules = getFormatRules;
window.calculateRunRate = calculateRunRate;
window.calculateRequiredRate = calculateRequiredRate;
window.formatOvers = formatOvers;
window.validateTeamName = validateTeamName;
window.validatePlayerName = validatePlayerName;
window.validateRoomCode = validateRoomCode;
window.animateElement = animateElement;
window.createConfetti = createConfetti;
window.isMobile = isMobile;
window.isTablet = isTablet;
window.isDesktop = isDesktop;
window.addTouchSupport = addTouchSupport;
window.getUrlParameter = getUrlParameter;
window.setUrlParameter = setUrlParameter;
window.debounce = debounce;
window.throttle = throttle;
window.copyToClipboard = copyToClipboard;
window.shareRoom = shareRoom;
