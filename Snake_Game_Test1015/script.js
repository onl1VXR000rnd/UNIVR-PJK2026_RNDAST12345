// ===== Snake Game - Klasik Nokia Edition =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const finalScoreEl = document.getElementById('finalScore');
const gameOverEl = document.getElementById('gameOver');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');

const GRID = 20;               // ukuran satu sel
const COLS = canvas.width / GRID;
const ROWS = canvas.height / GRID;

let snake, direction, nextDirection, food, score, highScore, speed, gameLoop, running, paused;

highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
highScoreEl.textContent = highScore;

function init() {
  snake = [
    { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) },
    { x: Math.floor(COLS / 2) - 1, y: Math.floor(ROWS / 2) },
    { x: Math.floor(COLS / 2) - 2, y: Math.floor(ROWS / 2) },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  speed = 140;
  running = false;
  paused = false;
  scoreEl.textContent = score;
  placeFood();
  draw();
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some((s) => s.x === food.x && s.y === food.y));
}

function update() {
  direction = nextDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  // Tabrak dinding (gaya Nokia klasik: mati, bukan tembus)
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    return endGame();
  }
  // Tabrak badan sendiri
  if (snake.some((s) => s.x === head.x && s.y === head.y)) {
    return endGame();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    placeFood();
    // Speed up bertahap
    if (speed > 60) {
      speed -= 3;
      clearInterval(gameLoop);
      gameLoop = setInterval(update, speed);
    }
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  // Latar
  ctx.fillStyle = '#0b0c10';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid halus ala layar Nokia
  ctx.strokeStyle = 'rgba(78, 204, 163, 0.06)';
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * GRID, 0);
    ctx.lineTo(i * GRID, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * GRID);
    ctx.lineTo(canvas.width, i * GRID);
    ctx.stroke();
  }

  // Makanan
  ctx.fillStyle = '#e94560';
  ctx.beginPath();
  ctx.arc(
    food.x * GRID + GRID / 2,
    food.y * GRID + GRID / 2,
    GRID / 2 - 3,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Ular
  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? '#4ecca3' : '#3a9d7f';
    ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2);
  });

  // Mata di kepala
  ctx.fillStyle = '#0b0c10';
  const h = snake[0];
  ctx.fillRect(h.x * GRID + 5, h.y * GRID + 5, 3, 3);
  ctx.fillRect(h.x * GRID + 12, h.y * GRID + 12, 3, 3);
}

function start() {
  if (running) return;
  running = true;
  paused = false;
  gameOverEl.classList.add('hidden');
  clearInterval(gameLoop);
  gameLoop = setInterval(update, speed);
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  if (paused) {
    clearInterval(gameLoop);
    pauseBtn.textContent = '▶ Lanjut';
  } else {
    gameLoop = setInterval(update, speed);
    pauseBtn.textContent = '⏸ Jeda';
  }
}

function endGame() {
  clearInterval(gameLoop);
  running = false;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('snakeHighScore', highScore);
    highScoreEl.textContent = highScore;
  }
  finalScoreEl.textContent = score;
  gameOverEl.classList.remove('hidden');
}

function setDirection(dir) {
  const map = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
  };
  const d = map[dir];
  if (!d) return;
  // Tidak boleh balik arah 180 derajat
  if (d.x === -direction.x && d.y === -direction.y) return;
  nextDirection = d;
  if (!running && !paused) start();
}

// Keyboard
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp': case 'w': case 'W': setDirection('UP'); break;
    case 'ArrowDown': case 's': case 'S': setDirection('DOWN'); break;
    case 'ArrowLeft': case 'a': case 'A': setDirection('LEFT'); break;
    case 'ArrowRight': case 'd': case 'D': setDirection('RIGHT'); break;
    case ' ': e.preventDefault(); if (running) togglePause(); else start(); break;
  }
});

// Tombol on-screen
document.querySelectorAll('.mobile-controls button').forEach((btn) => {
  btn.addEventListener('click', () => setDirection(btn.dataset.dir));
});

startBtn.addEventListener('click', start);
pauseBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', () => {
  init();
  start();
});

// Jalankan pertama kali
init();
