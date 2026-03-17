export function initRacing() {
  const canvas = document.getElementById('racingCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  // Brick Game constants (igual que snake.js)
  const gridSize = 20;
  const tileCountX = 19; // 380px / 20px
  const tileCountY = 19; // 380px / 20px
  
  // Car dimensions in blocks
  const CAR_WIDTH = 3;
  const CAR_HEIGHT = 4;
  
  // Road configuration
  const LANE_WIDTH = 3; // blocks per lane
  const NUM_LANES = 3;
  const ROAD_WIDTH = LANE_WIDTH * NUM_LANES; // 9 blocks
  const ROAD_START_X = (tileCountX - ROAD_WIDTH) / 2; // centered
  
  // Game state
  let playerLane = 1; // 0, 1, or 2
  let playerY = tileCountY - CAR_HEIGHT - 2; // in blocks
  let obstacles = []; // {lane: 0-2, y: block position}
  let score = 0;
  let gameRunning = true;
  let paused = false;
  let frameCount = 0;
  let moveSpeed = 10; // frames per block movement (ajustado para bloques más grandes)
  let spawnRate = 60; // frames between spawns (ajustado)
  let roadAnimOffset = 0;
  
  const scoreDisplay = document.getElementById('racingScore');
  const gameOverMessage = document.getElementById('racingGameOver');
  
  // Key press tracking for single press movement
  let leftPressed = false;
  let rightPressed = false;

  function handleKeyDown(e) {
    const key = e.key.toLowerCase();

    if (key === 'p' && gameRunning) {
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

    if (!gameRunning || paused) return;
    
    if ((key === 'arrowleft' || key === 'a') && !leftPressed) {
      leftPressed = true;
      if (playerLane > 0) {
        playerLane--;
      }
      e.preventDefault();
    } else if ((key === 'arrowright' || key === 'd') && !rightPressed) {
      rightPressed = true;
      if (playerLane < NUM_LANES - 1) {
        playerLane++;
      }
      e.preventDefault();
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

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * NUM_LANES);
    
    // Check if there's already an obstacle too close in this lane
    const tooClose = obstacles.some(obs => 
      obs.lane === lane && obs.y > -CAR_HEIGHT - 3
    );
    
    if (!tooClose) {
      obstacles.push({
        lane: lane,
        y: -CAR_HEIGHT
      });
    }
  }

  function update() {
    frameCount++;
    
    // Move obstacles down
    if (frameCount % moveSpeed === 0) {
      for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].y += 1; // Move 1 block down
        
        // Remove off-screen obstacles and add score
        if (obstacles[i].y > tileCountY) {
          obstacles.splice(i, 1);
          score += 1;
          scoreDisplay.textContent = `Score: ${score}`;
          
          // Increase difficulty
          if (score % 100 === 0 && moveSpeed > 3) {
            moveSpeed -= 1; // Faster movement
            if (spawnRate > 25) {
              spawnRate -= 5;
            }
          }
        }
      }
      
      // Animate road
      roadAnimOffset++;
      if (roadAnimOffset >= 4) {
        roadAnimOffset = 0;
      }
    }
    
    // Spawn obstacles
    if (frameCount % spawnRate === 0) {
      spawnObstacle();
    }
    
    // Check collisions
    for (let obstacle of obstacles) {
      if (obstacle.lane === playerLane) {
        // Check Y overlap
        if (obstacle.y + CAR_HEIGHT > playerY && obstacle.y < playerY + CAR_HEIGHT) {
          endGame();
          return;
        }
      }
    }
  }

  // Draw a single block (exactamente como snake.js - simple y sólido)
  function drawBlock(gridX, gridY, bright = false) {
    const x = gridX * gridSize;
    const y = gridY * gridSize;
    
    // Draw with same style as snake - solid block, margin of 1px on each side
    ctx.fillStyle = '#0F380F'; // LCD_DARK
    ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
  }

  function drawCar(lane, blockY, isPlayer) {
    const startX = ROAD_START_X + lane * LANE_WIDTH;
    
    // Forma del carro sin cuerpo superior:
    //     ■     (y=0, x=1)
    //   ■ ■ ■   (y=1, x=0,1,2)
    //     ■     (y=2, x=1)
    //   ■   ■   (y=3, x=0,2)
    
    // Fila 0: bloque central superior
    drawBlock(startX + 1, blockY, isPlayer);
    
    // Fila 1: tres bloques
    drawBlock(startX, blockY + 1, isPlayer);
    drawBlock(startX + 1, blockY + 1, isPlayer);
    drawBlock(startX + 2, blockY + 1, isPlayer);
    
    // Fila 2: bloque central
    drawBlock(startX + 1, blockY + 2, isPlayer);
    
    // Fila 3: ruedas (bloques laterales)
    drawBlock(startX, blockY + 3, isPlayer);
    drawBlock(startX + 2, blockY + 3, isPlayer);
  }

  function draw() {
    // Brick Game LCD colors
    const LCD_BG = '#9BBC0F';
    const LCD_DARK = '#0F380F';
    const LCD_GRID = '#8BAC0F';
    
    // Clear canvas with LCD background
    ctx.fillStyle = LCD_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw LCD grid pattern (igual que snake.js)
    ctx.strokeStyle = LCD_GRID;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= tileCountX; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSize, 0);
      ctx.lineTo(i * gridSize, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * gridSize);
      ctx.lineTo(canvas.width, i * gridSize);
      ctx.stroke();
    }
    
    // Draw road edges usando drawBlock para consistencia (sin las 3 filas superiores)
    for (let y = 3; y < tileCountY; y++) {
      // Left edge (2 blocks wide)
      for (let x = ROAD_START_X - 2; x < ROAD_START_X; x++) {
        drawBlock(x, y, false);
      }
      // Right edge (2 blocks wide)
      for (let x = ROAD_START_X + ROAD_WIDTH; x < ROAD_START_X + ROAD_WIDTH + 2; x++) {
        drawBlock(x, y, false);
      }
    }
    
    // Draw obstacles
    for (let obstacle of obstacles) {
      if (obstacle.y >= 0 && obstacle.y < tileCountY) {
        drawCar(obstacle.lane, obstacle.y, false);
      }
    }
    
    // Draw player car
    drawCar(playerLane, playerY, true);
    
    // Draw HUD
    ctx.fillStyle = LCD_DARK;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`SCORE:${score}`, 10, 25);
    ctx.fillText(`SPEED:${10 - moveSpeed}`, 10, 45);
  }

  function endGame() {
    gameRunning = false;
    paused = false;
    gameOverMessage.style.display = 'block';
    gameOverMessage.textContent = `GAME OVER\nScore: ${score}\nPress R to restart`;
  }

  function gameLoop() {
    if (gameRunning && !paused) {
      update();
    }
    draw();
  }

  function handleRestart(e) {
    if (e.key.toLowerCase() === 'r') {
      playerLane = 1;
      obstacles = [];
      score = 0;
      gameRunning = true;
      paused = false;
      frameCount = 0;
      moveSpeed = 10;
      spawnRate = 60;
      roadAnimOffset = 0;
      scoreDisplay.textContent = 'Score: 0';
      gameOverMessage.style.display = 'none';
    }
  }

  // Event listeners
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  document.addEventListener('keydown', handleRestart);

  // Game loop
  const gameInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS

  // Cleanup function
  return {
    stop: () => {
      clearInterval(gameInterval);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('keydown', handleRestart);
    }
  };
}
