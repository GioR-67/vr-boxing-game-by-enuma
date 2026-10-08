export function getDifficultySettings(game) {
    // TODO (versi siswa): pindahkan konfigurasi difficulty ke tabel agar mudah dibaca.
    // Petunjuk: EASY, NORMAL, HARD mengatur kecepatan pukulan dan orbit target.
    const difficulty = game?.difficulty?.toUpperCase?.() || 'NORMAL';

    if (difficulty === 'EASY') {
        return {
            orbitMin: 0.8, // rad/s - target berputar lambat (santai)
            orbitMax: 1.1, // rad/s
            directionChangeMin: 2.5, // detik - jarang ganti arah
            directionChangeMax: 3.5, // detik
            minPunchSpeed: 0.90, // m/s - syarat pukulan lebih ringan
            perfectSpeed: 1.40, // m/s - lebih besar dari minPunchSpeed
        };
    }

    if (difficulty === 'HARD') {
        return {
            orbitMin: 2.0, // rad/s - target berputar cepat (ngebut)
            orbitMax: 2.6, // rad/s
            directionChangeMin: 1.2, // detik - sering ganti arah
            directionChangeMax: 1.8, // detik
            minPunchSpeed: 1.40, // m/s - syarat pukulan lebih berat
            perfectSpeed: 1.90, // m/s - lebih besar dari minPunchSpeed
        };
    }

    // Default: NORMAL (juga dipakai jika difficulty tidak dikenal)
    return {
        orbitMin: 1.3, // rad/s - kecepatan putar target minimum
        orbitMax: 1.7, // rad/s - kecepatan putar target maksimum
        directionChangeMin: 1.8, // detik - minimal waktu sebelum ganti arah
        directionChangeMax: 2.5, // detik - maksimal waktu sebelum ganti arah
        minPunchSpeed: 1.20, // m/s - sesuai syarat: NORMAL = 1.20
        perfectSpeed: 1.70, // m/s - selalu lebih besar dari minPunchSpeed
    };
}

export function moveTarget(delta, game) {
    // TODO (versi siswa): gerakkan target mengelilingi pemain dengan delta time.
    // Petunjuk: ubah sudut berdasarkan speed dan arah; gunakan sin/cos untuk X/Z.
    if (game.orbitChangeDuration <= 0 || game.orbitChangeTimer >= game.orbitChangeDuration) {
        const settings = getDifficultySettings(game);
        game.desiredOrbitDirection = Math.random() < 0.5 ? 1 : -1;
        game.desiredOrbitSpeed = randomBetween(settings.orbitMin, settings.orbitMax);
        game.orbitChangeDuration = randomBetween(settings.directionChangeMin, settings.directionChangeMax);
        game.orbitChangeTimer = 0;
    }

    game.orbitChangeTimer += delta;
    game.orbitDirection = damp(game.orbitDirection, game.desiredOrbitDirection, 8, delta);
    game.orbitSpeed = damp(game.orbitSpeed, game.desiredOrbitSpeed, 5, delta);
    game.targetAngle += game.orbitDirection * game.orbitSpeed * delta;

    const x = game.playerAnchor.x + Math.sin(game.targetAngle) * game.targetRadius;
    const z = game.playerAnchor.z - Math.cos(game.targetAngle) * game.targetRadius;
    game.target.position.set(x, game.playerAnchor.y, z);
    game.target.lookAt(game.playerAnchor);
}

function damp(current, target, smoothing, delta) {
    // TODO (versi siswa): haluskan perubahan nilai tanpa bergantung pada FPS.
    // Petunjuk: faktor peredam dapat dihitung dengan eksponen dan delta time.
    const t = 1 - Math.exp(-smoothing * delta);
    return current + (target - current) * t;
}

function randomBetween(min, max) {
    // TODO (versi siswa): ambil angka acak dalam rentang yang diberikan.
    // Petunjuk: min + Math.random() dikali selisih max dan min.
    return min + Math.random() * (max - min);
}
