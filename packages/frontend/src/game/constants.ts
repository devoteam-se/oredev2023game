import { gameStages } from './game-stages.ts';

export const totalNumServers = gameStages.reduce(
  (n, stage) => n + stage.numServers,
  0,
);
