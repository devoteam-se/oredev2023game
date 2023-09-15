import { createMachine } from 'xstate';
import { assign } from '@xstate/immer';
import { elements, hideElement, showElement } from './elements.ts';
import { cancelAnimation, startAnimation } from './animation.ts';
import { serverNames } from './server-names.ts';

const maxGameDurationMs = 45_000;
const maxNumActiveWords = 3;
const maxWaveSize = 7;
const messageDurationMs = 10_000;
const waveStartDelayMs = 3_000;

enum WordState {
  Inactive,
  Active,
  Cleared,
}

type GameplayContext = {
  animationIds: {
    countdown: number;
    heatDisplay: number;
  };
  currentWave: { [word: string]: WordState };
  focusedWord: string | null;
  remainingWaves: string[][];
  textEntry: string;
  waveStartTime: number;
};

export type GameplayKeystrokeEvent = {
  type: 'KEYSTROKE';
  char: string;
};
export type GameplayOverheatedEvent = { type: 'OVERHEATED' };
export type GameplayEvent = GameplayKeystrokeEvent | GameplayOverheatedEvent;

const isKeystrokeEvent = (
  event: GameplayEvent,
): event is GameplayKeystrokeEvent => event.type === 'KEYSTROKE';

export const gameplayMachine = createMachine<GameplayContext, GameplayEvent>(
  {
    predictableActionArguments: true,
    preserveActionOrder: true,

    entry: 'createWaves',
    exit: 'stopHeatDisplayAnimation',

    context: {
      animationIds: {
        countdown: NaN,
        heatDisplay: NaN,
      },
      currentWave: {},
      focusedWord: null,
      remainingWaves: [],
      textEntry: '',
      waveStartTime: NaN,
    },

    initial: 'waveCountdown',
    states: {
      waveCountdown: {
        entry: [
          'assignWaveStartTime',
          'startCountdownAnimation',
          () => showElement('wave-countdown'),
        ],
        exit: ['stopCountdownAnimation', () => hideElement('wave-countdown')],
        after: { [waveStartDelayMs]: 'wave' },
      },
      wave: {
        entry: [
          'startNextWave',
          'startHeatDisplayAnimation',
          () => showElement('wave'),
        ],
        exit: [() => hideElement('wave'), 'stopHeatDisplayAnimation'],

        after: { OVERHEAT_DELAY: 'failureMessage' },
        onDone: [
          { target: 'waveCountdown', cond: 'someWavesRemaining' },
          { target: 'victoryMessage' },
        ],

        initial: 'noWordFocused',
        states: {
          noWordFocused: {
            entry: [
              'resetTextEntry',
              'activateWordsAsNeeded',
              'updateWaveViews',
            ],
            on: {
              KEYSTROKE: {
                target: 'wordFocused',
                cond: 'validFirstChar',
                actions: 'assignFocusedWord',
              },
            },
            always: { target: 'waveDone', cond: 'waveExhausted' },
          },
          wordFocused: {
            entry: ['updateTextEntry', 'updateWaveViews'],
            on: {
              KEYSTROKE: [
                { target: 'noWordFocused', cond: 'invalidChar' },
                { target: 'wordFocused', cond: 'wordIncomplete' },
                { target: 'noWordFocused', actions: 'clearWord' },
              ],
            },
          },
          waveDone: { type: 'final' },
        },
      },
      failureMessage: {
        entry: () => showElement('failure-message'),
        exit: () => hideElement('failure-message'),
        after: { [messageDurationMs]: 'gameplayDone' },
      },
      victoryMessage: {
        entry: () => showElement('victory-message'),
        exit: () => hideElement('victory-message'),
        after: { [messageDurationMs]: 'gameplayDone' },
      },
      gameplayDone: { type: 'final' },
    },
  },
  {
    actions: {
      activateWordsAsNeeded: assign((ctx) => {
        const numActiveWords = Object.values(ctx.currentWave).reduce(
          (n, wordState) => (wordState === WordState.Active ? n + 1 : n),
          0,
        );
        const inactiveWords = Object.keys(ctx.currentWave)
          .filter((word) => ctx.currentWave[word] === WordState.Inactive)
          .sort(Math.random);

        const numWordsToActivate = Math.min(
          inactiveWords.length,
          maxNumActiveWords - numActiveWords,
          Object.keys(ctx.currentWave).length,
        );

        const newWave = { ...ctx.currentWave };
        for (let i = 0; i < numWordsToActivate; i++) {
          newWave[inactiveWords[i]] = WordState.Active;
        }

        ctx.currentWave = newWave;
      }),

      assignFocusedWord: assign((ctx, event: GameplayKeystrokeEvent) => {
        ctx.focusedWord =
          Object.keys(ctx.currentWave).find(
            (word) =>
              ctx.currentWave[word] === WordState.Active &&
              word.startsWith(event.char),
          ) ?? null;
      }),

      assignWaveStartTime: assign((ctx) => {
        ctx.waveStartTime = Date.now() + waveStartDelayMs;
      }),

      clearWord: assign((ctx) => {
        ctx.currentWave =
          ctx.focusedWord === null
            ? ctx.currentWave
            : { ...ctx.currentWave, [ctx.focusedWord]: WordState.Cleared };
      }),

      createWaves: assign((ctx) => {
        ctx.remainingWaves = serverNames.map((nameList) => {
          const pool = [...nameList].sort(Math.random);
          const result: string[] = [];

          while (result.length < maxWaveSize && result.length < pool.length) {
            const candidate = pool.pop();
            if (
              candidate &&
              !result.some((word) => word.startsWith(candidate.charAt(0)))
            ) {
              result.push(candidate);
            }
          }

          return result;
        });
      }),

      resetTextEntry: assign((ctx) => {
        ctx.textEntry = '';
        ctx.focusedWord = null;
      }),

      startCountdownAnimation: assign((ctx) => {
        const waveStartTime = ctx.waveStartTime;
        ctx.animationIds.countdown = startAnimation(() => {
          elements['wave-countdown-display'].textContent = Math.ceil(
            (waveStartTime - Date.now()) / 1000,
          ).toString();
        });
      }),

      startHeatDisplayAnimation: assign((ctx) => {
        const waveStartTime = ctx.waveStartTime;
        ctx.animationIds.heatDisplay = startAnimation(() => {
          const heatRatio = (Date.now() - waveStartTime) / maxGameDurationMs;
          elements['heat-display'].textContent = Math.floor(
            heatRatio * 100,
          ).toString();
        });
      }),

      startNextWave: assign((ctx) => {
        ctx.currentWave = [...ctx.remainingWaves[0]].reduce(
          (acc, word) => ({
            ...acc,
            [word]: WordState.Inactive,
          }),
          {} as GameplayContext['currentWave'],
        );
        ctx.remainingWaves = ctx.remainingWaves.slice(1);
      }),

      stopCountdownAnimation: (ctx) => {
        cancelAnimation(ctx.animationIds.countdown);
      },

      stopHeatDisplayAnimation: (ctx) => {
        cancelAnimation(ctx.animationIds.heatDisplay);
      },

      updateTextEntry: assign((ctx, event: GameplayKeystrokeEvent) => {
        ctx.textEntry = ctx.textEntry + event.char;
      }),

      updateWaveViews: (ctx) => {
        elements['active-words'].textContent = Object.keys(ctx.currentWave)
          .filter((word) => ctx.currentWave[word] === WordState.Active)
          .join(', ');
        elements['focused-word'].textContent = ctx.focusedWord ?? '';
        elements['text-entry'].textContent = ctx.textEntry;
      },
    },

    guards: {
      invalidChar: ({ focusedWord, textEntry }, event) =>
        !isKeystrokeEvent(event) ||
        focusedWord === null ||
        focusedWord.charAt(textEntry.length) !== event.char,

      someWavesRemaining: ({ remainingWaves }) => remainingWaves.length > 0,

      validFirstChar: ({ currentWave }, event) =>
        isKeystrokeEvent(event) &&
        Object.keys(currentWave).some(
          (word) =>
            currentWave[word] === WordState.Active &&
            word.startsWith(event.char),
        ),

      waveExhausted: ({ currentWave }) =>
        Object.values(currentWave).every(
          (wordState) => wordState === WordState.Cleared,
        ),

      wordIncomplete: ({ focusedWord, textEntry }, event) =>
        !isKeystrokeEvent(event) || textEntry + event.char !== focusedWord,
    },

    delays: {
      OVERHEAT_DELAY: maxGameDurationMs,
    },
  },
);
