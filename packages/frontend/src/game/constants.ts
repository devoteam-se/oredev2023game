import { gameStages } from './game-stages.ts';

export const totalNumServers = gameStages.reduce((n, stage) => n + stage.numServers, 0);
export const GAME_STAGES_COUNT = gameStages.length;
export const LEADERBOARD_SIZE = 10;

export const VICTORY_TEXT_LEADER =
  'You not only saved all the servers but scored high enough to join our leader board!';
export const VICTORY_TEXT_NON_LEADER =
  "Unfortunately you didn't score high enough to reach the leader board but maybe next time!";

export const countdownDurationMs = 3_000;
export const maxGameDurationMs = 90_000;
export const maxNumActiveWords = 3;
export const postGameMessageDurationMs = 15_000;
