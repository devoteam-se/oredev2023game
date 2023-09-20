// TODO enforce presence and typing of required elements using linter
const requiredElements = {
  'active-words': HTMLElement,
  'failure-message': HTMLDialogElement,
  'failure-ok-button': HTMLButtonElement,
  'focused-word': HTMLElement,
  'game-over-screen': HTMLElement,
  'gameplay-screen': HTMLElement,
  'heat-display': HTMLElement,
  'play-button': HTMLButtonElement,
  'splash-screen': HTMLElement,
  'text-entry': HTMLElement,
  'victory-message': HTMLDialogElement,
  'victory-ok-button': HTMLButtonElement,
  'wave-view': HTMLElement,
} as const;
export type ElementId = keyof typeof requiredElements;

type ElementInstance<I extends ElementId> =
  (typeof requiredElements)[I]['prototype'];

const checkElement = <I extends ElementId>(id: I): ElementInstance<I> => {
  const element = document.getElementById(id);

  if (!element) {
    throw Error(`Could not find element #${id}`);
  }

  if (!(element instanceof requiredElements[id])) {
    throw Error(
      `Element #${id} is not an instance of ${requiredElements[id].name}`,
    );
  }

  return element;
};

export const elements: { [I in ElementId]: ElementInstance<I> } = (() => {
  const result: { [id: string]: HTMLElement } = {};

  for (const key in requiredElements) {
    const id = key as ElementId;
    result[id] = checkElement(id);
  }

  return result as { [I in ElementId]: ElementInstance<I> };
})();

export const showElement = (id: ElementId) =>
  elements[id].removeAttribute('hidden');
export const hideElement = (id: ElementId) =>
  elements[id].setAttribute('hidden', '');
