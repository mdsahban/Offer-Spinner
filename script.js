const offers = [
  "T-Shirt",
  "Shirt",
  "Socks",
  "100₹ off",
  "10% off",
  "Surprise gift"
];

const colors = [
  '#c05be4', // Free shipping (pink/purple)
  '#ffe066', // Buy 1 get 1 (yellow)
  '#7f7fd5', // 5% cashback (purple)
  '#ff9800', // Mystery gift (orange)
  '#a3d55c', // 20% off (green)
  '#3ec6c6'  // 10% off (teal)
];

const rewards = [
  "T-Shirt",
  "Shirt",
  "Socks",
  "100₹ off",
  "Extra 10% off",
  "Surprise gift (Kamal)"
];

const svg = document.getElementById('spinner-svg');
const spinBtn = document.getElementById('spin-btn');
const resultDiv = document.getElementById('result') || document.getElementById('spin2win-result');
const resultModal = document.getElementById('result-modal');
const closeModalBtn = document.getElementById('close-modal');
const expiredModal = document.getElementById('expired-modal');

const segCount = offers.length;
const segAngle = 360 / segCount;
// Increase spinner size
const center = 200;
const radius = 190;
svg.setAttribute('width', '400');
svg.setAttribute('height', '400');
svg.setAttribute('viewBox', '0 0 400 400');

function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', cx, cy,
    'L', start.x, start.y,
    'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
    'Z'
  ].join(' ');
}

// Ensure all offers are split into two lines if they contain two words and are not already multi-line
const formattedOffers = offers.map(o => o.includes('\n') ? o : o.split(' ').length === 2 ? o.replace(' ', '\n') : o);

function drawWheelSVG() {
  svg.innerHTML = '';
  for (let i = 0; i < segCount; i++) {
    const startAngle = i * segAngle;
    const endAngle = (i + 1) * segAngle;
    // Draw segment
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', describeArc(center, center, radius, startAngle, endAngle));
    path.setAttribute('fill', colors[i % colors.length]);
    path.setAttribute('stroke', 'none');
    // path.setAttribute('stroke-width', '8'); // Remove border
    svg.appendChild(path);
    // Add text (upright, centered)
    const textAngle = startAngle + segAngle / 2;
    const textRadius = radius * 0.68;
    const textPos = polarToCartesian(center, center, textRadius, textAngle);
    const lines = formattedOffers[i].toUpperCase().split('\n');
    const fontSize = 24;
    const lineHeight = fontSize * 1.1;
    for (let j = 0; j < lines.length; j++) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', textPos.x);
      text.setAttribute('y', textPos.y + (j - (lines.length-1)/2) * lineHeight + 8);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('alignment-baseline', 'middle');
      text.setAttribute('font-size', fontSize);
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('fill', '#232c4b');
      text.setAttribute('letter-spacing', '1px');
      text.setAttribute('style', 'pointer-events:none;');
      // Always keep text upright
      text.setAttribute('transform', `rotate(${textAngle > 180 ? textAngle - 360 : textAngle} ${textPos.x} ${textPos.y})`);
      text.textContent = lines[j];
      svg.appendChild(text);
    }
  }
}

drawWheelSVG();

let spinning = false;
let currentRotation = 0;

// --- Firebase and Mobile Number Spin Limit Logic ---
// Firebase config (placeholder keys)
var firebaseConfig = {
  apiKey: "AIzaSyAOIpAW9Yn19-2yx8z5cWko-CdChDSTX48",
  authDomain: "offer-spin.firebaseapp.com",
  databaseURL: "https://offer-spin-default-rtdb.firebaseio.com",
  projectId: "offer-spin",
  storageBucket: "offer-spin.firebasestorage.app",
  messagingSenderId: "621973095532",
  appId: "1:621973095532:web:f7d6b81c188fb140310449",
  measurementId: "G-XS2ZCNH7BF"
};
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
var db = typeof firebase !== 'undefined' ? firebase.database() : null;

// --- User Info Modal Logic ---
let userName = '';
let userMobile = '';
let userSpinCount = 0;

function validateMobile(mobile) {
  return /^[0-9]{10,15}$/.test(mobile);
}
function validateName(name) {
  return /^[A-Za-z\s]{2,30}$/.test(name.trim());
}

const userInfoModal = document.getElementById('user-info-modal');
const userInfoForm = document.getElementById('user-info-form');
const nameInput = document.getElementById('name-input');
const mobileInput = document.getElementById('mobile-input');
const userInfoMsg = document.getElementById('user-info-msg');

function setSpinUI(enabled, msg) {
  spinBtn.disabled = !enabled;
  if (!enabled) {
    spinBtn.style.opacity = 0.6;
    spinBtn.style.cursor = 'not-allowed';
  } else {
    spinBtn.style.opacity = 1;
    spinBtn.style.cursor = 'pointer';
  }
  if (msg) {
    userInfoMsg.textContent = msg;
    userInfoMsg.style.color = '#e4405f';
  } else {
    userInfoMsg.textContent = '';
  }
}

function checkSpinCountAndUpdateUI(mobile) {
  if (!db) return;
  db.ref('spins/' + mobile).once('value').then(function(snapshot) {
    userSpinCount = snapshot.val() || 0;
    if (userSpinCount >= 5) {
      setSpinUI(false, 'Offer Expired or Limit Reached');
    } else {
      setSpinUI(true, '');
    }
  });
}

window.addEventListener('DOMContentLoaded', function() {
  if (userInfoModal) {
    userInfoModal.style.display = 'flex';
    spinBtn.disabled = true;
    spinBtn.style.opacity = 0.6;
    spinBtn.style.cursor = 'not-allowed';
  }
});

if (userInfoForm) {
  userInfoForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const nameVal = nameInput.value.trim();
    const mobileVal = mobileInput.value.trim();
    if (!validateName(nameVal)) {
      setSpinUI(false, 'Enter a valid name (letters/spaces, 2-30 chars)');
      return;
    }
    if (!validateMobile(mobileVal)) {
      setSpinUI(false, 'Enter valid mobile number (10-15 digits)');
      return;
    }
    userName = nameVal;
    userMobile = mobileVal;
    // Check total spins before closing modal
    if (db) {
      db.ref('spins').once('value').then(function(snapshot) {
        const totalEntries = snapshot.numChildren();
        if (totalEntries >= 5) {
          setSpinUI(false, '');
          userInfoModal.style.display = 'none';
          if (expiredModal) expiredModal.style.display = 'flex';
          return;
        }
        // Now check if this number has already spun
        db.ref('spins/' + userMobile).once('value').then(function(snapshot2) {
          userSpinCount = snapshot2.val() || 0;
          if (userSpinCount >= 1) {
            setSpinUI(false, '');
            userInfoModal.style.display = 'none';
            if (expiredModal) expiredModal.style.display = 'flex';
          } else {
            setSpinUI(true, '');
            userInfoModal.style.display = 'none';
          }
        });
      });
    } else {
      userInfoModal.style.display = 'none';
    }
  });
}

// Intercept spin button click
spinBtn.addEventListener('click', function(e) {
  if (!userName || !validateName(userName)) {
    setSpinUI(false, 'Enter a valid name (letters/spaces, 2-30 chars)');
    userInfoModal.style.display = 'flex';
    return;
  }
  if (!userMobile || !validateMobile(userMobile)) {
    setSpinUI(false, 'Enter valid mobile number (10-15 digits)');
    userInfoModal.style.display = 'flex';
    return;
  }
  if (userSpinCount >= 1) {
    setSpinUI(false, '');
    userInfoModal.style.display = 'none';
    if (expiredModal) expiredModal.style.display = 'flex';
    return;
  }
  // Check again from DB to prevent race condition
  if (db) {
    db.ref('spins').once('value').then(function(snapshot) {
      const totalEntries = snapshot.numChildren();
      if (totalEntries >= 5) {
        setSpinUI(false, '');
        userInfoModal.style.display = 'none';
        if (expiredModal) expiredModal.style.display = 'flex';
        return;
      }
      db.ref('spins/' + userMobile).once('value').then(function(snapshot2) {
        let spins = snapshot2.val() || 0;
        if (spins >= 1) {
          setSpinUI(false, '');
          userInfoModal.style.display = 'none';
          if (expiredModal) expiredModal.style.display = 'flex';
          return;
        }
        // --- Call the original spin function here after validation ---
        // (The rest of the spin logic will proceed)
        // Set spin count to 1 in Firebase (only one spin allowed)
        db.ref('spins/' + userMobile).set(1);
        userSpinCount = 1;
        // Allow the original spin logic to run
        proceedWithSpin();
        // Disable spin button after spin
        setSpinUI(false, 'Offer Expired or Limit Reached');
      });
    });
    e.preventDefault();
  }
});

// Wrap the original spin logic in a function
function proceedWithSpin() {
  // --- ORIGINAL SPIN LOGIC BELOW (copied from previous spinBtn click handler) ---
  if (spinning) return;
  spinning = true;
  resultDiv.textContent = '';
  resultDiv.classList.remove('scale-animate');
  if (resultModal) resultModal.style.display = 'none';
  const selected = Math.floor(Math.random() * segCount);
  const extraSpins = 5;
  const finalDeg = 360 * extraSpins + (360 - selected * segAngle - segAngle / 2);
  svg.style.transition = 'transform 3s cubic-bezier(.17,.67,.83,.67)';
  svg.style.transform = `rotate(${finalDeg}deg)`;
  setTimeout(() => {
    spinning = false;
    currentRotation = finalDeg % 360;
    svg.style.transition = 'none';
    svg.style.transform = `rotate(${currentRotation}deg)`;
    resultDiv.innerHTML = `<div style='font-size:1.2rem;color:#222;margin-bottom:0.5rem;'>You won:</div><div style='font-size:2.3rem;font-weight:900;'>${offers[selected].replace(/\n/g, ' ')}</div>`;
    resultDiv.classList.add('scale-animate');
    setTimeout(() => resultDiv.classList.remove('scale-animate'), 1200);
    setTimeout(() => {
      if (resultModal) {
        showCongratulationsAnimation();
        showConfetti();
        resultModal.style.display = 'flex';
      }
    }, 600);
  }, 3000);
}

function showCongratulationsAnimation() {
  const resultContent = document.getElementById('result');
  if (!resultContent) return;
  // Remove previous animation if any
  const prev = document.getElementById('congrats-anim');
  if (prev) prev.remove();
  // Create animation container
  const animDiv = document.createElement('div');
  animDiv.id = 'congrats-anim';
  animDiv.style.position = 'relative';
  animDiv.style.width = '100%';
  animDiv.style.height = '120px';
  animDiv.innerHTML = `<div class='congrats-animation'>Congratulations!</div>`;
  // Add balloons that rise and burst in the middle of the popup
  createBalloons(animDiv, true);
  resultContent.prepend(animDiv);
}

function createBalloons(container) {
  const balloonColors = ['#ffb300', '#ff5e57', '#7f7fd5', '#a3d55c', '#3ec6c6', '#ff9800', '#c05be4'];
  const total = 7;
  let i = 0;
  function launchPair() {
    for (let j = 0; j < 2 && i < total; j++, i++) {
      const balloon = document.createElement('div');
      balloon.className = 'balloon';
      balloon.style.left = (20 + j * 40 + (i % 2) * 10) + '%'; // 2 balloons spaced apart
      balloon.style.setProperty('--balloon-color', balloonColors[i % balloonColors.length]);
      balloon.style.position = 'absolute';
      balloon.style.bottom = '-120px';
      balloon.style.animation = `balloon-rise-popup 2s cubic-bezier(.36,1.56,.64,1) forwards`;
      balloon.style.animationDelay = '0s';
      container.appendChild(balloon);
      setTimeout(() => {
        balloon.classList.add('burst');
        setTimeout(() => balloon.remove(), 400);
      }, 2000);
    }
    if (i < total) {
      setTimeout(launchPair, 400); // Launch next pair after 0.4s
    }
  }
  launchPair();
}

function showConfetti() {
  const overlay = document.getElementById('confetti-overlay');
  if (!overlay) return;
  overlay.innerHTML = '';
  for (let i = 0; i < 80; i++) {
    const conf = document.createElement('div');
    conf.className = 'confetti-piece';
    conf.style.left = Math.random() * 100 + 'vw';
    conf.style.top = (Math.random() * 10 - 10) + 'vh';
    conf.style.background = ['#ff5e57', '#ffe066', '#3ec6c6', '#7f7fd5', '#232c4b'][i % 5];
    conf.style.animationDelay = (Math.random() * 0.7) + 's';
    conf.style.transform = `rotate(${Math.random() * 360}deg)`;
    overlay.appendChild(conf);
  }
}

function clearConfetti() {
  const overlay = document.getElementById('confetti-overlay');
  if (overlay) overlay.innerHTML = '';
}

// Remove modal close logic for result modal

// Style for wheel segments
const style = document.createElement('style');
style.textContent = `
.spinner-wheel { position: relative; }
.wheel-segment {
  position: absolute;
  width: 50%;
  height: 50%;
  left: 50%;
  top: 50%;
  transform-origin: 0% 0%;
  border-radius: 100% 0 0 0 / 100% 0 0 0;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
}
.wheel-segment span {
  display: block;
  padding: 1.2rem 0.5rem 0.5rem 1.2rem;
  color: #222;
  font-weight: bold;
  font-size: 1.1rem;
  text-shadow: 0 1px 2px #fff8;
}
.flash {
  animation: flash 1.2s;
}
`;
document.head.appendChild(style); 