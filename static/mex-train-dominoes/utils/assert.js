const AssertionError = class extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssertionError';
  }
};

const NotImplementedError = class extends Error {
  constructor() {
    super('Not implemented');
    this.name = 'NotImplementedError';
  }
};

/**
 * @param {boolean} condition - Condition to check
 * @param {string} message - Message to throw if condition is false
 * @throws {AssertionError}
 */
export const assert = (condition, message) => {
  if (!condition) {
    throw new AssertionError(message);
  }
};

/**
 * @throws {NotImplementedError}
 */
export const notImplemented = () => {
  throw new NotImplementedError();
};
