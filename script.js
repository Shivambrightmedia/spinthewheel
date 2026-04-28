const segments = [
    { text: "🧢 Cap", color: "#e84118" },
    { text: "👕 Jersey", color: "#00a8ff" },
    { text: "⚽ Football", color: "#4cd137" },
    { text: "❌ Better Luck", color: "#7f8fa6" },
    { text: "🧢 Cap", color: "#e84118" },
    { text: "👕 Jersey", color: "#00a8ff" },
    { text: "⚽ Football", color: "#4cd137" },
    { text: "🔄 Spin Again", color: "#fbc531" }
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

let currentRotation = 0;
let isSpinning = false;


// Create Wheel Visuals
function initWheel() {
    const gradientParts = segments.map((s, i) => `${s.color} ${i * 45}deg ${(i + 1) * 45}deg`);
    wheel.style.background = `conic-gradient(${gradientParts.join(', ')})`;

    segments.forEach((segment, i) => {
        const label = document.createElement('div');
        label.className = 'segment-label';
        label.style.transform = `rotate(${i * 45 + 22.5}deg)`;
        label.innerHTML = `<span>${segment.text}</span>`;
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

    // We want Segment [winningIndex] to end up at the pointer (90deg)
    // Formula: (90 - actualDeg) % 360 = winningIndex * 45 + 22.5 (center of segment)
    // actualDeg = (90 - (winningIndex * 45 + 22.5)) % 360

    let targetDeg = (90 - (winningIndex * 45 + 22.5)) % 360;
    if (targetDeg < 0) targetDeg += 360;

    // Total rotation = current + multiple spins + offset to target
    const currentBase = currentRotation - (currentRotation % 360);
    const extraSpins = 1800; // 5 full spins for more excitement
    currentRotation = currentBase + extraSpins + targetDeg;

    wheel.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
        isSpinning = false;
        const result = segments[winningIndex].text;
        
        if (result.includes('Better Luck')) {
            winTitle.innerText = "Oh no! 😢";
            winText.innerText = result;
            resetBtn.innerText = "Try Again 🔄";
        } else if (result.includes('Spin Again')) {
            winTitle.innerText = "Wow! 🤩";
            winText.innerText = "You get an extra spin!";
            resetBtn.innerText = "Spin Now 🎯";
        } else {
            winTitle.innerText = "GOAL! 🎉";
            winText.innerText = `You won a ${result}!`;
            resetBtn.innerText = "Claim Prize 🎁";
        }

        resultOverlay.classList.remove('hidden');
    }, 5000);
});

resetBtn.addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
    if (resetBtn.innerText.includes('Claim Prize')) {
        // Go back to landing or simulate claim
        landingPage.classList.add('active');
        gamePage.classList.remove('active');
    }
});
