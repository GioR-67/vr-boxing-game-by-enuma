import * as THREE from 'three';
import { getDifficultySettings } from './targetLogic.js';

const SPEED_WINDOW = 0.12;
const HAND_IGNORE_SPEED = 0.55;
const PUNCH_COOLDOWN = 0.20;
const SCORE_INTERVAL_MS = 200;
const HIT_RADIUS = 0.50 * 0.48 + 0.12;

export function detectPunch(controller, hand, delta, game) {
    // TODO (versi siswa): deteksi pukulan dari kecepatan tangan controller.
    // Petunjuk: bandingkan posisi saat ini dengan sampel sebelumnya, lalu panggil checkHit.
    if (game.state !== 'PLAYING') return false;

    const previousPosition = hand === 'left'
        ? game.controllers.previousLeftPosition
        : game.controllers.previousRightPosition;
    const samples = hand === 'left' ? game.leftMotionSamples : game.rightMotionSamples;
    const motion = sampleHandMotion(controller, previousPosition, samples, delta);
    const speed = Math.max(motion.instantSpeed, motion.windowSpeed);

    if (hand === 'left') game.leftHandSpeed = motion.windowSpeed;
    else game.rightHandSpeed = motion.windowSpeed;
        const cooldownKey = hand === 'left' ? 'leftPunchCooldown' : 'rightPunchCooldown';
    if (game[cooldownKey] > 0) {
        game[cooldownKey] = Math.max(0, game[cooldownKey] - delta);
        return false;
    }
    if (speed < HAND_IGNORE_SPEED) return false;

    const settings = getDifficultySettings(game);
    if (speed < settings.minPunchSpeed) {
        game.status = `TOO SLOW  ${speed.toFixed(1)} m/s`;
        game.feedbackTimer = 0.9;
        game[cooldownKey] = PUNCH_COOLDOWN;
        return false;
    }

    const hit = checkHit(controller, game, motion, speed, hand);
    if (hit) game[cooldownKey] = PUNCH_COOLDOWN;
    return hit;
}


export function checkHit(controller, game, motion = game.latestMotion, speed = game.latestPunchSpeed, hand = game.latestPunchHand) {
    // TODO (versi siswa): bandingkan lintasan controller dengan target/hitbox.
    // Petunjuk: ukur jarak titik ke segmen, lalu perbarui hit/miss, score, combo, dan audio.
    if (!motion || !Number.isFinite(speed)) return false;
    game.latestMotion = motion;
    game.latestPunchSpeed = speed;
    game.latestPunchHand = hand;

    const box = game.getTargetHitbox();
    const hitPoint = !box.isEmpty() &&
        (box.containsPoint(motion.from) || box.containsPoint(motion.to));
    const segmentDistance = distancePointToSegment(game.target.position, motion.from, motion.to);
    const isHit = hitPoint || segmentDistance <= HIT_RADIUS;
    const closestDistance = Math.min(
        motion.from.distanceTo(game.target.position),
        motion.to.distanceTo(game.target.position),
        segmentDistance
    );
    if (isHit) {
        const now = performance.now();
        if (now - (game.lastScoredAt ?? -Infinity) < SCORE_INTERVAL_MS) {
            game[hand === 'left' ? 'leftPunchCooldown' : 'rightPunchCooldown'] = PUNCH_COOLDOWN;
            return false;
        }
        game.lastScoredAt = now;
        const settings = getDifficultySettings(game);
        const isPerfect = speed >= settings.perfectSpeed && closestDistance <= 0.13;
            game.hits += 1;
        if (isPerfect) game.perfects += 1;
        game.updateCombo(true);
        // Satu pukulan selalu memberi satu poin; combo hanya penghitung beruntun.
        const points = 1;
        game.addScore(points);
        game.target.material.color.setHex(isPerfect ? 0x66ff66 : 0xffff00);
        game.target.scale.setScalar(1.08);
        const fist = hand === 'left' ? game.controllers.leftFist : game.controllers.rightFist;
        fist.scale.setScalar(1.30);
        game.audio.play(isPerfect ? 'perfect' : 'hit', isPerfect ? 0.80 : 0.65);
        game.status = isPerfect ? `PERFECT +${points}` : `HIT +${points}`;
        game.feedbackTimer = 0.9;
        return true;
    }
    if (!isTargetedSwing(motion, game)) return false;
    game.misses += 1;
    game.updateCombo(false);
    game[hand === 'left' ? 'leftPunchCooldown' : 'rightPunchCooldown'] = PUNCH_COOLDOWN;
    game.audio.play('miss', 0.45);
    game.status = `MISS  ${speed.toFixed(1)} m/s`;
    game.feedbackTimer = 0.9;
    return false;
}

function sampleHandMotion(controller, previousPosition, samples, delta) {
    // TODO (versi siswa): simpan posisi controller dan hitung kecepatan.
    // Petunjuk: jarak dibagi delta menghasilkan kecepatan; jendela waktu mengurangi noise.

    // Tahap A: posisi sebelumnya dan posisi controller sekarang
    const from = previousPosition.clone();
    const to = new THREE.Vector3();
    controller.getWorldPosition(to);
    const instantSpeed = from.distanceTo(to) / delta;

    // Tahap B: simpan sampel posisi + waktu ke array samples
    const now = performance.now() / 1000; // detik
    samples.push({ position: to.clone(), time: now });

    // Buang sampel yang lebih tua dari SPEED_WINDOW (0.12 detik)
    while (samples.length > 0 && now - samples[0].time > SPEED_WINDOW) {
        samples.shift();
    }

    // windowSpeed = jarak sampel terlama ke terbaru dibagi selisih waktunya
    let windowSpeed = 0;
    if (samples.length >= 2) {
        const oldest = samples[0];
        const newest = samples[samples.length - 1];
        const timeDiff = newest.time - oldest.time;
        if (timeDiff > 0) {
            windowSpeed = oldest.position.distanceTo(newest.position) / timeDiff;
        }
    }

    // Update previousPosition supaya frame berikutnya punya "posisi sebelumnya" yang benar
    previousPosition.copy(to);

    return { instantSpeed, windowSpeed, from, to };
}

function isTargetedSwing(motion, game) {
    // TODO (versi siswa): bedakan ayunan yang menuju target dari gerakan lain.
    // Petunjuk: gunakan dot product arah ayunan dan arah target.
    const swingDirection = motion.to.clone().sub(motion.from).normalize();
    const directionToTarget = game.target.position.clone().sub(motion.to).normalize();
    return swingDirection.dot(directionToTarget) > 0.2;
}

function distancePointToSegment(point, start, end) {
    // TODO (versi siswa): cari jarak minimum titik terhadap garis segmen.
    // Petunjuk: proyeksikan vektor ke segmen dan batasi parameter t ke 0..1.
    const segment = end.clone().sub(start);
    const lengthSq = segment.lengthSq();
    if (lengthSq === 0) return point.distanceTo(start);
    let t = point.clone().sub(start).dot(segment) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    const closest = start.clone().addScaledVector(segment, t);
    return point.distanceTo(closest);
}


