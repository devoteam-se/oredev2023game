import { createMachine } from 'xstate';
import { hideElement, showElement } from './elements.ts';
import { gameplayMachine } from './gameplay-machine.ts';

export type ScreenContext = {};
export type ScreenEvent = {
  type: 'START_GAME';
};
export const screenMachine = createMachine<ScreenContext, ScreenEvent>({
  predictableActionArguments: true,
  preserveActionOrder: true,

  context: {},

  initial: 'splash',
  states: {
    splash: {
      entry: () => showElement('splash-screen'),
      exit: () => hideElement('splash-screen'),
      on: { START_GAME: 'game' },
    },
    game: {
      initial: 'gameplay',
      onDone: 'splash',
      states: {
        gameplay: {
          entry: () => showElement('gameplay-screen'),
          exit: () => hideElement('gameplay-screen'),
          invoke: {
            id: 'gameplayMachine',
            src: gameplayMachine,
            onDone: 'gameOver',
          },
        },
        gameOver: {
          entry: () => showElement('game-over-screen'),
          exit: () => hideElement('game-over-screen'),
          type: 'final',
        },
      },
    },
  },
});
