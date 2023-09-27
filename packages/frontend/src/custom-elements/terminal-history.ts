import terminalHistoryCss from './terminal-history.css';

const terminalColors = [
  'primary',
  'secondary',
  'red',
  'green',
  'yellow',
  'blue',
] as const;
export type TerminalColor = (typeof terminalColors)[number] | 'default';

export type TerminalHistoryItemOptions = {
  color?: TerminalColor;
  bold?: boolean;
};
export type TerminalHistoryLineOptions = TerminalHistoryItemOptions & {
  delayMs?: number;
};
export type TerminalHistoryLine =
  | string
  | [value: string, options?: TerminalHistoryLineOptions];

const defaultTerminalHistoryLineOptions: Required<TerminalHistoryLineOptions> =
  {
    color: 'default',
    bold: false,
    delayMs: 0,
  } as const;
type NormalizedLine = {
  value: string;
  options: Required<TerminalHistoryLineOptions>;
};

export class HTMLTerminalHistoryElement extends HTMLElement {
  private lines: number = 10;
  private readonly container: HTMLDivElement;
  private data: NormalizedLine[] = [];
  private readonly timeoutIds: Set<number> = new Set();

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = terminalHistoryCss;
    shadowRoot.appendChild(style);

    this.container = document.createElement('div');
    shadowRoot.appendChild(this.container);

    // this.rerender();
  }

  static get observedAttributes() {
    return ['lines'] as const;
  }

  connectedCallback() {
    const linesAttribute = this.getAttribute('lines');

    if (linesAttribute) {
      this.lines = parseInt(linesAttribute, 10);
    }

    this.rerender();
  }

  attributeChangedCallback(
    name: string,
    _: string | null,
    newValue: string | null,
  ) {
    if (name !== 'lines') {
      return;
    }

    this.lines = newValue === null ? 10 : parseInt(newValue, 10);

    this.rerender();
  }

  public push(line: string, options: TerminalHistoryLineOptions = {}) {
    const normalizedLine: NormalizedLine = {
      value: line,
      options: { ...defaultTerminalHistoryLineOptions, ...options },
    };

    if (normalizedLine.options.delayMs > 0) {
      const timeoutId = setTimeout(() => {
        this.push(line, { ...normalizedLine.options, delayMs: 0 });
        this.timeoutIds.delete(timeoutId);
      }, normalizedLine.options.delayMs);

      this.timeoutIds.add(timeoutId);
    } else {
      this.data.push(normalizedLine);
    }

    this.rerender();
  }

  public reset() {
    this.data = [];
    for (let timeoutId of this.timeoutIds) {
      clearTimeout(timeoutId);
      this.timeoutIds.delete(timeoutId);
    }
    this.rerender();
  }

  private rerender() {
    const lineElements = this.container.getElementsByClassName(
      'terminal-history-line',
    );
    if (lineElements.length > this.lines) {
      Array.from(lineElements)
        .slice(this.lines)
        .forEach((element) => {
          element.remove();
        });
    } else
      while (lineElements.length < this.lines) {
        const element = document.createElement('div');
        element.classList.add('terminal-history-line');
        this.container.appendChild(element);
      }

    while (this.data.length < this.lines) {
      this.data.push({
        value: '',
        options: defaultTerminalHistoryLineOptions,
      });
    }

    for (let i = 0; i < this.lines; i++) {
      const {
        value,
        options: { color, bold },
      } = this.data[this.data.length - 1 - i];
      const lineElement = lineElements[lineElements.length - 1 - i];
      lineElement.textContent = value;

      terminalColors.forEach((colorName) => {
        lineElement.classList.toggle(colorName, color === colorName);
      });

      lineElement.classList.toggle('bold', bold);
    }
  }
}

customElements.define('terminal-history', HTMLTerminalHistoryElement);
