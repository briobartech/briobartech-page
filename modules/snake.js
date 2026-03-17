export function initSnake() {
  const canvas = document.getElementById('snakeCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  // Game variables
  const gridSize = 20;
  const tileCount = canvas.width / gridSize;
  let snake = [{ x: 10, y: 10 }];
  let food = { x: 15, y: 15 };
  let powerUp = null;
  let powerUpTimer = 0;
  let dx = 1;
  let dy = 0;
  let nextDx = 1;
  let nextDy = 0;
  let score = 0;
  let gameRunning = false;
  let paused = false;
  let gameSpeed = 100; // milliseconds
  let baseSpeed = 100;
  let difficulty = 'easy'; // 'easy' or 'normal'

  // Power-up effect timers
  let speedBoostActive = false;
  let slowMotionActive = false;
  let invertControlsActive = false;
  let speedBoostTimer = 0;
  let slowMotionTimer = 0;
  let invertControlsTimer = 0;

  const scoreDisplay = document.getElementById('snakeScore');
  const gameOverMessage = document.getElementById('snakeGameOver');
  const difficultyBtn = document.getElementById('snakeDifficultyBtn');
  const startMenu = document.getElementById('snakeStartMenu');
  const startEasyBtn = document.getElementById('snakeStartEasyBtn');
  const startNormalBtn = document.getElementById('snakeStartNormalBtn');
  const startPlayBtn = document.getElementById('snakeStartPlayBtn');

  function applyDifficulty(value) {
    difficulty = value === 'normal' ? 'normal' : 'easy';
    difficultyBtn.textContent = difficulty === 'easy' ? 'Facil' : 'Normal';
    difficultyBtn.dataset.difficulty = difficulty;

    if (startEasyBtn) {
      startEasyBtn.style.background = difficulty === 'easy' ? '#9BBC0F' : '#c0c0c0';
      startEasyBtn.style.color = difficulty === 'easy' ? '#0F380F' : '#111';
    }
    if (startNormalBtn) {
      startNormalBtn.style.background = difficulty === 'normal' ? '#9BBC0F' : '#c0c0c0';
      startNormalBtn.style.color = difficulty === 'normal' ? '#0F380F' : '#111';
    }
  }

  function resetGameState() {
    snake = [{ x: 10, y: 10 }];
    food = { x: 15, y: 15 };
    powerUp = null;
    powerUpTimer = 0;
    dx = 1;
    dy = 0;
    nextDx = 1;
    nextDy = 0;
    score = 0;
    gameSpeed = baseSpeed;
    speedBoostActive = false;
    slowMotionActive = false;
    invertControlsActive = false;
    speedBoostTimer = 0;
    slowMotionTimer = 0;
    invertControlsTimer = 0;
    scoreDisplay.textContent = `Score: 0`;
    gameOverMessage.style.display = 'none';
  }

  function startGame() {
    resetGameState();
    gameRunning = true;
    paused = false;
    if (startMenu) startMenu.style.display = 'none';
  }

  applyDifficulty('easy');
  if (startMenu) startMenu.style.display = 'flex';

  if (startEasyBtn) {
    startEasyBtn.onclick = () => applyDifficulty('easy');
  }
  if (startNormalBtn) {
    startNormalBtn.onclick = () => applyDifficulty('normal');
  }
  if (startPlayBtn) {
    startPlayBtn.onclick = () => startGame();
  }

  // Power-up types: speed (yellow), slow (blue), invert (purple)
  const powerUpTypes = {
    speed: { color: '#FFFF00', effect: 'Velocidad x1.5 por 5s' },
    slow: { color: '#0000FF', effect: 'Cámara lenta por 5s' },
    invert: { color: '#FF00FF', effect: 'Controles invertidos por 5s' }
  };

  // Difficulty button handler
  difficultyBtn.addEventListener('click', (e) => {
    if (!gameRunning) {
      applyDifficulty(difficulty === 'easy' ? 'normal' : 'easy');
    }
  });

  function setPaused(nextPaused) {
    paused = nextPaused;
    if (paused) {
      gameOverMessage.style.display = 'block';
      gameOverMessage.textContent = 'PAUSED\nPress P to resume';
    } else if (gameOverMessage.textContent.startsWith('PAUSED')) {
      gameOverMessage.style.display = 'none';
    }
  }

  // Key handlers
  function handleKeyDown(e) {
    let key = e.key.toLowerCase();

    if (key === 'p' && gameRunning) {
      setPaused(!paused);
      e.preventDefault();
      return;
    }

    if (!gameRunning || paused) return;

    // Invert controls if active
    const controlMap = {
      'arrowup': 'w',
      'w': 'arrowup',
      'arrowdown': 's',
      's': 'arrowdown',
      'arrowleft': 'a',
      'a': 'arrowleft',
      'arrowright': 'd',
      'd': 'arrowright'
    };

    if (invertControlsActive && controlMap[key]) {
      key = controlMap[key];
    }

    // Arrow keys or WASD
    if (key === 'arrowup' || key === 'w') {
      if (dy === 0) { nextDx = 0; nextDy = -1; }
      e.preventDefault();
    } else if (key === 'arrowdown' || key === 's') {
      if (dy === 0) { nextDx = 0; nextDy = 1; }
      e.preventDefault();
    } else if (key === 'arrowleft' || key === 'a') {
      if (dx === 0) { nextDx = -1; nextDy = 0; }
      e.preventDefault();
    } else if (key === 'arrowright' || key === 'd') {
      if (dx === 0) { nextDx = 1; nextDy = 0; }
      e.preventDefault();
    }
  }

  function generatePowerUp() {
    // Randomly spawn power-ups (10% chance)
    if (Math.random() > 0.1) return;

    const types = Object.keys(powerUpTypes);
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    let x, y, onSnake;
    do {
      x = Math.floor(Math.random() * tileCount);
      y = Math.floor(Math.random() * tileCount);
      onSnake = false;
      
      for (let segment of snake) {
        if (segment.x === x && segment.y === y) {
          onSnake = true;
          break;
        }
      }
    } while (x === food.x && y === food.y && onSnake);

    powerUp = { x, y, type: randomType };
    powerUpTimer = 5000; // 5 seconds to consume the power-up
  }

  function applyPowerUp(type) {
    const duration = 5000; // 5 seconds

    if (type === 'speed') {
      speedBoostActive = true;
      speedBoostTimer = duration;
      gameSpeed = baseSpeed / 1.5;
    } else if (type === 'slow') {
      slowMotionActive = true;
      slowMotionTimer = duration;
      gameSpeed = baseSpeed * 1.5;
    } else if (type === 'invert') {
      invertControlsActive = true;
      invertControlsTimer = duration;
    }

    score += 1; // Bonus points for power-up
    scoreDisplay.textContent = `Score: ${score}`;
    powerUp = null;
    powerUpTimer = 0;
  }

  function update() {
    // Remove spawned power-ups if they are not consumed in time
    if (powerUp) {
      powerUpTimer -= gameSpeed;
      if (powerUpTimer <= 0) {
        powerUp = null;
        powerUpTimer = 0;
      }
    }

    // Update power-up timers
    if (speedBoostActive) {
      speedBoostTimer -= gameSpeed;
      if (speedBoostTimer <= 0) {
        speedBoostActive = false;
        gameSpeed = baseSpeed;
      }
    }

    if (slowMotionActive) {
      slowMotionTimer -= gameSpeed;
      if (slowMotionTimer <= 0) {
        slowMotionActive = false;
        gameSpeed = baseSpeed;
      }
    }

    if (invertControlsActive) {
      invertControlsTimer -= gameSpeed;
      if (invertControlsTimer <= 0) {
        invertControlsActive = false;
      }
    }

    // Update direction
    dx = nextDx;
    dy = nextDy;

    // Calculate new head position
    let headX = snake[0].x + dx;
    let headY = snake[0].y + dy;

    // Handle wall collisions based on difficulty
    if (difficulty === 'easy') {
      // Wraparound in easy mode
      if (headX < 0) headX = tileCount - 1;
      if (headX >= tileCount) headX = 0;
      if (headY < 0) headY = tileCount - 1;
      if (headY >= tileCount) headY = 0;
    } else {
      // Game over on wall hit in normal mode
      if (headX < 0 || headX >= tileCount || headY < 0 || headY >= tileCount) {
        endGame();
        return;
      }
    }

    // Check self collision
    for (let segment of snake) {
      if (segment.x === headX && segment.y === headY) {
        endGame();
        return;
      }
    }

    // Add new head
    snake.unshift({ x: headX, y: headY });

    // Check food collision
    if (headX === food.x && headY === food.y) {
      score += 1;
      scoreDisplay.textContent = `Score: ${score}`;
      generateFood();
      generatePowerUp(); // Chance to spawn power-up after eating
    } else if (powerUp && headX === powerUp.x && headY === powerUp.y) {
      // Power-up collision
      applyPowerUp(powerUp.type);
    } else {
      // Remove tail if no food eaten (snake grows when eating food)
      snake.pop();
    }
  }

  function generateFood() {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };

    // Make sure food doesn't spawn on snake
    for (let segment of snake) {
      if (segment.x === food.x && segment.y === food.y) {
        generateFood();
        return;
      }
    }
  }

  function draw() {
    // Brick Game LCD colors
    const LCD_BG = '#9BBC0F';      // LCD background (light yellow-green)
    const LCD_DARK = '#0F380F';    // Dark pixels (dark green)
    const LCD_GRID = '#8BAC0F';    // Grid lines (slightly darker)

    // Clear canvas with LCD background
    ctx.fillStyle = LCD_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw LCD grid pattern
    ctx.strokeStyle = LCD_GRID;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= tileCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSize, 0);
      ctx.lineTo(i * gridSize, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * gridSize);
      ctx.lineTo(canvas.width, i * gridSize);
      ctx.stroke();
    }

    // Draw power-up with different block patterns
    if (powerUp) {
      ctx.fillStyle = LCD_DARK;
      const px = powerUp.x * gridSize;
      const py = powerUp.y * gridSize;
      
      if (powerUp.type === 'speed') {
        // Speed: double right arrows >>
        ctx.fillRect(px + 3, py + 6, 5, 2);
        ctx.fillRect(px + 6, py + 4, 3, 2);
        ctx.fillRect(px + 6, py + 8, 3, 2);
        ctx.fillRect(px + 8, py + 6, 5, 2);
        ctx.fillRect(px + 11, py + 4, 3, 2);
        ctx.fillRect(px + 11, py + 8, 3, 2);
      } else if (powerUp.type === 'slow') {
        // Slow: center cross
        ctx.fillRect(px + 7, py + 3, 2, 14);
        ctx.fillRect(px + 3, py + 7, 14, 2);
      } else if (powerUp.type === 'invert') {
        // Invert: X pattern
        for (let i = 0; i < 12; i++) {
          ctx.fillRect(px + 3 + i, py + 3 + i, 2, 2);
          ctx.fillRect(px + 15 - i, py + 3 + i, 2, 2);
        }
      }
    }

    // Draw snake as solid dark blocks
    ctx.fillStyle = LCD_DARK;
    for (let i = 0; i < snake.length; i++) {
      const x = snake[i].x * gridSize;
      const y = snake[i].y * gridSize;
      ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
    }

    // Draw food as solid dark block
    ctx.fillStyle = LCD_DARK;
    const fx = food.x * gridSize;
    const fy = food.y * gridSize;
    ctx.fillRect(fx + 1, fy + 1, gridSize - 2, gridSize - 2);

    // Draw power-up indicators in LCD style
    ctx.fillStyle = LCD_DARK;
    ctx.font = 'bold 10px monospace';
    let yPos = 12;

    if (speedBoostActive) {
      ctx.fillText('>>SPEED', 5, yPos);
      yPos += 12;
    }
    if (slowMotionActive) {
      ctx.fillText('<<SLOW', 5, yPos);
      yPos += 12;
    }
    if (invertControlsActive) {
      ctx.fillText('X INVERT', 5, yPos);
    }
  }

  function endGame() {
    gameRunning = false;
    paused = false;
    gameOverMessage.style.display = 'block';
    gameOverMessage.textContent = `GAME OVER\nScore: ${score}\nCuerpo: ${snake.length}\nPress R to restart`;
  }

  function gameLoop() {
    if (gameRunning && !paused) {
      update();
    }
    draw();
  }

  // Restart button handler
  function handleRestart(e) {
    if (e.key.toLowerCase() === 'r') {
      resetGameState();
      gameRunning = true;
      paused = false;
      if (startMenu) startMenu.style.display = 'none';
    }
  }

  // Event listeners
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keydown', handleRestart);

  // Game loop
  const gameInterval = setInterval(gameLoop, gameSpeed);

  // Cleanup function
  return {
    stop: () => {
      clearInterval(gameInterval);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleRestart);
    }
  };
}
