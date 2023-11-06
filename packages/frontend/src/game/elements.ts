// TODO enforce presence and typing of required elements using linter
import { totalNumServers } from './constants.ts';
import { HTMLTerminalHistoryElement } from '../custom-elements';

const staticElements = {
  'name-input': HTMLInputElement,
  'email-input': HTMLInputElement,
  'can-contact': HTMLInputElement,
  'agree-gdpr': HTMLInputElement,
  'failure-message': HTMLDialogElement,
  'failure-ok-button': HTMLButtonElement,
  'game-over-screen': HTMLElement,
  'gameplay-screen': HTMLElement,
  'heat-value': HTMLElement,
  'play-button': HTMLButtonElement,
  'instructions-link': HTMLButtonElement,
  'server-view-template': HTMLTemplateElement,
  'servers-view': HTMLElement,
  'splash-screen': HTMLElement,
  'terminal-history': HTMLTerminalHistoryElement,
  'text-entry': HTMLElement,
  'victory-message': HTMLDialogElement,
  'victory-ok-button': HTMLButtonElement,
  'player-score-display': HTMLElement,
  'high-score-display': HTMLElement,
  instructions: HTMLElement,
  'hide-instructions': HTMLButtonElement,
} as const;
export type ElementId = keyof typeof staticElements;

type ElementInstance<I extends ElementId> = (typeof staticElements)[I]['prototype'];

const checkElement = <I extends ElementId>(id: I): ElementInstance<I> => {
  const element = document.getElementById(id);

  if (!element) {
    throw Error(`Could not find element #${id}`);
  }

  if (!(element instanceof staticElements[id])) {
    throw Error(`Element #${id} is not an instance of ${staticElements[id].name}`);
  }

  return element;
};

export const elements: { [I in ElementId]: ElementInstance<I> } = (() => {
  const result: { [id: string]: HTMLElement } = {};

  for (const key in staticElements) {
    const id = key as ElementId;
    result[id] = checkElement(id);
  }

  return result as { [I in ElementId]: ElementInstance<I> };
})();

export type ServerView = {
  rootElement: HTMLElement;
  idElement: HTMLElement;
  heatMeterElement: HTMLElement;
  heatPercentElement: HTMLElement;
  codeElement: HTMLElement;
};
export const serverViews: ServerView[] = (() => {
  const result: ServerView[] = [];
  for (let i = 0; i < totalNumServers; i++) {
    const clone = elements['server-view-template'].content.cloneNode(true) as DocumentFragment;
    const rootElement = clone.firstElementChild;

    if (!(rootElement instanceof HTMLElement)) {
      throw Error("First element child of cloned server view template's content is not an HTML element");
    }

    const checkSubView = (className: string): HTMLElement => {
      const element = rootElement.querySelector(`.${className}`);

      if (!(element instanceof HTMLElement)) {
        throw Error(`Could not find sub view with class ${className}`);
      }

      return element;
    };

    result.push({
      rootElement,
      idElement: checkSubView('id'),
      heatMeterElement: checkSubView('heat-meter'),
      heatPercentElement: checkSubView('heat-percent'),
      codeElement: checkSubView('code'),
    });

    elements['servers-view'].appendChild(rootElement);
  }

  return result;
})();

export const showElement = (id: ElementId) => elements[id].removeAttribute('hidden');
export const hideElement = (id: ElementId) => elements[id].setAttribute('hidden', '');
