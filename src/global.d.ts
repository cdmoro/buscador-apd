declare global {
  interface Window {
    __internal__: {
        apiUrl?: string
    };
  }
}

export {};