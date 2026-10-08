import { gameOver } from './gameLogic.js';
import { getDifficultySettings } from './targetLogic.js';
import { GAME_STATES } from './gameState.js';

export function updateTimer(delta, game) {
    // TODO (versi siswa): hitung waktu dan akhiri ronde saat waktu habis.
    // Petunjuk: akumulasi delta, gunakan ceil untuk HUD, dan panggil gameOver(game).
    if (game.state !== GAME_STATES.PLAYING) return;

    game.gameElapsed += delta;

    game.timeLeft = Math.ceil(game.selectedTime - game.gameElapsed);
    if (game.timeLeft < 0) game.timeLeft = 0;

    if (game.comboTimer > 0) {
        game.comboTimer -= delta;
        if (game.comboTimer <= 0) {
            game.updateCombo(false);
        }
    }

    if (game.timeLeft <= 0) {
        gameOver(game);
    }
}
