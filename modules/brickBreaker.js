export function initBrickBreaker() {
  const canvas = document.getElementById('brickBreakerCanvas');
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');

  // Grid setup: 10px per cell
  const cellSize = 10;
  const cols = canvas.width / cellSize;
  const rows = canvas.height / cellSize;

  const scoreDisplay = document.getElementById('brickBreakerScore');
  const gameOverMessage = document.getElementById('brickBreakerGameOver');

  // LCD palette
  const LCD_BG = '#9BBC0F';
  const LCD_DARK = '#0F380F';
  const LCD_GRID = '#8BAC0F';
  const initialPaddleWidth = 7;

  const paddle = {
    width: initialPaddleWidth, // cells
    x: Math.floor((cols - initialPaddleWidth) / 2),
    y: rows - 3,
  };

  let balls = [];

  let score = 0;
  let running = true;
  let paused = false;
  let leftPressed = false;
  let rightPressed = false;
  let missCounter = 0;

  const bricks = [];
  const brickRows = 5;
  const brickCols = 12;
  const brickStartX = Math.floor((cols - brickCols * 2) / 2);
  const brickStartY = 3;
  let roundsCleared = 0;

  for (let r = 0; r < brickRows; r++) {
    for (let c = 0; c < brickCols; c++) {
      bricks.push({
        x: brickStartX + c * 2,
        y: brickStartY + r * 2,
        alive: true,
      });
    }
  }

  function drawGrid() {
    ctx.strokeStyle = LCD_GRID;
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    for (let i = cols + 1; i <= rows; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }
  }

  function drawCell(cx, cy) {
    ctx.fillStyle = LCD_DARK;
    // 1px margin so LCD lines stay visible and do not cut the block.
    ctx.fillRect(cx * cellSize + 1, cy * cellSize + 1, cellSize - 2, cellSize - 2);
  }

  function draw() {
    ctx.fillStyle = LCD_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();

    bricks.forEach((brick) => {
      if (brick.alive) {
        drawCell(brick.x, brick.y);
      }
    });

    for (let i = 0; i < paddle.width; i++) {
      drawCell(paddle.x + i, paddle.y);
    }

    balls.forEach((ball) => {
      drawCell(ball.x, ball.y);
    });
  }

  function resetBalls(count = 1) {
    balls = [];
    const centerX = Math.floor(cols / 2);

    if (count === 1) {
      balls.push({ x: centerX, y: rows - 5, dx: Math.random() > 0.5 ? 1 : -1, dy: -1 });
      return;
    }

    // Two balls with mirrored horizontal direction for multi-ball phase.
    balls.push({ x: centerX - 1, y: rows - 5, dx: -1, dy: -1 });
    balls.push({ x: centerX + 1, y: rows - 5, dx: 1, dy: -1 });
  }

  function updateScoreDisplay() {
    scoreDisplay.textContent = `Round: ${roundsCleared} | Score: ${score}`;
  }

  function handleBrickCollision(ball, nextX, nextY) {
    for (let i = 0; i < bricks.length; i++) {
      const brick = bricks[i];
      if (!brick.alive) continue;

      if (brick.x === nextX && brick.y === nextY) {
        brick.alive = false;
        score += 1;
        missCounter = 0; // Reset miss counter on successful hit
        updateScoreDisplay();
        ball.dy *= -1;
        return true;
      }
    }
    return false;
  }

  function clampPaddleInsideBoard() {
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > cols) {
      paddle.x = cols - paddle.width;
    }
  }

  function advanceRound() {
    roundsCleared += 1;
    missCounter = 0;

    // If player clears with 1-block paddle, reset cycle and start multi-ball phase.
    if (paddle.width === 1) {
      paddle.width = initialPaddleWidth;
      paddle.x = Math.floor((cols - initialPaddleWidth) / 2);
      roundsCleared = 0;
      bricks.forEach((brick) => {
        brick.alive = true;
      });
      resetBalls(2);
      gameOverMessage.style.display = 'none';
      updateScoreDisplay();
      return;
    }

    // Otherwise increase difficulty: shrink paddle by 1 block.
    if (paddle.width > 1) {
      const center = paddle.x + (paddle.width - 1) / 2;
      paddle.width -= 1;
      paddle.x = Math.round(center - (paddle.width - 1) / 2);
      clampPaddleInsideBoard();
    }

    bricks.forEach((brick) => {
      brick.alive = true;
    });

    resetBalls(1);
    gameOverMessage.style.display = 'none';
    updateScoreDisplay();
  }

  function updateBall(ball) {
    let nextX = ball.x + ball.dx;
    let nextY = ball.y + ball.dy;

    if (nextX < 0 || nextX >= cols) {
      ball.dx *= -1;
      nextX = ball.x + ball.dx;
    }

    if (nextY < 0) {
      ball.dy *= -1;
      nextY = ball.y + ball.dy;
    }

    let hitPaddle = false;
    if (nextY === paddle.y && nextX >= paddle.x && nextX < paddle.x + paddle.width) {
      hitPaddle = true;
      ball.dy = -1;
      if (nextX < paddle.x + Math.floor(paddle.width / 2)) {
        ball.dx = -1;
      } else {
        ball.dx = 1;
      }
      nextY = ball.y + ball.dy;
    }

    const brickHit = handleBrickCollision(ball, nextX, nextY);

    // Increment miss counter only if ball hit paddle but no brick was destroyed
    if (hitPaddle && !brickHit) {
      missCounter += 1;
      
      // Check if 10 paddle hits without destroying bricks
      if (missCounter >= 10 && paddle.width > 1) {
        const center = paddle.x + (paddle.width - 1) / 2;
        paddle.width -= 1;
        paddle.x = Math.round(center - (paddle.width - 1) / 2);
        clampPaddleInsideBoard();
        missCounter = 0; // Reset counter after penalty
        updateScoreDisplay();
      }
    }

    // Reset counter when a brick is destroyed
    if (brickHit) {
      missCounter = 0;
    }

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Return false when this ball is lost.
    return ball.y < rows;
  }

  function update() {
    if (leftPressed && paddle.x > 0) {
      paddle.x -= 1;
    }
    if (rightPressed && paddle.x + paddle.width < cols) {
      paddle.x += 1;
    }

    balls = balls.filter((ball) => updateBall(ball));

    if (balls.length === 0) {
      running = false;
      gameOverMessage.style.display = 'block';
      gameOverMessage.textContent = `GAME OVER\nScore: ${score}\nPress R to restart`;
      return;
    }

    if (bricks.every((brick) => !brick.alive)) {
      advanceRound();
    }
  }

  function restart() {
    bricks.forEach((brick) => {
      brick.alive = true;
    });
    score = 0;
    roundsCleared = 0;
    missCounter = 0;
    updateScoreDisplay();
    paddle.width = initialPaddleWidth;
    paddle.x = Math.floor((cols - initialPaddleWidth) / 2);
    resetBalls(1);
    running = true;
    paused = false;
    gameOverMessage.style.display = 'none';
  }

  function handleKeyDown(e) {
    const key = e.key.toLowerCase();

    if (key === 'p' && running) {
      paused = !paused;
      if (paused) {
        gameOverMessage.style.display = 'block';
        gameOverMessage.textContent = 'PAUSED\nPress P to resume';
      } else if (gameOverMessage.textContent.startsWith('PAUSED')) {
        gameOverMessage.style.display = 'none';
      }
      e.preventDefault();
      return;
    }

    if (paused) return;

    if (key === 'arrowleft' || key === 'a') {
      leftPressed = true;
      e.preventDefault();
    } else if (key === 'arrowright' || key === 'd') {
      rightPressed = true;
      e.preventDefault();
    } else if (key === 'r') {
      restart();
    }
  }

  function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') {
      leftPressed = false;
    } else if (key === 'arrowright' || key === 'd') {
      rightPressed = false;
    }
  }

  function gameLoop() {
    if (running && !paused) {
      update();
    }
    draw();
  }

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  resetBalls(1);

  const gameInterval = setInterval(gameLoop, 80); // Block-to-block motion

  return {
    stop: () => {
      clearInterval(gameInterval);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    },
  };
}
