import './global.ts';
import './custom-elements';
import { createAppContext } from './game/app-context.ts';
import { elements } from './game/elements.ts';

const ctx = createAppContext();

elements['play-button'].addEventListener('click', () => {
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

ctx.startApp();
