import './global.ts';
import './custom-elements';
import { createAppContext } from './game/app-context.ts';
import { elements } from './game/elements.ts';
import { formatScore } from './utils/score.ts';

const ctx = createAppContext();

const fetchScores = async function (url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

const loadTopScore = function () {
  fetchScores('http://localhost:3000/api?type=top')
    .then(function (scores) {
      const topScore = scores[0]?.score;
      if (topScore) {
        elements['high-score-display'].textContent = formatScore(topScore);
      }
    })
    .catch(function (error) {
      console.error('Failed to load top players:', error);
    });
};

const canUserPlay = async (email: string) => {
  const url = `http://localhost:3000/api/can-play?email=${encodeURIComponent(email)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();

    return data.canPlay;
  } catch (error) {
    console.error('There was a problem:', error);
  }
};

elements['play-button'].addEventListener('click', async () => {
  const name = elements['name-input'].value;
  const email = elements['email-input'].value;
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

  if (!name) {
    alert('Name must be provided');
    return;
  }

  if (!email || !emailRegex.test(email)) {
    alert('Email must be provided');
    return;
  }
  const canPlay = await canUserPlay(email);

  if (!canPlay) {
    alert('You have played too many times');
    return;
  }

  ctx.startGame();
});

window.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === 'Backspace') {
    ctx.sendBackspace();
    return;
  }

  if (event.key === 'Enter') {
    ctx.sendEnter();
    return;
  }

  if (event.repeat) {
    return;
  }

  if (!/^[a-z]$/i.test(event.key)) {
    return;
  }

  ctx.sendKeystroke(event.key.toLowerCase());
});

elements['victory-ok-button'].addEventListener('click', () => {
  ctx.sendOkClicked();
});
elements['failure-ok-button'].addEventListener('click', () => {
  ctx.sendOkClicked();
});

loadTopScore();

ctx.startApp();
