import { createMachine } from 'xstate';
import { hideElement, showElement } from './elements.ts';
import { gameplayMachine } from './gameplay-machine.ts';

export type ScreenContext = {};
export type ScreenEvent = {
  type: 'START_GAME' | 'SHOW_INSTRUCTIONS' | 'EXIT_INSTRUCTIONS';
};
export const screenMachine = createMachine<ScreenContext, ScreenEvent>(
  {
    predictableActionArguments: true,
    preserveActionOrder: true,

    context: {},

    initial: 'splash',
    states: {
      splash: {
        entry: 'showSplashScreen',
        exit: 'hideSplashScreen',
        on: { START_GAME: 'game', SHOW_INSTRUCTIONS: 'instructions' },
      },
      game: {
        initial: 'gameplay',
        onDone: 'splash',
        states: {
          gameplay: {
            entry: 'showGameplayScreen',
            exit: 'hideGameplayScreen',
            invoke: {
              id: 'gameplayMachine',
              src: gameplayMachine,
              onDone: 'gameOver',
            },
          },
          gameOver: {
            entry: 'showGameOverScreen',
            exit: 'hideGameOverScreen',
            type: 'final',
          },
        },
      },
      instructions: {
        initial: 'instructions',
        onDone: 'splash',
        on: {
          EXIT_INSTRUCTIONS: 'splash',
        },
        states: {
          instructions: {
            entry: 'showInstructions',
            exit: 'hideInstructions',
          },
        },
      },
    },
  },
  {
    actions: {
      hideGameplayScreen: () => hideElement('gameplay-screen'),
      hideGameOverScreen: () => hideElement('game-over-screen'),
      hideSplashScreen: () => hideElement('splash-screen'),
      showGameplayScreen: () => showElement('gameplay-screen'),
      showGameOverScreen: () => showElement('game-over-screen'),
      showSplashScreen: () => showElement('splash-screen'),
      showInstructions: () => showElement('instructions'),
      hideInstructions: () => hideElement('instructions'),
    },
  },
);
