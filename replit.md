# HandiCricket - The Ultimate Cricket Game

## Overview

HandiCricket is a comprehensive web-based cricket simulation game built with vanilla JavaScript, HTML, and CSS. The application features real-time multiplayer capabilities, AI opponents, and interactive spectator modes. It's designed as a Progressive Web App (PWA) with offline functionality and supports multiple cricket formats including T20, ODI, and Test matches.

## System Architecture

### Frontend Architecture
- **Pure Web Technologies**: Built with vanilla HTML5, CSS3, and JavaScript ES6 modules
- **Progressive Web App**: Implements PWA features including service workers, caching, and offline functionality
- **Responsive Design**: Mobile-first approach with support for touch devices and desktop
- **Module-based JavaScript**: Organized into logical modules (game-logic.js, ai-opponent.js, spectator.js, utils.js)

### Backend Architecture
- **Firebase Realtime Database**: Primary data store for match state, player data, and real-time synchronization
- **Serverless Architecture**: No traditional backend server; relies entirely on Firebase services
- **Real-time Updates**: Uses Firebase's real-time database for live match updates and spectator features

### Data Storage Solutions
- **Firebase Realtime Database**: Handles all persistent data including:
  - Room/match state management
  - Player profiles and statistics
  - Live match data and ball-by-ball updates
  - Spectator interactions and chat
  - Match history and achievements
- **LocalStorage**: Browser-based storage for user preferences and offline data
- **Service Worker Cache**: Caches static assets for offline functionality

## Key Components

### Game Engine
- **Core Game Logic**: Implements authentic cricket rules including powerplay, free hits, dead overs, and follow-on
- **AI Opponents**: Four difficulty levels (Easy, Medium, Hard, Expert) with adaptive strategies
- **Multiple Formats**: Support for 5, 10, 20, 50 overs, and Test matches
- **Player Lives System**: Strategic wicket management system

### Real-time Features
- **Live Match Updates**: Real-time synchronization of match state across all connected players
- **Spectator Mode**: Interactive viewing with reactions, chat, and live statistics
- **Connection Management**: Handles network disconnections and reconnections gracefully

### User Interface
- **Responsive Design**: Optimized for mobile, tablet, and desktop experiences
- **Touch Support**: Full gesture and touch support for mobile devices
- **Animations**: Smooth transitions and visual feedback using CSS animations
- **Accessibility**: Semantic HTML and keyboard navigation support

## Data Flow

### Match Creation Flow
1. User creates room with team name and format selection
2. Room code generated and stored in Firebase
3. Second player joins using room code
4. Both players enter Playing XI
5. Toss conducted to determine batting order
6. Match begins with real-time state synchronization

### Gameplay Flow
1. Players make card selections (0-6)
2. Selections synchronized via Firebase
3. Game logic processes results based on cricket rules
4. State updates broadcast to all connected clients
5. Spectators receive live updates and can interact

### AI Mode Flow
1. Single player selects AI difficulty
2. AI makes strategic decisions based on game state
3. AI adapts playing style based on match situation
4. All standard game rules apply with AI as opponent

## External Dependencies

### Firebase Services
- **Firebase Realtime Database**: Real-time data synchronization
- **Firebase Hosting**: Static file hosting (optional)
- **Firebase Configuration**: Centralized configuration management

### CDN Resources
- **Firebase SDK**: Loaded from Google CDN for performance
- **Feather Icons**: SVG icons for UI elements
- **Font Resources**: System fonts with web-safe fallbacks

### Browser APIs
- **Service Worker API**: Offline functionality and caching
- **Web App Manifest**: PWA installation capabilities
- **LocalStorage API**: Client-side data persistence
- **WebSocket-like**: Firebase's real-time connection

## Deployment Strategy

### Static Site Deployment
- **Netlify**: Primary deployment platform with automatic builds
- **GitHub Pages**: Secondary deployment option
- **Firebase Hosting**: Alternative hosting solution

### PWA Distribution
- **Web App Manifest**: Enables installation on mobile devices
- **Service Worker**: Provides offline functionality
- **Cache Strategy**: Network-first for dynamic content, cache-first for static assets

### Performance Optimization
- **Code Splitting**: Modular JavaScript architecture
- **Asset Optimization**: Minimal external dependencies
- **Lazy Loading**: Non-critical resources loaded on demand
- **CDN Integration**: External resources served from CDN

## Changelog

```
Changelog:
- July 04, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```