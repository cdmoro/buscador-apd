import type { Listener, State } from "./types";

function createStore(initialState: State) {
  let state = initialState;
  const listeners: Listener[] = [];

  return {
    getState() {
      return state;
    },

    getKey<K extends keyof State>(key: K) {
      return state[key];
    },

    setState(partial: Partial<State>) {
      state = { ...state, ...partial };
      listeners.forEach((l) => l(state));
    },

    subscribe(listener: Listener) {
      listeners.push(listener);
      return () => {
        const i = listeners.indexOf(listener);
        if (i > -1) listeners.splice(i, 1);
      };
    },
  };
}

export const store = createStore({
  start: 0,
  rows: 18,
  sort: "ult_movimiento desc",
});