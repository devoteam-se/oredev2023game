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
  focusedWord: string | null;
  remainingWaves: string[][];
  waveStartTime: number;
  serverViewIndicesByCode: { [code: string]: number };
};

type TerminalContext = {
  textEntry: string;
};

type GameplayContext = {
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
export type GameplayEvent = GameplayKeystrokeEvent | GameplayBackspaceEvent | GameplayOkClickedEvent;

export const isKeystrokeEvent = (event: GameplayEvent): event is GameplayKeystrokeEvent => event.type === 'KEYSTROKE';

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
        focusedWord: null,
        remainingWaves: [],
        waveStartTime: NaN,
        serverViewIndicesByCode: {},
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
        after: {
          [countdownDurationMs]: 'playing',
        },
      },
      playing: {
        entry: ['assignWaveStartTime', 'startNextWave', 'startHeatDisplayAnimation'],
        exit: ['stopHeatDisplayAnimation'],

        onDone: [{ target: 'victory', cond: 'allWavesCleared' }, { target: 'playing' }],
        after: { OVERHEAT_DELAY: 'failure' },

        initial: 'noWordFocused',
        states: {
          noWordFocused: {
            entry: ['resetTextEntry', 'activateWordsAsNeeded', 'updateServerViews'],
            on: {
              KEYSTROKE: {
                target: 'wordFocused',
                cond: 'validFirstChar',
                actions: 'assignFocusedWord',
              },
            },
            always: [{ target: 'waveDone', cond: 'waveCleared' }],
          },
          wordFocused: {
            entry: ['updateTextEntry', 'updateServerViews'],
            on: {
              KEYSTROKE: [
                {
                  target: 'noWordFocused',
                  cond: 'invalidChar',
                  actions: ['printUserCommand', 'printErrorMessage'],
                },
                {
                  target: 'wordFocused',
                  cond: 'wordIncomplete',
                },
                {
                  target: 'noWordFocused',
                  actions: ['printUserCommand', 'printSuccessMessage', 'clearWord'],
                },
              ],
              BACKSPACE: [
                {
                  target: 'noWordFocused',
                  cond: 'exactlyOneCharEntered',
                },
                {
                  target: 'wordFocused',
                  actions: 'deleteLastCharEntered',
                },
              ],
            },
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
        exit: 'hideVictoryMessage',
        on: { OK_CLICKED: 'gameplayDone' },
        after: { [postGameMessageDurationMs]: 'gameplayDone' },
      },
      gameplayDone: { type: 'final', entry: 'stopHeatDisplayAnimation' },
    },
  },
  {
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

      activateWordsAsNeeded: WaveActions.activateWordsAsNeeded,
      assignFocusedWord: WaveActions.assignFocusedWord,
      assignServerViewIndices: WaveActions.assignServerViewIndices,
      assignWaveStartTime: WaveActions.assignWaveStartTime,
      clearWord: WaveActions.clearWord,
      createWaves: WaveActions.createWaves,
      hideWaveView: WaveActions.hideWaveView,
      initializeServerViews: WaveActions.initializeServerViews,
      startHeatDisplayAnimation: WaveActions.startHeatDisplayAnimation,
      startNextWave: WaveActions.startNextWave,
      stopHeatDisplayAnimation: WaveActions.stopHeatDisplayAnimation,
      updateServerViews: WaveActions.updateServerViews,
    },

    guards: {
      allWavesCleared: ({ wave }) => wave.remainingWaves.length === 0,

      exactlyOneCharEntered: ({ terminal }) => terminal.textEntry.length === 1,

      invalidChar: ({ wave, terminal }, event) =>
        !isKeystrokeEvent(event) ||
        wave.focusedWord === null ||
        wave.focusedWord.charAt(terminal.textEntry.length) !== event.char,

      validFirstChar: ({ wave }, event) =>
        isKeystrokeEvent(event) &&
        Object.keys(wave.currentWave).some(
          (word) => wave.currentWave[word] === ServerState.Active && word.startsWith(event.char),
        ),

      waveCleared: ({ wave }) =>
        Object.values(wave.currentWave).every((wordState) => wordState === ServerState.Cleared),

      wordIncomplete: ({ wave, terminal }, event) =>
        !isKeystrokeEvent(event) || terminal.textEntry + event.char !== wave.focusedWord,
    },

    delays: {
      OVERHEAT_DELAY: maxGameDurationMs,
    },
  },
);
