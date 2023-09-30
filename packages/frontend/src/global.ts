export {};

declare global {
  interface Array<T> {
    /**
     * Shuffles the array in place.
     * This method mutates the array and returns a reference to it.
     */
    shuffle(): this;
  }
  interface ArrayConstructor {
    /**
     * Creates a new array of the given length filled with values produced by
     * the given function.
     */
    compute<T>(length: number, fn: (i: number) => T): T[];
  }
}

Object.defineProperty(Array.prototype, 'shuffle', {
  enumerable: false,
  writable: false,
  configurable: false,
  value: function shuffle<T>(this: T[]): T[] {
    return this.sort(() => Math.random() - 0.5);
  },
});

Object.defineProperty(Array, 'compute', {
  enumerable: false,
  writable: false,
  configurable: false,
  value: function compute<T>(length: number, fn: (i: number) => T): Array<T> {
    return Array.from({ length }, (_, i) => fn(i));
  },
});
