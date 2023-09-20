export {};

declare global {
  interface Array<T> {
    /**
     * Shuffles the array in place.
     * This method mutates the array and returns a reference to it.
     */
    shuffle(): Array<T>;
  }
  interface ArrayConstructor {
    /**
     * Creates a new array of the given length filled with values produced by
     * the given function.
     */
    compute<T>(length: number, fn: (i: number) => T): Array<T>;
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
    const result = new Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = fn(i);
    }
    return result;
  },
});
