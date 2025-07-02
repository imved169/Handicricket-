
export class NotificationManager {
  static showFreeHit() {
    const el = document.createElement('div');
    el.className = 'notification free-hit';
    el.textContent = 'FREE HIT!';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  static showCentury(player) {
    const el = document.createElement('div');
    el.className = 'notification century';
    el.textContent = `${player} scored a Century!`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}
