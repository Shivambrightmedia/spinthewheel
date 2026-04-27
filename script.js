const segments = [
    { text: "Extra 5% Off", color: "#ff3d81" },
    { text: "Free Lab Test", color: "#4834d4" },
    { text: "Free Gift", color: "#f7d794" },
    { text: "Free e-Consult", color: "#eb4d4b" },
    { text: "Free Gift", color: "#f0932b" },
    { text: "100% Cashback", color: "#f9ca24" },
    { text: "Free Lab Test", color: "#6ab04c" },
    { text: "Free Gift", color: "#e056fd" }
];

const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const startBtn = document.getElementById('start-game');
const landingPage = document.getElementById('landing-page');
const gamePage = document.getElementById('game-page');
const resultOverlay = document.getElementById('result-overlay');
const winText = document.getElementById('win-text');
const resetBtn = document.getElementById('reset-btn');

let currentRotation = 0;
let isSpinning = false;

// Create Wheel Visuals
function initWheel() {
    // 1. Create conic gradient background
    const gradientParts = segments.map((s, i) => `${s.color} ${i * 45}deg ${(i + 1) * 45}deg`);
    wheel.style.background = `conic-gradient(${gradientParts.join(', ')})`;

    // 2. Add labels
    segments.forEach((segment, i) => {
        const label = document.createElement('div');
        label.className = 'segment-label';
        // Rotate labels to center of segment (i*45 + 22.5)
        label.style.transform = `rotate(${i * 45 + 22.5}deg)`;
        label.innerHTML = `<span>${segment.text}</span>`;
        wheel.appendChild(label);
    });
}

initWheel();

// Page switching
startBtn.addEventListener('click', () => {
    landingPage.classList.remove('active');
    gamePage.classList.add('active');
});

// Spin logic
spinBtn.addEventListener('click', () => {
    if (isSpinning) return;
    
    isSpinning = true;
    const extraDegrees = Math.floor(Math.random() * 360) + 1440; // At least 4 full spins
    currentRotation += extraDegrees;
    
    wheel.style.transform = `rotate(${currentRotation}deg)`;
    
    setTimeout(() => {
        isSpinning = false;
        
        // Pointer is at 90deg (3 o'clock position)
        // Wheel starts with Segment 0 at 0-45deg (12 o'clock area)
        // Final rotation is currentRotation
        // The degree currently at the pointer (90deg) was originally at:
        // (90 - currentRotation) % 360
        
        const actualDeg = currentRotation % 360;
        const pointerDeg = 90;
        let relativeDeg = (pointerDeg - actualDeg) % 360;
        if (relativeDeg < 0) relativeDeg += 360;
        
        const winningIndex = Math.floor(relativeDeg / 45);
        const result = segments[winningIndex].text;
        
        winText.innerText = `You won: ${result}`;
        resultOverlay.classList.remove('hidden');
    }, 5000); 
});

resetBtn.addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
});
