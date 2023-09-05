const elementIds = [
  'active-words',
  'failure-message',
  'focused-word',
  'game-over-screen',
  'gameplay-screen',
  'heat-display',
  'play-button',
  'splash-screen',
  'text-entry',
  'victory-message',
  'wave',
  'wave-countdown',
  'wave-countdown-display',
] as const;
export type ElementId = (typeof elementIds)[number];

const requireElement = (id: ElementId): HTMLElement => {
  const element = document.getElementById(id);
  if (!element) {
    throw Error(`Could not find element: #${id}`);
  }
  return element;
};

export const elements: Record<ElementId, HTMLElement> = Object.assign(
  {},
  ...elementIds.map((id) => ({ [id]: requireElement(id) })),
);

export const showElement = (id: ElementId) =>
  elements[id].removeAttribute('hidden');
export const hideElement = (id: ElementId) =>
  elements[id].setAttribute('hidden', '');
