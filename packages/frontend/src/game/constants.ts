import { serverNames } from './server-names.ts';

export const maxGameDurationMs = 45_000_000;
export const maxNumActiveWords = 3;
export const maxWaveSize = 7;
export const numServersInGame = serverNames.reduce(
  (n, nameList) => n + Math.min(maxWaveSize, nameList.length),
  0,
);
export const postGameMessageDurationMs = 10_000;
