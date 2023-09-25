import { cancelAnimation, startAnimation } from '../utils';

export class AutoClock extends HTMLElement {
  private timeElement: HTMLTimeElement;
  private animationRequestId: number = NaN;

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: 'open' });

    this.timeElement = document.createElement('time');

    shadowRoot.appendChild(this.timeElement);
  }

  connectedCallback() {
    this.animationRequestId = startAnimation(this.updateTime.bind(this));
  }

  disconnectedCallback() {
    cancelAnimation(this.animationRequestId);
  }

  private updateTime() {
    // locale it-IT gives 24h time format
    this.timeElement.dateTime = new Date().toLocaleTimeString('it-IT');
    this.timeElement.textContent = this.timeElement.dateTime;
  }
}

customElements.define('auto-clock', AutoClock);
