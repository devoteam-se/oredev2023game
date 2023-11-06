import { maxGameDurationMs } from '../game/constants';

export class HTMLAutoClockElement extends HTMLElement {
  private readonly timeElement: HTMLTimeElement;
  private intervalId: number = NaN;
  private startTimestamp: number = NaN;

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: 'open' });
    this.timeElement = document.createElement('time');
    this.timeElement.textContent = (maxGameDurationMs / 1000).toString();
    shadowRoot.appendChild(this.timeElement);
  }

  private updateTime() {
    const timeElapsed = Date.now() - this.startTimestamp;
    const timeLeft = Math.round((maxGameDurationMs - timeElapsed) / 1000);
    this.timeElement.textContent = timeLeft.toString();
  }

  public startTime() {
    this.startTimestamp = Date.now();
    this.intervalId = setInterval(this.updateTime.bind(this), 1000);
  }

  public stopTime() {
    clearInterval(this.intervalId);
  }
}

customElements.define('auto-clock', HTMLAutoClockElement);
