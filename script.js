const segments = [
    { text: "Cap", color: "#00529b" },
    { text: "Jersey", color: "#b8860b" },
    { text: "Football", color: "#0f1f38" },
    { text: "Better Luck", color: "#d4af37" },
    { text: "Cap", color: "#00529b" },
    { text: "Jersey", color: "#b8860b" },
    { text: "Football", color: "#0f1f38" },
    { text: "Spin Again", color: "#d4af37" }
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
        const angle = i * 45 + 22.5;
        label.style.transform = `rotate(${angle}deg)`;

        // With pointer at the right (90deg), a -90deg span rotation 
        // ensures text is upright when the segment stops at the pointer.
        label.innerHTML = `<span style="transform: rotate(-90deg)">${segment.text}</span>`;
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
    wheel.parentElement.classList.add('spinning');

    // Energetic Cracker Interval
    const crackerInterval = setInterval(() => {
        if (!isSpinning) {
            clearInterval(crackerInterval);
            return;
        }
        spawnSparks();
    }, 200);

    let targetDeg = (90 - (winningIndex * 45 + 22.5)) % 360;
    if (targetDeg < 0) targetDeg += 360;

    const currentBase = currentRotation - (currentRotation % 360);
    const extraSpins = 1800;
    currentRotation = currentBase + extraSpins + targetDeg;

    wheel.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
        isSpinning = false;
        wheel.parentElement.classList.remove('spinning');
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
    }, 5000);
});

resetBtn.addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
    if (resetBtn.innerHTML.includes('Claim Prize')) {
        // Go back to landing or simulate claim
        landingPage.classList.add('active');
        gamePage.classList.remove('active');
    }
});

function spawnSparks() {
    const container = document.body;
    const colors = ['#ff9f43', '#feca57', '#ff6b6b', '#fff'];
    
    const wheelWrapper = document.querySelector('.wheel-wrapper');
    const rect = wheelWrapper.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width / 2;
    
    for (let i = 0; i < 40; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 100 + Math.random() * 200;
        const x = Math.cos(angle) * velocity;
        const y = Math.sin(angle) * velocity;
        
        // Start position on the edge
        const startX = centerX + Math.cos(angle) * radius;
        const startY = centerY + Math.sin(angle) * radius;
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        spark.style.background = color;
        spark.style.boxShadow = `0 0 15px ${color}`;
        spark.style.left = startX + 'px';
        spark.style.top = startY + 'px';
        
        spark.style.setProperty('--x', `${x}px`);
        spark.style.setProperty('--y', `${y}px`);
        
        container.appendChild(spark);
        setTimeout(() => spark.remove(), 800);
    }
}
