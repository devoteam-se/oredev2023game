import { createAppContext, elements } from './game';

const ctx = createAppContext();

elements['play-button'].addEventListener('click', () => {
  ctx.startGame();
});

window.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.repeat) return;

  if (!/^[a-z]$/i.test(event.key)) return;

  ctx.sendKeystroke(event.key.toLowerCase());
});

ctx.startApp();
