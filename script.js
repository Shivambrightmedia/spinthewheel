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

// Create segments
segments.forEach((segment, i) => {
    const el = document.createElement('div');
    el.className = 'segment';
    el.style.backgroundColor = segment.color;
    el.style.transform = `rotate(${i * 45}deg) skewY(-45deg)`;
    
    const content = document.createElement('span');
    content.innerText = segment.text;
    content.style.transform = `skewY(45deg) rotate(22.5deg)`;
    
    el.appendChild(content);
    wheel.appendChild(el);
});

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
    
    // Calculate result
    // Pointer is at the right (0 deg or 360 deg relative to screen)
    // The wheel rotates clockwise.
    // We need to find which segment is at the pointer position (right side).
    // The rotation is currentRotation. 
    // The pointer is at 0 degrees (on the right).
    // Final rotation mod 360 gives relative rotation.
    // But since the wheel rotates clockwise, the segments move "past" the pointer.
    
    setTimeout(() => {
        isSpinning = false;
        const actualDeg = currentRotation % 360;
        
        // Pointer is at 0deg (right).
        // If actualDeg is 0, segment 0 (top-left) has rotated 0.
        // Wait, the segment layout needs to be accounted for.
        // Segment 0 starts at 0deg (top-right relative to center).
        // Since it is skewY(-45), it covers 0 to 45 deg.
        // Wait, skew logic is tricky. Let's simplify:
        // Pointer is at 0 degrees (3 o'clock).
        // Rotation is clockwise.
        // Winning index = floor((360 - (actualDeg % 360)) / 45)
        
        const winningIndex = Math.floor(((360 - (actualDeg % 360)) % 360) / 45);
        const result = segments[winningIndex].text;
        
        winText.innerText = `You won: ${result}`;
        resultOverlay.classList.remove('hidden');
    }, 5000); // Match CSS transition
});

resetBtn.addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
});
