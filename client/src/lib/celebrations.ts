// @ts-ignore
import confetti from 'canvas-confetti';

export function celebrateSuccess() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#8b5cf6', '#d946ef', '#ffffff'],
  });

  fire(0.2, {
    spread: 60,
    colors: ['#8b5cf6', '#d946ef', '#ffffff'],
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#8b5cf6', '#d946ef', '#ffffff'],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ['#8b5cf6', '#d946ef', '#ffffff'],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#8b5cf6', '#d946ef', '#ffffff'],
  });
}

export function celebrateSchedule() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#8b5cf6', '#d946ef', '#22c55e'],
    zIndex: 9999,
  });
}

export function celebrateCaptions() {
  const end = Date.now() + 1000;

  const frame = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#8b5cf6', '#d946ef'],
      zIndex: 9999,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#8b5cf6', '#d946ef'],
      zIndex: 9999,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}
