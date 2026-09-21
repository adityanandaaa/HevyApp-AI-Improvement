// Interaction constants (HANDOFF section 9).
export const TIMING = {
  pressedMs: 100, // visible pressed state after any tap
  signalMs: 1000, // signal appears within 1 second of checking a set
  transitionMs: 200, // fades and slides, none when reduced motion is on
  checkRegisterMs: 100, // checking a set never waits on the AI
};
