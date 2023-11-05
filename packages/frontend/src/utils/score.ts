import { maxGameDurationMs } from '../game/gameplay-machine';

const SUCCESS_COEF = 2;
const FAILURE_COEF = -1;
const DISPLAYED_DIGITS = 7;

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

export const formatScore = (score: number): string => {
  let scoreStr = score.toString();

  while (scoreStr.length < DISPLAYED_DIGITS) {
    scoreStr = '0' + scoreStr;
  }

  return scoreStr;
};

export const fetchTopScores = async function () {
  const response = await fetch('http://localhost:3000/api?type=top');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};
