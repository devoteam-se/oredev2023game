import { assign } from 'xstate';
import { elements, serverViews } from '../game/elements.ts';
import {
  GameplayContext,
  GameplayEvent,
  countdownDurationMs,
  isKeystrokeEvent,
  isEnterEvent,
  GameplayEnterEvent,
} from '../game/gameplay-machine.ts';

export const hideFailureMessage = () => elements['failure-message'].close();

export const hideVictoryMessage = () => elements['victory-message'].close();

export const initializeTerminal = () => {
  const t = elements['terminal-history'];

  t.reset();

  t.push('SERVER HYPERVISION INTERFACE v9.26.0_20231108-10', {
    bold: true,
  });
  t.push('Copyright (C) 20XX, Devoteam Informatronics Corporation.');
  t.push('All rights reserved.');

  t.push('Booting up...', {
    delayMs: countdownDurationMs * 0.1,
    color: 'secondary',
  });

  t.push('Initializing...', {
    delayMs: countdownDurationMs * 0.2,
    color: 'secondary',
  });

  t.push('Loading...', {
    delayMs: countdownDurationMs * 0.3,
    color: 'secondary',
  });

  t.push('Reticulating splines...', {
    delayMs: countdownDurationMs * 0.6,
    color: 'secondary',
  });

  t.push('Assessing server temperatures...', {
    delayMs: countdownDurationMs * 0.65,
    color: 'secondary',
  });

  t.push('WARNING: Rising server temperatures detected.', {
    delayMs: countdownDurationMs * 0.7,
    color: 'yellow',
  });

  t.push('ALERT: Server temperatures exceeding safety threshold!', {
    delayMs: countdownDurationMs * 0.9,
    color: 'red',
  });

  t.push('SAVE THE SERVERS!', {
    delayMs: countdownDurationMs * 0.9,
    color: 'red',
    bold: true,
  });
};

export const printErrorMessage = (ctx: GameplayContext, event: GameplayEnterEvent) => {
  if (!isEnterEvent(event)) {
    return;
  }

  elements['terminal-history'].push(`Unknown reboot code: \`${ctx.terminal.textEntry}\``, {
    color: 'red',
  });
};

export const printSuccessMessage = (ctx: GameplayContext, event: GameplayEnterEvent) => {
  if (!isEnterEvent(event)) {
    return;
  }

  const serverViewIndex = ctx.wave.serverViewIndicesByCode[ctx.terminal.textEntry];
  const serverView = serverViews[serverViewIndex];
  const serverId = serverView.idElement.textContent;

  elements['terminal-history'].push(`Server #${serverId} saved!`, {
    color: 'green',
  });
};

export const printUserCommand = (ctx: GameplayContext, event: GameplayEnterEvent) => {
  if (!isEnterEvent(event)) {
    return;
  }

  elements['terminal-history'].push(`> ${ctx.terminal.textEntry}`, { bold: true });
};

export const resetTextEntry = assign<GameplayContext, GameplayEvent>((ctx) => {
  return {
    terminal: {
      ...ctx.terminal,
      textEntry: '',
    },
  };
});

export const updateTextEntry = assign<GameplayContext, GameplayEvent>((ctx, event) => {
  let newTextEntry = ctx.terminal.textEntry;

  if (isKeystrokeEvent(event)) {
    newTextEntry += event.char;
  }

  return {
    terminal: {
      ...ctx.terminal,
      textEntry: newTextEntry,
    },
  };
});

export const deleteLastCharEntered = assign<GameplayContext, GameplayEvent>((ctx) => {
  const newTextEntry = ctx.terminal.textEntry.slice(0, -1);
  return {
    terminal: {
      ...ctx.terminal,
      textEntry: newTextEntry,
    },
  };
});

export const updateTerminalView = (ctx: GameplayContext) => {
  elements['text-entry'].textContent = ctx.terminal.textEntry;
};
