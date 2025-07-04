# 🏏 HandiCricket - The Ultimate Cricket Game

A comprehensive web-based cricket simulation game featuring real-time multiplayer, AI opponents, and interactive spectator mode. Built with modern web technologies and optimized for deployment on GitHub Pages and Netlify.

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://app.netlify.com/sites/your-site-name/deploys)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://your-username.github.io/handicricket)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue)](https://web.dev/progressive-web-apps/)

## 🎮 Live Demo

- **Production**: [https://handicricket.netlify.app](https://handicricket.netlify.app)
- **GitHub Pages**: [https://your-username.github.io/handicricket](https://your-username.github.io/handicricket)

## ✨ Features

### 🏆 Game Modes
- **Real-time Multiplayer**: Play with friends using Firebase real-time sync
- **AI Opponents**: Challenge AI with 4 difficulty levels (Easy, Medium, Hard, Expert)
- **Spectator Mode**: Watch live matches with interactive reactions and chat
- **Multiple Formats**: 5, 10, 20, 50 overs, and Test matches

### 🎯 Advanced Mechanics
- **Authentic Cricket Rules**: Powerplay, dead overs, free hits, follow-on
- **Player Lives System**: Strategic wicket management with multiple lives
- **Dynamic Conditions**: Weather, pitch conditions affecting gameplay
- **Live Statistics**: Real-time scoreboard with detailed analytics

### 📱 Modern Web Features
- **Progressive Web App (PWA)**: Install and play offline
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Real-time Sync**: Instant updates using Firebase Realtime Database
- **Service Worker**: Offline functionality and caching
- **Touch Support**: Full touch and gesture support for mobile devices

### 👥 Social Features
- **Spectator Reactions**: Live emoji reactions during matches
- **Chat System**: Real-time chat for spectators
- **Match History**: Track your performance over time
- **Achievements**: Unlock milestones and badges
- **Leaderboards**: Compete with other players

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for multiplayer features
- Firebase account (for multiplayer hosting)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/handicricket.git
   cd handicricket
   ```

2. **Configure Firebase** (Optional - for multiplayer)
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Realtime Database
   - Update Firebase config in `js/firebase.js`:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     // ... other config
   };
   ```

3. **Deploy to Netlify**
   
   [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/handicricket)
   
   Or manual deployment:
   - Fork this repository
   - Connect your GitHub account to Netlify
   - Select this repository
   - Deploy with default settings

4. **Deploy to GitHub Pages**
   ```bash
   # Enable GitHub Pages in repository settings
   # Select 'Deploy from a branch' -> 'main' -> '/ (root)'
   