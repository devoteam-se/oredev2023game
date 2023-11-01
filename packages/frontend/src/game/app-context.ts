import { ActorRef, interpret, Subscription } from 'xstate';
import { screenMachine } from './screen-machine.ts';
import { GameplayEvent } from './gameplay-machine.ts';

export type AppContext = {
  startApp: () => void;
  startGame: () => void;
  sendKeystroke: (key: string) => void;
  sendBackspace: () => void;
  sendEnter: () => void;
  sendOkClicked: () => void;
};

export const createAppContext = (): AppContext => {
  const screenService = interpret(screenMachine);

  let gameplayMachineSubscription: Subscription | null = null;
  let gameplayService: ActorRef<GameplayEvent> | null = null;
  screenService.subscribe((appState) => {
    console.log('[app state]', appState);

    if (!appState.children.gameplayMachine) {
      gameplayService = null;
      if (gameplayMachineSubscription) {
        gameplayMachineSubscription.unsubscribe();
        gameplayMachineSubscription = null;
      }
      return;
    }

    gameplayService = appState.children.gameplayMachine;
    gameplayMachineSubscription = appState.children.gameplayMachine.subscribe((gameplayState) => {
      console.log('[gameplay state]', gameplayState);
    });
  });

  return {
    startApp: () => {
      screenService.start();
    },
    startGame: () => {
      screenService.send('START_GAME');
    },
    sendKeystroke: (char: string) => {
      if (gameplayService) {
        gameplayService.send({ type: 'KEYSTROKE', char });
      }
    },
    sendBackspace: () => {
      if (gameplayService) {
        gameplayService.send({ type: 'BACKSPACE' });
      }
    },
    sendEnter: () => {
      if (gameplayService) {
        gameplayService.send({ type: 'ENTER' });
      }
    },
    sendOkClicked: () => {
      if (!gameplayService) {
        return;
      }
      gameplayService.send({ type: 'OK_CLICKED' });
    },
  };
};
