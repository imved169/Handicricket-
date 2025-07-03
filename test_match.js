
export class TestMatchHandler {
  constructor() {
    this.daysRemaining = 5;
    this.oversToday = 0;
    this.maxOversPerDay = 90;
  }

  endDaysPlay() {
    this.daysRemaining--;
    this.oversToday = 0;
  }

  checkFollowOn(team1Score, team2Score) {
    return (team1Score - team2Score) >= 200;
  }
}
