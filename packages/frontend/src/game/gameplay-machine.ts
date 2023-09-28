import { createMachine } from 'xstate';
import { assign } from '@xstate/immer';

import { cancelAnimation, startAnimation } from '../utils';

import { elements, hideElement, serverViews } from './elements.ts';
import { gameStages } from './game-stages.ts';
import {
  countdownDurationMs,
  maxGameDurationMs,
  maxNumActiveWords,
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
export type GameplayBackspaceEvent = { type: 'BACKSPACE' };
export type GameplayEvent =
  | GameplayKeystrokeEvent
  | GameplayBackspaceEvent
  | GameplayOkClickedEvent;

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
      // TODO implement countdown visuals
      countdown: {
        entry: [
          'createWaves',
          'assignServerViewIndices',
          'initializeServerViews',
          'initializeTerminal',
        ],
        after: {
          [countdownDurationMs]: 'playing',
        },
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
                {
                  target: 'noWordFocused',
                  cond: 'invalidChar',
                  actions: ['printUserCommand', 'printErrorMessage'],
                },
                { target: 'wordFocused', cond: 'wordIncomplete' },
                {
                  target: 'noWordFocused',
                  actions: [
                    'printUserCommand',
                    'printSuccessMessage',
                    'clearWord',
                  ],
                },
              ],
              BACKSPACE: [
                { target: 'noWordFocused', cond: 'exactlyOneCharEntered' },
                { target: 'wordFocused', actions: 'deleteLastCharEntered' },
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
        ctx.remainingWaves = gameStages.map((stage) => {
          const codes = [...stage.possibleCodes].shuffle();
          const result: string[] = [];

          while (
            result.length < stage.numServers &&
            result.length < codes.length
          ) {
            const candidate = codes.pop();
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

      deleteLastCharEntered: assign((ctx) => {
        ctx.textEntry = ctx.textEntry.slice(0, -1);
      }),

      hideFailureMessage: () => elements['failure-message'].close(),

      hideVictoryMessage: () => elements['victory-message'].close(),

      hideWaveView: () => hideElement('servers-view'),

      initializeServerViews: (ctx) => {
        const allCodes = ctx.remainingWaves.flat();
        const serverIds = Array.compute(allCodes.length, (i) =>
          (i + 1).toString().padStart(3, '0'),
        ).shuffle();

        allCodes.forEach((code, i) => {
          const serverViewIndex = ctx.serverViewIndicesByCode[code];
          const serverView = serverViews[serverViewIndex];

          serverView.rootElement.classList.remove('final-boss');
          serverView.idElement.textContent = serverIds[i];
          serverView.codeElement.textContent = code;
        });

        const finalCode = allCodes[allCodes.length - 1];
        const finalServerViewIndex = ctx.serverViewIndicesByCode[finalCode];
        const finalServerView = serverViews[finalServerViewIndex];

        finalServerView.rootElement.classList.add('final-boss');
        finalServerView.idElement.textContent = '503';
      },

      initializeTerminal: () => {
        const t = elements['terminal-history'];

        t.reset();

        t.push('SERVER HYPERVISION INTERFACE v9.26.0_20231108-10', {
          bold: true,
        });
        t.push(
          'Copyright (C) 20XX, Devoteam Informatronics Corporation. All rights reserved.',
        );

        t.push('Booting up...', {
          delayMs: countdownDurationMs * 0.1,
          color: 'secondary',
        });

        t.push('Initializing...', {
          delayMs: countdownDurationMs * 0.2,
          color: 'secondary',
        });

        t.push('Loading...', {
          delayMs: countdownDurationMs * 0.3,
          color: 'secondary',
        });

        t.push('Reticulating splines...', {
          delayMs: countdownDurationMs * 0.6,
          color: 'secondary',
        });

        t.push('Assessing server temperatures...', {
          delayMs: countdownDurationMs * 0.65,
          color: 'secondary',
        });

        t.push('WARNING: Rising server temperatures detected.', {
          delayMs: countdownDurationMs * 0.7,
          color: 'yellow',
        });

        t.push('ALERT: Server temperatures exceeding safety threshold!', {
          delayMs: countdownDurationMs * 0.9,
          color: 'red',
        });

        t.push('SAVE THE SERVERS!', {
          delayMs: countdownDurationMs * 0.9,
          color: 'red',
          bold: true,
        });
      },

      printErrorMessage: (ctx, event) => {
        if (!isKeystrokeEvent(event)) {
          return;
        }

        const invalidCode = ctx.textEntry + event.char;

        elements['terminal-history'].push(
          `Unknown reboot code: \`${invalidCode}\``,
          {
            color: 'red',
          },
        );
      },

      printSuccessMessage: (ctx) => {
        if (ctx.focusedWord === null) {
          return;
        }

        const serverViewIndex = ctx.serverViewIndicesByCode[ctx.focusedWord];
        const serverView = serverViews[serverViewIndex];
        const serverId = serverView.idElement.textContent;

        elements['terminal-history'].push(`Server #${serverId} saved!`, {
          color: 'green',
        });
      },

      printUserCommand: (ctx, event) => {
        if (!isKeystrokeEvent(event)) {
          return;
        }

        const command = ctx.textEntry + event.char;
        elements['terminal-history'].push(`> ${command}`, { bold: true });
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

      updateTextEntry: assign((ctx, event) => {
        if (isKeystrokeEvent(event)) {
          ctx.textEntry = ctx.textEntry + event.char;
        }
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

      exactlyOneCharEntered: ({ textEntry }) => textEntry.length === 1,

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
