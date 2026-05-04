import { registerRootComponent } from 'expo';

import App from './App';

// Polyfill for Hermes runtime - Performance API support
if (typeof performance === 'undefined') {
  global.performance = {};
}
if (typeof performance.clearMarks === 'undefined') {
  performance.clearMarks = () => {};
}
if (typeof performance.clearMeasures === 'undefined') {
  performance.clearMeasures = () => {};
}
if (typeof performance.mark === 'undefined') {
  performance.mark = () => {};
}
if (typeof performance.measure === 'undefined') {
  performance.measure = () => {};
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
