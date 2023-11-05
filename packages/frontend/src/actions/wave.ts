import { assign } from 'xstate';
import {
  GameplayContext,
  GameplayEvent,
  ServerState,
  heatPercentageDefault,
  heatPercentages,
  heatStringDefault,
  heatStrings,
  maxGameDurationMs,
  maxNumActiveWords,
} from '../game/gameplay-machine';
import { elements, hideElement, serverViews } from '../game/elements';
import { gameStages } from '../game/game-stages';
import { startAnimation, cancelAnimation } from '../utils';
import { calculateScore, formatScore } from '../utils/score';

const GAME_STAGES_COUNT = gameStages.length;

export const activateWordsAsNeeded = assign<GameplayContext, GameplayEvent>((ctx: GameplayContext) => {
  const numActiveWords = Object.values(ctx.wave.currentWave).reduce(
    (n, wordState) => (wordState === ServerState.Active ? n + 1 : n),
    0,
  );
  const inactiveWords = Object.keys(ctx.wave.currentWave)
    .filter((word) => ctx.wave.currentWave[word] === ServerState.Inactive)
    .shuffle();

  const numWordsToActivate = Math.min(
    inactiveWords.length,
    maxNumActiveWords - numActiveWords,
    Object.keys(ctx.wave.currentWave).length,
  );

  const newWave = { ...ctx.wave.currentWave };
  for (let i = 0; i < numWordsToActivate; i++) {
    newWave[inactiveWords[i]] = ServerState.Active;
  }

  return {
    wave: {
      ...ctx.wave,
      currentWave: newWave,
    },
  };
});

export const assignServerViewIndices = assign<GameplayContext, GameplayEvent>((ctx) => {
  const serverViewIndices = Array.compute(serverViews.length, (i) => i).shuffle();

  const updatedServerViewIndicesByCode = {
    ...ctx.wave.serverViewIndicesByCode,
  };
  ctx.wave.remainingWaves.flat().forEach((code, i) => {
    updatedServerViewIndicesByCode[code] = serverViewIndices[i];
  });

  return {
    wave: {
      ...ctx.wave,
      serverViewIndicesByCode: updatedServerViewIndicesByCode,
    },
  };
});

export const assignWaveStartTime = assign<GameplayContext, GameplayEvent>((ctx) => {
  const now = Date.now();
  return {
    wave: {
      ...ctx.wave,
      waveStartTime: now,
    },
  };
});

export const createWaves = assign<GameplayContext, GameplayEvent>((ctx) => {
  const remainingWaves = gameStages.map((stage) => {
    const codes = [...stage.possibleCodes].shuffle();
    const result: string[] = [];

    while (result.length < stage.numServers && result.length < codes.length) {
      const candidate = codes.pop();
      if (candidate && !result.some((word) => word.startsWith(candidate.charAt(0)))) {
        result.push(candidate);
      }
    }

    return result;
  });

  return {
    wave: {
      ...ctx.wave,
      remainingWaves,
    },
  };
});

export const hideWaveView = () => hideElement('servers-view');

export const initializeServerViews = (ctx: GameplayContext) => {
  const allCodes = ctx.wave.remainingWaves.flat();
  const serverIds = Array.compute(allCodes.length, (i) => (i + 1).toString().padStart(2, '0')).shuffle();

  allCodes.forEach((code, i) => {
    const serverViewIndex = ctx.wave.serverViewIndicesByCode[code];
    const serverView = serverViews[serverViewIndex];

    serverView.rootElement.classList.remove('final-boss');
    serverView.idElement.textContent = serverIds[i];
    serverView.codeElement.textContent = code;
  });

  const finalCode = allCodes[allCodes.length - 1];
  const finalServerViewIndex = ctx.wave.serverViewIndicesByCode[finalCode];
  const finalServerView = serverViews[finalServerViewIndex];

  finalServerView.rootElement.classList.add('final-boss');
  finalServerView.idElement.textContent = '99';
};

export const startHeatDisplayAnimation = assign<GameplayContext, GameplayEvent>((ctx) => {
  const waveStartTime = ctx.wave.waveStartTime;
  const heatDisplay = startAnimation(() => {
    const heatRatio = Math.min(1, (Date.now() - waveStartTime) / maxGameDurationMs);
    elements['heat-value'].textContent = Math.floor(heatRatio * 100).toString();
  });

  return {
    animationIds: {
      ...ctx.animationIds,
      heatDisplay,
    },
  };
});

export const startNextWave = assign<GameplayContext, GameplayEvent>((ctx) => {
  const currentWave = [...ctx.wave.remainingWaves[0]].reduce(
    (acc, word) => ({
      ...acc,
      [word]: ServerState.Inactive,
    }),
    ctx.wave.currentWave,
  );
  const remainingWaves = ctx.wave.remainingWaves.slice(1);

  return {
    wave: {
      ...ctx.wave,
      currentWave,
      remainingWaves,
    },
  };
});

export const clearWord = assign<GameplayContext, GameplayEvent>((ctx: GameplayContext) => {
  const updatedCurrentWave = {
    ...ctx.wave.currentWave,
    [ctx.terminal.textEntry]: ServerState.Cleared,
  };

  return {
    wave: {
      ...ctx.wave,
      currentWave: updatedCurrentWave,
    },
  };
});

export const stopHeatDisplayAnimation = (ctx: GameplayContext) => {
  cancelAnimation(ctx.animationIds.heatDisplay);
};

export const updateServerViews = (ctx: GameplayContext) => {
  Object.entries(ctx.wave.serverViewIndicesByCode).forEach(([word, serverViewIndex]) => {
    const serverState = ctx.wave.currentWave[word];
    const serverView = serverViews[serverViewIndex];

    serverView.heatMeterElement.textContent = serverState === undefined ? heatStringDefault : heatStrings[serverState];

    serverView.heatPercentElement.textContent =
      serverState === undefined ? heatPercentageDefault : heatPercentages[serverState];

    const classList = serverView.rootElement.classList;
    classList.toggle('cleared', serverState === ServerState.Cleared);
    classList.toggle('active', serverState === ServerState.Active);
    classList.toggle('inactive', serverState === ServerState.Inactive);
  });
};

export const updateScoreView = (ctx: GameplayContext) => {
  const currentScore = ctx.wave.score;
  const scoreStr = formatScore(currentScore);

  elements['player-score-display'].textContent = scoreStr;
};

export const decreaseScore = assign<GameplayContext, GameplayEvent>((ctx: GameplayContext) => {
  const level = GAME_STAGES_COUNT - ctx.wave.remainingWaves.length;
  const time = ctx.wave.currentWordTypingTime;
  const score = calculateScore({ level, timeMs: time, isSuccess: false });

  const newScore = ctx.wave.score + score;

  return {
    wave: {
      ...ctx.wave,
      score: newScore <= 0 ? 0 : newScore,
    },
  };
});

export const increaseScore = assign<GameplayContext, GameplayEvent>((ctx: GameplayContext) => {
  const level = GAME_STAGES_COUNT - ctx.wave.remainingWaves.length;
  const time = ctx.wave.currentWordTypingTime;
  const score = calculateScore({ level, timeMs: time, isSuccess: true });

  return {
    wave: {
      ...ctx.wave,
      score: ctx.wave.score + score,
    },
  };
});

export const assignWordStartTime = assign<GameplayContext, GameplayEvent>((ctx: GameplayContext) => {
  return {
    wave: {
      ...ctx.wave,
      currentWordStartTime: Date.now(),
    },
  };
});

export const assignWordTypingTime = assign<GameplayContext, GameplayEvent>((ctx: GameplayContext) => {
  return {
    wave: {
      ...ctx.wave,
      currentWordTypingTime: Date.now() - ctx.wave.currentWordStartTime,
    },
  };
});
