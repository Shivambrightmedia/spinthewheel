const segments = [
    { text: "Cap", icon: "fa-hat-wizard", color: "#00529b" },
    { text: "Jersey", icon: "fa-shirt", color: "#b8860b" },
    { text: "Football", icon: "fa-futbol", color: "#0f1f38" },
    { text: "Better Luck", icon: "fa-face-frown", color: "#d4af37" },
    { text: "Cap", icon: "fa-hat-wizard", color: "#00529b" },
    { text: "Jersey", icon: "fa-shirt", color: "#b8860b" },
    { text: "Football", icon: "fa-futbol", color: "#0f1f38" },
    { text: "Spin Again", icon: "fa-rotate-right", color: "#d4af37" }
];

const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const startBtn = document.getElementById('start-game');
const landingPage = document.getElementById('landing-page');
const gamePage = document.getElementById('game-page');
const resultOverlay = document.getElementById('result-overlay');
const winText = document.getElementById('win-text');
const resetBtn = document.getElementById('reset-btn');
const winTitle = document.getElementById('win-title');

// Audio Synthesis Setup
let audioCtx;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTick() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playWinSound() {
    if (!audioCtx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.1 + 0.5);
        osc.start(audioCtx.currentTime + i * 0.1);
        osc.stop(audioCtx.currentTime + i * 0.1 + 0.5);
    });
}

function getRotationDegrees(el) {
    const st = window.getComputedStyle(el, null);
    const tr = st.getPropertyValue("transform");
    if (tr === "none") return 0;
    const values = tr.split('(')[1].split(')')[0].split(',');
    const a = values[0];
    const b = values[1];
    let angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
    return (angle < 0) ? angle + 360 : angle;
}

let currentRotation = 0;
let isSpinning = false;


// Create Wheel Visuals
function initWheel() {
    const gradientParts = segments.map((s, i) => `${s.color} ${i * 45}deg ${(i + 1) * 45}deg`);
    wheel.style.background = `conic-gradient(${gradientParts.join(', ')})`;

    segments.forEach((segment, i) => {
        const label = document.createElement('div');
        label.className = 'segment-label';
        const angle = i * 45 + 22.5;
        label.style.transform = `rotate(${angle}deg)`;

        // With pointer at the right (90deg), a -90deg span rotation 
        // ensures content is upright when the segment stops at the pointer.
        label.innerHTML = `<span style="transform: rotate(-90deg)">
            <i class="fa-solid ${segment.icon}" style="font-size: 1.5rem;"></i>
            <small style="display: block; font-size: 0.8rem; margin-top: 5px;">${segment.text}</small>
        </span>`;
        wheel.appendChild(label);
    });
}

initWheel();

// Admin Logic - Weighted Selection with Limits
function getWinningIndex() {
    const today = new Date().toISOString().split('T')[0];
    const config = JSON.parse(localStorage.getItem(`config_${today}`)) || {};
    const stats = JSON.parse(localStorage.getItem(`stats_${today}`)) || {};

    let totalWeight = 0;
    const pool = [];

    segments.forEach((_, i) => {
        const conf = config[i] || { weight: 10, limit: null };
        const currentCount = stats[i] || 0;

        // Check if limit reached
        if (conf.limit !== null && currentCount >= conf.limit) {
            return; // Skip this segment
        }

        totalWeight += conf.weight;
        pool.push({ index: i, weight: conf.weight });
    });

    if (pool.length === 0) return Math.floor(Math.random() * 8); // Fallback

    let random = Math.random() * totalWeight;
    for (let item of pool) {
        if (random < item.weight) {
            // Log the win
            stats[item.index] = (stats[item.index] || 0) + 1;
            localStorage.setItem(`stats_${today}`, JSON.stringify(stats));
            return item.index;
        }
        random -= item.weight;
    }
    return pool[0].index;

}

// Time check logic
function isEventActive() {
    const today = new Date().toISOString().split('T')[0];
    const config = JSON.parse(localStorage.getItem(`config_${today}`)) || { timings: { start: 0, end: 24 } }; // Open 24h by default for engagement
    const currentHour = new Date().getHours();

    const start = config.timings?.start ?? 0;
    const end = config.timings?.end ?? 24;

    return currentHour >= start && currentHour <= end; // Modified for demo
}

// Page switching
startBtn.addEventListener('click', () => {
    initAudio();
    // Pre-check if event is active (optional but good for lead capture)
    if (!isEventActive()) {
        const today = new Date().toISOString().split('T')[0];
        const config = JSON.parse(localStorage.getItem(`config_${today}`)) || { timings: { start: 0, end: 24 } };
        alert(`Event is closed. Active hours: ${config.timings.start}:00 - ${config.timings.end}:00`);
        return;
    }
    landingPage.classList.remove('active');
    gamePage.classList.add('active');
});

// Spin logic
spinBtn.addEventListener('click', () => {
    if (isSpinning) return;

    const winningIndex = getWinningIndex();
    isSpinning = true;
    wheel.parentElement.classList.add('spinning');

    // Energetic Cracker Interval (canvas-confetti version)
    let lastTickAngle = 0;
    const crackerInterval = setInterval(() => {
        if (!isSpinning) {
            clearInterval(crackerInterval);
            return;
        }

        // Play tick sound when segment boundary is crossed
        const currentAngle = getRotationDegrees(wheel);
        if (Math.abs(currentAngle - lastTickAngle) >= 45) {
            playTick();
            lastTickAngle = currentAngle;
        }

        confetti({
            particleCount: 5,
            startVelocity: 30,
            spread: 360,
            origin: { x: Math.random(), y: Math.random() * 0.5 + 0.2 },
            colors: ['#ff9f43', '#feca57', '#d4af37']
        });
    }, 150);

    let targetDeg = (90 - (winningIndex * 45 + 22.5)) % 360;
    if (targetDeg < 0) targetDeg += 360;

    const currentBase = currentRotation - (currentRotation % 360);
    const extraSpins = 2520;
    currentRotation = currentBase + extraSpins + targetDeg;

    wheel.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
        isSpinning = false;
        wheel.parentElement.classList.remove('spinning');

        // Celebration Finale
        playWinSound();
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        const result = segments[winningIndex].text;

        if (result.includes('Better Luck')) {
            winTitle.innerHTML = 'Oh no! <i class="fa-solid fa-face-frown"></i>';
            winText.innerText = result;
            resetBtn.innerHTML = 'Try Again <i class="fa-solid fa-rotate-right"></i>';
        } else if (result.includes('Spin Again')) {
            winTitle.innerHTML = 'Wow! <i class="fa-solid fa-bolt"></i>';
            winText.innerText = "You get an extra spin!";
            resetBtn.innerHTML = 'Spin Now <i class="fa-solid fa-circle-play"></i>';
        } else {
            winTitle.innerHTML = 'GOAL! <i class="fa-solid fa-star"></i>';
            winText.innerText = `You won a ${result}!`;
            resetBtn.innerHTML = 'Claim Prize <i class="fa-solid fa-gift"></i>';
        }

        resultOverlay.classList.remove('hidden');
    }, 7000);
});

resetBtn.addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
    // Go back to landing if "Claim Prize" or "Try Again" (Better Luck)
    if (resetBtn.innerHTML.includes('Claim Prize') || resetBtn.innerHTML.includes('Try Again')) {
        landingPage.classList.add('active');
        gamePage.classList.remove('active');
    }
    // If "Spin Now", do nothing else (just hide overlay and allow spin)
});


