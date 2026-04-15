import { startGame } from './game/main';

// Instant start — no DOMContentLoaded wait. The script is loaded as a module
// at the bottom of <body> in index.html, so the DOM is already parsed when
// this runs.
startGame('game-container');
