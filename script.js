// ==========================================================
// 1. تعريف العناصر والثوابت
// ==========================================================
const gameContainer = document.querySelector('.game-container');
const bird = document.getElementById('bird');
const startScreen = document.getElementById('startScreen');
const scoreDisplay = document.getElementById('scoreDisplay'); 
const cloudsContainer = document.querySelector('.clouds-container'); 
const timerDisplay = document.getElementById('timerDisplay'); 

const initialInstructions = document.getElementById('initialInstructions');
const gameOverStats = document.getElementById('gameOverStats');
const finalScore = document.getElementById('finalScore');
const finalTime = document.getElementById('finalTime');
const heroBird = document.getElementById('heroBird'); 
const mainTitle = document.getElementById('mainTitle'); 

// --- تعريف الأصوات الجديدة ---
const jumpSound = new Audio('jump.mp3'); // تأكد من الامتداد (mp3 أو wav)
const scoreSound = new Audio('score.mp3');
const hitSound = new Audio('hit.mp3');
const backgroundMusic = new Audio('background.mp3');
backgroundMusic.loop = true; // جعل موسيقى الخلفية تتكرر
backgroundMusic.volume = 0.5; // خفض مستوى الصوت قليلاً
// -----------------------

const birdImages = ["bird_up.png", "bird_down.png"]; 
let birdImageIndex = 0; 
let animationTimerId; 

const evilBirdImages = ["evil_bird_up.png", "evil_bird_down.png"]; 
let evilBirdImageIndex = 0;
let evilBirds = []; 
let evilBirdSpawnTimer;
let evilBirdAnimateTimer;

const containerHeight = 700; 
const containerWidth = 500;
const birdDiameter = 40;     
let birdBottom = containerHeight / 2; 
const birdLeft = 50; 

let gravity = 2.5;      
let jumpStrength = 45;  
let pipeGap = 200;      
let pipeSpeed = 4;      
let spawnInterval = 3000; 
const pipeWidth = 60;   
let currentPipeClass = 'level-1'; 

let isGameOver = false;
let isGameStarted = false;
let gameTimerId; 
let score = 0;
let deathFallTimer; 
let pipeSpawnTimer; 

let startTime;
let timerInterval;
let highScore = localStorage.getItem('flappyHighScore') || 0;

// ==========================================================
// 2. منطق التحكم والوقت والتحريك
// ==========================================================

function updateTimer() {
    let now = Date.now();
    let diff = now - startTime;
    let mins = Math.floor(diff / 60000);
    let secs = Math.floor((diff % 60000) / 1000);
    timerDisplay.innerText = (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs);
}

function handleAction() {
    if (isGameOver && birdBottom > -birdDiameter) return;
    if (!isGameStarted) {
        resetGame(); 
    } else {
        jump();
    }
}

function resetGame() {
    isGameOver = false;
    isGameStarted = true;
    score = 0;
    birdBottom = containerHeight / 2;
    pipeSpeed = 4;
    spawnInterval = 3000;
    currentPipeClass = 'level-1';
    
    // تشغيل موسيقى الخلفية عند بدء اللعبة
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();

    startScreen.style.display = 'none';
    startScreen.style.pointerEvents = 'none';
    mainTitle.style.display = 'block'; 
    heroBird.src = "bird_up.png"; 
    heroBird.style.transform = "scale(1)"; 

    scoreDisplay.innerText = score;
    timerDisplay.innerText = "00:00"; 
    
    bird.style.display = 'block'; 
    bird.src = birdImages[0];
    bird.style.opacity = "1"; 
    bird.style.zIndex = "200"; 
    bird.style.transform = `rotate(0deg)`;
    bird.style.left = birdLeft + 'px';

    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000); 

    document.querySelectorAll('.pipe').forEach(pipe => pipe.remove());
    document.querySelectorAll('.evil-bird').forEach(eb => eb.remove());
    evilBirds = [];

    clearTimeout(pipeSpawnTimer);
    clearTimeout(evilBirdSpawnTimer);
    clearInterval(gameTimerId);
    clearInterval(animationTimerId);
    clearInterval(evilBirdAnimateTimer);
    
    animationTimerId = setInterval(animateBird, 100); 
    evilBirdAnimateTimer = setInterval(animateEvilBirds, 150); 
    
    startGameLoop(); 
    setTimeout(createPipes, 100); 
    setTimeout(spawnEvilBirdLoop, 2000); 
}

document.addEventListener('keydown', (e) => {
    if (e.code === "Space") handleAction();
});

gameContainer.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    handleAction();
}, { passive: false });

function animateBird() {
    birdImageIndex = (birdImageIndex + 1) % birdImages.length; 
    bird.src = birdImages[birdImageIndex];
}

function animateEvilBirds() {
    evilBirdImageIndex = (evilBirdImageIndex + 1) % evilBirdImages.length;
    evilBirds.forEach(eb => {
        eb.imgElement.src = evilBirdImages[evilBirdImageIndex];
    });
}

function drawBird() {
    bird.style.bottom = birdBottom + 'px';
    if (!isGameOver) {
        const rotationAngle = (birdBottom - containerHeight / 2) / 4; 
        bird.style.transform = `rotate(${rotationAngle}deg)`;
    }
}

function startGameLoop() {
    gameTimerId = setInterval(() => {
        if (isGameStarted && !isGameOver) { 
            birdBottom -= gravity; 
            drawBird();
            if (birdBottom <= 0) gameOver("سقطت!");
            if (birdBottom >= containerHeight - birdDiameter) gameOver("اصطدمت بالسقف!");
        }
    }, 20); 
}

function jump() {
    if (birdBottom < containerHeight - birdDiameter - 10) {
        birdBottom += jumpStrength; 
        // تشغيل صوت القفز
        jumpSound.currentTime = 0; 
        jumpSound.play();
    }
}

// ==========================================================
// 3. منطق الأنابيب
// ==========================================================

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function createPipes() {
    if (isGameOver || !isGameStarted) return; 

    let bottomPipeHeight = randomNumber(100, containerHeight - pipeGap - 100); 
    let topPipeHeight = containerHeight - bottomPipeHeight - pipeGap; 
    let pipeRight = -pipeWidth; 

    const topPipe = document.createElement('div');
    const bottomPipe = document.createElement('div');

    topPipe.classList.add('pipe', 'top-pipe', currentPipeClass);
    bottomPipe.classList.add('pipe', 'bottom-pipe', currentPipeClass);
    
    topPipe.style.height = topPipeHeight + 'px';
    bottomPipe.style.height = bottomPipeHeight + 'px';
    topPipe.style.top = 0; 
    bottomPipe.style.bottom = 0;
    topPipe.style.right = pipeRight + 'px'; 
    bottomPipe.style.right = pipeRight + 'px'; 
    
    gameContainer.appendChild(topPipe);
    gameContainer.appendChild(bottomPipe);

    let hasScored = false; 

    function movePipe() {
        if (isGameStarted && !isGameOver) {
            pipeRight += pipeSpeed; 
            topPipe.style.right = pipeRight + 'px'; 
            bottomPipe.style.right = pipeRight + 'px'; 

            const pipeLeft = containerWidth - pipeRight - pipeWidth; 

            if (pipeLeft < birdLeft && !hasScored) {
                score++;
                scoreDisplay.innerText = score;
                hasScored = true;
                
                // تشغيل صوت تسجيل النقطة
                scoreSound.currentTime = 0;
                scoreSound.play();

                if (score % 10 === 0 && score <= 50) {
                    pipeSpeed += 0.3; 
                    if (spawnInterval > 1500) spawnInterval -= 250; 
                    currentPipeClass = `level-${score / 10 + 1}`;
                }
            }

            if (pipeRight >= containerWidth + pipeWidth) { 
                clearInterval(pipeTimerId);
                topPipe.remove();
                bottomPipe.remove();
                return;
            }

            const birdRect = bird.getBoundingClientRect();
            const topPipeRect = topPipe.getBoundingClientRect();
            const bottomPipeRect = bottomPipe.getBoundingClientRect();

            if (birdRect.right > topPipeRect.left + 5 && birdRect.left < topPipeRect.right - 5 && 
               (birdRect.top < topPipeRect.bottom - 2 || birdRect.bottom > bottomPipeRect.top + 2)) {
                clearInterval(pipeTimerId);
                gameOver("ارتطام بالأنابيب!");
            }
        } else {
            clearInterval(pipeTimerId);
        }
    }
    let pipeTimerId = setInterval(movePipe, 20); 
    pipeSpawnTimer = setTimeout(createPipes, spawnInterval); 
}

// ==========================================================
// 4. منطق الطائر الشرير
// ==========================================================

function spawnEvilBirdLoop() {
    if (isGameOver || !isGameStarted) return;
    createEvilBird();
    evilBirdSpawnTimer = setTimeout(spawnEvilBirdLoop, randomNumber(4000, 7000));
}

function createEvilBird() {
    const ebImg = document.createElement('img');
    ebImg.src = evilBirdImages[0];
    ebImg.classList.add('evil-bird');
    
    let ebBottom = randomNumber(100, containerHeight - 100);
    let ebRight = -60; 
    let ebSpeed = pipeSpeed + 1; 

    ebImg.style.bottom = ebBottom + 'px';
    ebImg.style.right = ebRight + 'px';
    ebImg.style.zIndex = "5"; 
    gameContainer.appendChild(ebImg);

    const ebObj = { imgElement: ebImg, moveTimer: null };
    evilBirds.push(ebObj);

    ebObj.moveTimer = setInterval(() => {
        if (isGameStarted && !isGameOver) {
            ebRight += ebSpeed;
            ebImg.style.right = ebRight + 'px';

            const birdRect = bird.getBoundingClientRect();
            const ebRect = ebImg.getBoundingClientRect();

            if (birdRect.right > ebRect.left + 5 && birdRect.left < ebRect.right - 5 && 
                birdRect.top < ebRect.bottom - 5 && birdRect.bottom > ebRect.top + 5) {
                gameOver("قتلك الطائر الشرير!");
            }

            if (ebRight > containerWidth + 100) {
                clearInterval(ebObj.moveTimer);
                ebImg.remove();
                evilBirds = evilBirds.filter(item => item !== ebObj);
            }
        } else {
            clearInterval(ebObj.moveTimer);
        }
    }, 20);
}

// ==========================================================
// 5. نظام السحاب والنهاية
// ==========================================================

function createCloud() {
    if (document.querySelectorAll('.cloud').length >= 4) return;
    const cloud = document.createElement('img');
    const cloudImages = ["cloud1.png", "cloud2.png", "cloud3.png", "cloud4.png"];
    cloud.src = cloudImages[Math.floor(Math.random() * cloudImages.length)];
    cloud.classList.add('cloud');
    let cloudSpeed = 0.6; 
    let cloudRight = -250; 
    const lanes = [400, 520, 620];
    let cloudBottom = lanes[Math.floor(Math.random() * lanes.length)] + randomNumber(-15, 15);
    cloud.style.width = randomNumber(130, 180) + 'px';
    cloud.style.bottom = cloudBottom + 'px';
    cloud.style.right = cloudRight + 'px';
    cloud.style.opacity = randomNumber(5, 8) / 10;
    cloudsContainer.appendChild(cloud);
    let cloudTimer = setInterval(() => {
        cloudRight += cloudSpeed;
        cloud.style.right = cloudRight + 'px';
        if (cloudRight > containerWidth + 300) {
            clearInterval(cloudTimer);
            cloud.remove();
        }
    }, 20);
}
setInterval(createCloud, 10000);

function deathFall() {
    clearInterval(deathFallTimer);
    deathFallTimer = setInterval(() => {
        birdBottom -= gravity * 4; 
        bird.style.bottom = birdBottom + 'px';
        if (birdBottom <= -birdDiameter) {
            clearInterval(deathFallTimer);
            startScreen.style.display = 'flex'; 
            startScreen.style.pointerEvents = 'all';
            bird.style.display = 'none'; 
        }
    }, 20);
}

function gameOver(reason) {
    if (isGameOver) return;
    isGameOver = true;
    isGameStarted = false;

    // إيقاف موسيقى الخلفية وتشغيل صوت الاصطدام
    backgroundMusic.pause();
    hitSound.currentTime = 0;
    hitSound.play();

    clearInterval(timerInterval); 
    clearInterval(gameTimerId); 
    clearInterval(animationTimerId); 
    clearInterval(evilBirdAnimateTimer);
    clearTimeout(pipeSpawnTimer);
    clearTimeout(evilBirdSpawnTimer);

    evilBirds.forEach(eb => {
        if (eb.moveTimer) clearInterval(eb.moveTimer);
    });

    bird.src = "bird_dead.png"; 
    bird.style.transform = `rotate(90deg)`; 
    heroBird.src = "bird_dead.png"; 
    heroBird.style.transform = "scale(1.5) rotate(90deg)"; 

    if(initialInstructions) initialInstructions.style.display = 'none';
    if(gameOverStats) gameOverStats.style.display = 'block';
    
    finalScore.innerText = score;
    finalTime.innerText = timerDisplay.innerText;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyHighScore', highScore);
    }
    
    deathFall(); 
}

drawBird();
bird.style.display = 'none'; 
setTimeout(createCloud, 1000);
