import GameEngine from "./GameEngine";

(async function () {
    const engine = new GameEngine();
    await engine.start();
})();
