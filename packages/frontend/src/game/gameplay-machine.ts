import { createMachine } from 'xstate';

import * as WaveActions from '../actions/wave.ts';
import * as TerminalActions from '../actions/terminal.ts';

export enum ServerState {
  Inactive,
  Active,
  Cleared,
}

export const countdownDurationMs = 3_000;
export const maxGameDurationMs = 90_000;
export const maxNumActiveWords = 3;
const postGameMessageDurationMs = 10_000;

// TODO make an actual heat meter component
export const heatStringDefault = '';
export const heatStrings = {
  [ServerState.Inactive]: '●●●●●●',
  [ServerState.Active]: '●●●●●●●●●',
  [ServerState.Cleared]: '●●●',
} as const;
export const heatPercentageDefault = '0%';
export const heatPercentages = {
  [ServerState.Inactive]: '67%',
  [ServerState.Active]: '100%',
  [ServerState.Cleared]: '33%',
} as const;

type WaveContext = {
  currentWave: { [code: string]: ServerState };
  remainingWaves: string[][];
  waveStartTime: number;
  serverViewIndicesByCode: { [code: string]: number };
  currentWordStartTime: number;
  currentWordTypingTime: number;
  score: number;
};

type TerminalContext = {
  textEntry: string;
};

export type GameplayContext = {
  animationIds: {
    heatDisplay: number;
  };
  wave: WaveContext;
  terminal: TerminalContext;
};

export type GameplayKeystrokeEvent = {
  type: 'KEYSTROKE';
  char: string;
};
export type GameplayOkClickedEvent = { type: 'OK_CLICKED' };
export type GameplayBackspaceEvent = { type: 'BACKSPACE' };
export type GameplayEnterEvent = { type: 'ENTER' };
export type GameplayEvent =
  | GameplayKeystrokeEvent
  | GameplayBackspaceEvent
  | GameplayOkClickedEvent
  | GameplayEnterEvent;

export const isKeystrokeEvent = (event: GameplayEvent): event is GameplayKeystrokeEvent => event.type === 'KEYSTROKE';

export const isEnterEvent = (event: GameplayEvent): event is GameplayEnterEvent => event.type === 'ENTER';

export const gameplayMachine = createMachine<GameplayContext, GameplayEvent>(
  {
    predictableActionArguments: true,
    preserveActionOrder: true,

    context: {
      animationIds: {
        heatDisplay: NaN,
      },
      wave: {
        currentWave: {},
        remainingWaves: [],
        waveStartTime: NaN,
        serverViewIndicesByCode: {},
        currentWordStartTime: NaN,
        currentWordTypingTime: NaN,
        score: 0,
      },
      terminal: {
        textEntry: '',
      },
    },

    initial: 'countdown',
    states: {
      // TODO implement countdown visuals
      countdown: {
        entry: ['createWaves', 'assignServerViewIndices', 'initializeServerViews', 'initializeTerminal'],
        invoke: {
          src: 'updateTopScoreService',
        },
        after: {
          [countdownDurationMs]: 'playing',
        },
      },
      playing: {
        entry: ['assignWaveStartTime', 'startNextWave', 'startHeatDisplayAnimation'],
        exit: ['stopHeatDisplayAnimation'],

        onDone: [{ target: 'victory', cond: 'allWavesCleared' }, { target: 'playing' }],
        after: { OVERHEAT_DELAY: 'failure' },

        initial: 'idle',
        states: {
          idle: {
            entry: [
              'resetTextEntry',
              'activateWordsAsNeeded',
              'updateServerViews',
              'updateTerminalView',
              'updateScoreView',
            ],
            on: {
              KEYSTROKE: {
                target: 'typing',
                actions: ['updateTextEntry', 'updateTerminalView'],
              },
            },
            always: [{ target: 'waveDone', cond: 'waveCleared' }],
          },
          typing: {
            entry: ['assignWordStartTime'],
            on: {
              KEYSTROKE: [
                {
                  actions: ['updateTextEntry', 'updateTerminalView'],
                },
              ],
              ENTER: [
                {
                  target: 'idle',
                  cond: 'invalidWord',
                  actions: ['printUserCommand', 'printErrorMessage', 'decreaseScore'],
                },
                {
                  target: 'idle',
                  actions: ['printUserCommand', 'printSuccessMessage', 'clearWord', 'increaseScore'],
                },
              ],
              BACKSPACE: [
                { target: 'idle', cond: 'exactlyOneCharEntered' },
                { target: 'typing', actions: ['deleteLastCharEntered', 'updateTerminalView'] },
              ],
            },
            exit: ['assignWordTypingTime'],
          },
          waveDone: { type: 'final' },
        },
      },
      failure: {
        entry: 'showFailureMessage',
        exit: 'hideFailureMessage',
        on: { OK_CLICKED: 'gameplayDone' },
        after: { [postGameMessageDurationMs]: 'gameplayDone' },
      },
      victory: {
        entry: 'showVictoryMessage',
        invoke: {
          src: 'triggerVictoryService',
        },
        exit: 'hideVictoryMessage',
        on: { OK_CLICKED: 'gameplayDone' },
        after: { [postGameMessageDurationMs]: 'gameplayDone' },
      },
      gameplayDone: { type: 'final', entry: 'stopHeatDisplayAnimation' },
    },
  },
  {
    services: {
      triggerVictoryService: TerminalActions.triggerVictory,
      updateTopScoreService: WaveActions.updateTopScore,
    },
    actions: {
      hideFailureMessage: TerminalActions.hideFailureMessage,
      hideVictoryMessage: TerminalActions.hideVictoryMessage,
      initializeTerminal: TerminalActions.initializeTerminal,
      printErrorMessage: TerminalActions.printErrorMessage,
      printSuccessMessage: TerminalActions.printSuccessMessage,
      printUserCommand: TerminalActions.printUserCommand,
      resetTextEntry: TerminalActions.resetTextEntry,
      showFailureMessage: TerminalActions.showFailureMessage,
      showVictoryMessage: TerminalActions.showVictoryMessage,
      updateTextEntry: TerminalActions.updateTextEntry,
      deleteLastCharEntered: TerminalActions.deleteLastCharEntered,
      updateTerminalView: TerminalActions.updateTerminalView,

      activateWordsAsNeeded: WaveActions.activateWordsAsNeeded,
      assignServerViewIndices: WaveActions.assignServerViewIndices,
      assignWaveStartTime: WaveActions.assignWaveStartTime,
      createWaves: WaveActions.createWaves,
      hideWaveView: WaveActions.hideWaveView,
      initializeServerViews: WaveActions.initializeServerViews,
      startHeatDisplayAnimation: WaveActions.startHeatDisplayAnimation,
      startNextWave: WaveActions.startNextWave,
      stopHeatDisplayAnimation: WaveActions.stopHeatDisplayAnimation,
      updateServerViews: WaveActions.updateServerViews,
      updateScoreView: WaveActions.updateScoreView,
      clearWord: WaveActions.clearWord,
      decreaseScore: WaveActions.decreaseScore,
      increaseScore: WaveActions.increaseScore,
      assignWordStartTime: WaveActions.assignWordStartTime,
      assignWordTypingTime: WaveActions.assignWordTypingTime,
    },

    guards: {
      allWavesCleared: ({ wave }) => wave.remainingWaves.length === 0,

      exactlyOneCharEntered: ({ terminal }) => terminal.textEntry.length === 1,

      invalidWord: ({ wave, terminal }) => !wave.currentWave[terminal.textEntry],

      waveCleared: ({ wave }) =>
        Object.values(wave.currentWave).every((wordState) => wordState === ServerState.Cleared),
    },

    delays: {
      OVERHEAT_DELAY: maxGameDurationMs,
    },
  },
);
