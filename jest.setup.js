/* eslint-env jest */
// Native modules don't exist under Jest — use the library-provided mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
