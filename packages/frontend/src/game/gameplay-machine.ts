import { createMachine } from 'xstate';
import { assign } from '@xstate/immer';
import { elements, hideElement, serverViews } from './elements.ts';
import { cancelAnimation, startAnimation } from './animation.ts';
import { serverNames } from './server-names.ts';
import {
  maxGameDurationMs,
  maxNumActiveWords,
  maxWaveSize,
  postGameMessageDurationMs,
} from './constants.ts';

enum ServerState {
  Inactive,
  Active,
  Cleared,
}
const stateStrings = {
  [ServerState.Inactive]: 'Warning',
  [ServerState.Active]: 'Overheating',
  [ServerState.Cleared]: 'OK',
} as const;

type GameplayContext = {
  animationIds: {
    heatDisplay: number;
  };
  currentWave: { [code: string]: ServerState };
  focusedWord: string | null;
  remainingWaves: string[][];
  textEntry: string;
  waveStartTime: number;
  serverViewIndicesByCode: { [code: string]: number };
};

export type GameplayKeystrokeEvent = {
  type: 'KEYSTROKE';
  char: string;
};
export type GameplayOkClickedEvent = { type: 'OK_CLICKED' };
export type GameplayEvent = GameplayKeystrokeEvent | GameplayOkClickedEvent;

const isKeystrokeEvent = (
  event: GameplayEvent,
): event is GameplayKeystrokeEvent => event.type === 'KEYSTROKE';

export const gameplayMachine = createMachine<GameplayContext, GameplayEvent>(
  {
    predictableActionArguments: true,
    preserveActionOrder: true,

    context: {
      animationIds: {
        heatDisplay: NaN,
      },
      currentWave: {},
      focusedWord: null,
      remainingWaves: [],
      textEntry: '',
      waveStartTime: NaN,
      serverViewIndicesByCode: {},
    },

    initial: 'countdown',
    states: {
      countdown: {
        entry: [
          'createWaves',
          'assignServerViewIndices',
          'initializeServerViews',
        ],
        always: 'playing', // TODO implement countdown
      },
      playing: {
        entry: [
          'assignWaveStartTime',
          'startNextWave',
          'startHeatDisplayAnimation',
        ],
        exit: ['stopHeatDisplayAnimation'],

        onDone: [
          { target: 'victory', cond: 'allWavesCleared' },
          { target: 'playing' },
        ],
        after: { OVERHEAT_DELAY: 'failure' },

        initial: 'noWordFocused',
        states: {
          noWordFocused: {
            entry: [
              'resetTextEntry',
              'activateWordsAsNeeded',
              'updateServerViews',
            ],
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
                { target: 'noWordFocused', cond: 'invalidChar' },
                { target: 'wordFocused', cond: 'wordIncomplete' },
                { target: 'noWordFocused', actions: 'clearWord' },
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
      activateWordsAsNeeded: assign((ctx) => {
        const numActiveWords = Object.values(ctx.currentWave).reduce(
          (n, wordState) => (wordState === ServerState.Active ? n + 1 : n),
          0,
        );
        const inactiveWords = Object.keys(ctx.currentWave)
          .filter((word) => ctx.currentWave[word] === ServerState.Inactive)
          .shuffle();

        const numWordsToActivate = Math.min(
          inactiveWords.length,
          maxNumActiveWords - numActiveWords,
          Object.keys(ctx.currentWave).length,
        );

        const newWave = { ...ctx.currentWave };
        for (let i = 0; i < numWordsToActivate; i++) {
          newWave[inactiveWords[i]] = ServerState.Active;
        }

        ctx.currentWave = newWave;
      }),

      assignFocusedWord: assign((ctx, event: GameplayKeystrokeEvent) => {
        ctx.focusedWord =
          Object.keys(ctx.currentWave).find(
            (word) =>
              ctx.currentWave[word] === ServerState.Active &&
              word.startsWith(event.char),
          ) ?? null;
      }),

      assignServerViewIndices: assign((ctx) => {
        const serverViewIndices = Array.compute(
          serverViews.length,
          (i) => i,
        ).shuffle();

        ctx.remainingWaves.flat().forEach((code, i) => {
          ctx.serverViewIndicesByCode[code] = serverViewIndices[i];
        });
      }),

      assignWaveStartTime: assign((ctx) => {
        ctx.waveStartTime = Date.now();
      }),

      clearWord: assign((ctx) => {
        ctx.currentWave =
          ctx.focusedWord === null
            ? ctx.currentWave
            : { ...ctx.currentWave, [ctx.focusedWord]: ServerState.Cleared };
      }),

      createWaves: assign((ctx) => {
        ctx.remainingWaves = serverNames.map((nameList) => {
          const pool = [...nameList].shuffle();
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

      hideFailureMessage: () => elements['failure-message'].close(),

      hideVictoryMessage: () => elements['victory-message'].close(),

      hideWaveView: () => hideElement('servers-view'),

      initializeServerViews: (ctx) => {
        ctx.remainingWaves.flat().forEach((code, i) => {
          const serverViewIndex = ctx.serverViewIndicesByCode[code];
          const serverView = serverViews[serverViewIndex];

          serverView.idElement.textContent = (i + 1)
            .toString()
            .padStart(3, '0');
          serverView.codeElement.textContent = code;
        });
      },

      resetTextEntry: assign((ctx) => {
        ctx.textEntry = '';
        ctx.focusedWord = null;
      }),

      showFailureMessage: () => elements['failure-message'].showModal(),

      showVictoryMessage: () => elements['victory-message'].showModal(),

      startHeatDisplayAnimation: assign((ctx) => {
        const waveStartTime = ctx.waveStartTime;
        ctx.animationIds.heatDisplay = startAnimation(() => {
          const heatRatio = Math.min(
            1,
            (Date.now() - waveStartTime) / maxGameDurationMs,
          );
          elements['heat-display'].textContent = Math.floor(
            heatRatio * 100,
          ).toString();
        });
      }),

      startNextWave: assign((ctx) => {
        ctx.currentWave = [...ctx.remainingWaves[0]].reduce(
          (acc, word) => ({
            ...acc,
            [word]: ServerState.Inactive,
          }),
          ctx.currentWave,
        );
        ctx.remainingWaves = ctx.remainingWaves.slice(1);
      }),

      stopHeatDisplayAnimation: (ctx) => {
        cancelAnimation(ctx.animationIds.heatDisplay);
      },

      updateTextEntry: assign((ctx, event: GameplayKeystrokeEvent) => {
        ctx.textEntry = ctx.textEntry + event.char;
      }),

      updateServerViews: (ctx) => {
        Object.entries(ctx.serverViewIndicesByCode).forEach(
          ([word, serverViewIndex]) => {
            const serverState = ctx.currentWave[word];
            const serverView = serverViews[serverViewIndex];

            serverView.statusElement.textContent =
              serverState === undefined ? 'Unknown' : stateStrings[serverState];

            const classList = serverView.rootElement.classList;
            classList.toggle('focused', ctx.focusedWord === word);
            classList.toggle('cleared', serverState === ServerState.Cleared);
            classList.toggle('active', serverState === ServerState.Active);
            classList.toggle('inactive', serverState === ServerState.Inactive);
          },
        );

        elements['text-entry'].textContent = ctx.textEntry;
      },
    },

    guards: {
      allWavesCleared: ({ remainingWaves }) => remainingWaves.length === 0,

      invalidChar: ({ focusedWord, textEntry }, event) =>
        !isKeystrokeEvent(event) ||
        focusedWord === null ||
        focusedWord.charAt(textEntry.length) !== event.char,

      validFirstChar: ({ currentWave }, event) =>
        isKeystrokeEvent(event) &&
        Object.keys(currentWave).some(
          (word) =>
            currentWave[word] === ServerState.Active &&
            word.startsWith(event.char),
        ),

      waveCleared: ({ currentWave }) =>
        Object.values(currentWave).every(
          (wordState) => wordState === ServerState.Cleared,
        ),

      wordIncomplete: ({ focusedWord, textEntry }, event) =>
        !isKeystrokeEvent(event) || textEntry + event.char !== focusedWord,
    },

    delays: {
      OVERHEAT_DELAY: maxGameDurationMs,
    },
  },
);
