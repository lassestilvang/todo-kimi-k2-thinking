/**
 * Runtime-only database loader that webpack cannot analyze
 * This module uses Function constructor which webpack cannot trace
 */

// Use Function constructor to create a loader that webpack cannot analyze
const createLoader = () => {
  return new Function('mod', 'return require(mod)');
};

export const loadDatabaseModule = (modulePath: string) => {
  const loader = createLoader();
  return loader(modulePath);
};