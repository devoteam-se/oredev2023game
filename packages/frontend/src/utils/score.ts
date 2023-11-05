import { maxGameDurationMs } from '../game/gameplay-machine';

const SUCCESS_COEF = 2;
const FAILURE_COEF = -1;

type CalculateScoreProps = {
  /** difficulty level */
  level: number;
  /** time elapsed for typing a word, ms */
  timeMs: number;
  /** positive result if true, negative if false */
  isSuccess: boolean;
};

export const calculateScore = ({ level, timeMs, isSuccess }: CalculateScoreProps): number => {
  const successCoefficient = isSuccess ? SUCCESS_COEF : FAILURE_COEF;
  const timeCoefficient = (maxGameDurationMs - timeMs) / 1000;

  return Math.round(level * timeCoefficient * successCoefficient);
};
