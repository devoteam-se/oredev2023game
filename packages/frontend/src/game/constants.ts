import { gameStages } from './game-stages.ts';

export const maxGameDurationMs = 45_000_000;
export const maxNumActiveWords = 3;
export const totalNumServers = gameStages.reduce(
  (n, stage) => n + stage.numServers,
  0,
);
export const postGameMessageDurationMs = 10_000;
