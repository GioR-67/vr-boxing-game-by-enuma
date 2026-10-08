import { GAME_STATES } from './gameState.js';
import { getDifficultySettings, moveTarget } from './targetLogic.js';

export function startGame(game) {
    // TODO (versi siswa): reset score, timer, combo, dan state ronde.
    // Petunjuk: solusi referensi ada di bawah; state awal ronde adalah COUNTDOWN.
    game.score = 0;
    game.combo = 0;
    game.hits = 0;
    game.misses = 0;
    game.perfects = 0;
    game.bestCombo = 0;
    game.gameElapsed = 0;
    game.timeLeft = game.selectedTime;
    game.comboTimer = 0;
    game.feedbackTimer = 0;
    game.leftHandSpeed = 0;
    game.rightHandSpeed = 0;
    game.leftPunchCooldown = 0;
    game.rightPunchCooldown = 0;
    game.lastScoredAt = -Infinity;
    game.leftMotionSamples.length = 0;
    game.rightMotionSamples.length = 0;
    game.controllersInitialized = false;
    game.countdownRemaining = 3;
    game.status = 'GET READY 3';
    game.state = GAME_STATES.COUNTDOWN;
    game.targetAngle = 0;
    game.orbitChangeTimer = 0;
    game.orbitChangeDuration = 0;
    game.orbitDirection = Math.random() < 0.5 ? -1 : 1;
    const settings = getDifficultySettings(game);
    game.orbitSpeed = (settings.orbitMin + Math.random() * (settings.orbitMax - settings.orbitMin));
    game.desiredOrbitSpeed = game.orbitSpeed;
    game.desiredOrbitDirection = game.orbitDirection;
    game.orbitChangeDuration = settings.directionChangeMin +
        Math.random() * (settings.directionChangeMax - settings.directionChangeMin);
    moveTarget(0, game);

    game.target.visible = false;
    game.target.material.color.setHex(0xff3333);
    game.target.scale.setScalar(1);
    game.controllers.leftFist.scale.setScalar(1);
    game.controllers.rightFist.scale.setScalar(1);
    if (game.assets?.dummy) game.assets.dummy.visible = false;
    game.hud.show(true);
    game.hud.showCountdown(true);
    game.hud.setCountdownText('3', '#ffffff');
    game.gameOverDisplay.hide();
    game.status = 'GET READY 3';
}

export function updateCountdown(delta, game) {
    // TODO (versi siswa): selesaikan hitung mundur lalu ubah state ke PLAYING.
    // Petunjuk: countdownStepTimer berkurang dengan delta; tampilkan 3, 2, 1, GO.
    if (game.state !== GAME_STATES.COUNTDOWN) return;
    game.countdownRemaining = Math.max(0, game.countdownRemaining - delta);
    const currentCount = Math.ceil(game.countdownRemaining);
    if (currentCount >= 1) {
        game.hud.setCountdownText(String(currentCount), '#ffffff');
    } else {
        game.hud.setCountdownText('GO!', '#66ff66');
        game.state = GAME_STATES.PLAYING;
        game.gameElapsed = 0;
        game.target.visible = game.assets?.dummy == null;
        if (game.assets?.dummy) game.assets.dummy.visible = true;
        game.feedbackTimer = 0.8;
        game.status = 'GO!';
        game.countdownRemaining = -999;
    }

    if (game.countdownRemaining < -0.45) game.hud.showCountdown(false);
}


export function gameOver(game) {
    // TODO (versi siswa): akhiri ronde satu kali dan tampilkan hasil akhir.
    // Petunjuk: ubah state, sembunyikan HUD/dummy, lalu panggil game.showGameOver(score).
    if (game.state === GAME_STATES.GAME_OVER) return;
    game.state = GAME_STATES.GAME_OVER;
    game.target.visible = false;
    game.hud.show(false);
    game.hud.showCountdown(false);
    game.status = 'GAME OVER';
    if (game.assets?.dummy) game.assets.dummy.visible = false;
    game.showGameOver(game.score, game.hits, game.misses, game.perfects, game.bestCombo);
}

