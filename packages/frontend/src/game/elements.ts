// TODO enforce presence and typing of required elements using linter
import { HTMLTerminalHistoryElement } from '../custom-elements';
import { checkByClass, checkById, checkSelector } from '../utils';

import { totalNumServers } from './constants.ts';

const staticElements = {
  'failure-message': HTMLDialogElement,
  'failure-ok-button': HTMLButtonElement,
  'game-over-screen': HTMLElement,
  'gameplay-screen': HTMLElement,
  'heat-value': HTMLElement,
  'play-button': HTMLButtonElement,
  'server-view-template': HTMLTemplateElement,
  'servers-view': HTMLElement,
  'splash-screen': HTMLElement,
  'terminal-history': HTMLTerminalHistoryElement,
  'text-entry': HTMLElement,
  'victory-message': HTMLDialogElement,
  'victory-ok-button': HTMLButtonElement,
} as const;
export type ElementId = keyof typeof staticElements;

type ElementInstance<I extends ElementId> =
  (typeof staticElements)[I]['prototype'];

export const elements: { [I in ElementId]: ElementInstance<I> } = (() => {
  const result: { [id: string]: HTMLElement } = {};

  for (const key in staticElements) {
    const id = key as ElementId;
    result[id] = checkById(id, staticElements[id]);
  }

  return result as { [I in ElementId]: ElementInstance<I> };
})();

export type ServerView = {
  container: HTMLElement;
  idElement: HTMLElement;
  heatMeterElement: HTMLElement;
  heatPercentElement: HTMLElement;
  codeElement: HTMLElement;
};
export const serverViews: ServerView[] = (() => {
  const result: ServerView[] = [];
  for (let i = 0; i < totalNumServers; i++) {
    const clone = elements['server-view-template'].content.cloneNode(
      true,
    ) as DocumentFragment;
    const container = checkSelector('*', HTMLElement, clone);

    const checkView = (className: string) =>
      checkByClass(className, HTMLElement, container);

    result.push({
      container,
      idElement: checkView('id'),
      heatMeterElement: checkView('heat-meter'),
      heatPercentElement: checkView('heat-percent'),
      codeElement: checkView('code'),
    });

    elements['servers-view'].appendChild(container);
  }

  return result;
})();

export const showElement = (id: ElementId) =>
  elements[id].removeAttribute('hidden');
export const hideElement = (id: ElementId) =>
  elements[id].setAttribute('hidden', '');
