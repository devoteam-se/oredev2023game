let nextAnimationId = 0;

type RafAnimation = {
  rafCallback: (time: number) => void;
  rafId: number;
};

const animations = new Map<number, RafAnimation>();

export const startAnimation = (callback: (time: number) => void): number => {
  const animationId = nextAnimationId++;

  const rafCallback = (time: number) => {
    callback(time);
    const rafId = window.requestAnimationFrame(rafCallback);
    animations.set(animationId, { rafCallback, rafId });
  };

  const rafId = window.requestAnimationFrame(rafCallback);
  animations.set(animationId, { rafCallback, rafId });

  return animationId;
};

export const cancelAnimation = (id: number): void => {
  const animation = animations.get(id);
  if (animation === undefined) {
    throw Error(`No animation with id ${id}`);
  }

  window.cancelAnimationFrame(animation.rafId);
};
