import { gameStages } from './game-stages.ts';

export const countdownDurationMs = 3_000;
export const maxGameDurationMs = 90_000;
export const maxNumActiveWords = 3;
export const postGameMessageDurationMs = 10_000;
export const totalNumServers = gameStages.reduce(
  (n, stage) => n + stage.numServers,
  0,
);
