export function initBattleCity() {
  const canvas = document.getElementById('battleCityCanvas');
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');

  // Grid setup: 20px per cell
  const cellSize = 20;
  const cols = canvas.width / cellSize;
  const rows = canvas.height / cellSize;

  const scoreDisplay = document.getElementById('battleCityScore');
  const gameOverMessage = document.getElementById('battleCityGameOver');

  // LCD palette
  const LCD_BG = '#9BBC0F';
  const LCD_DARK = '#0F380F';
  const LCD_GRID = '#8BAC0F';

  // Player tank
  const player = {
    x: Math.floor(cols / 2) - 1,
    y: Math.floor(rows / 2) - 4,
    direction: 'up', // up, down, left, right
    width: 3,
    height: 3,
  };

  let bullets = [];
  let enemyBullets = [];
  let enemies = [];
  let walls = [];
  let score = 0;
  let running = true;
  let paused = false;
  let upPressed = false;
  let downPressed = false;
  let leftPressed = false;
  let rightPressed = false;
  let spacePressed = false;
  let lastShot = 0;
  let spawnCounter = 0;
  let maxEnemies = 10;
  let bossesSpawned = 0;
  let lastBossScore = 0;
  const initialLives = 3;
  let lives = initialLives;

  // Base position - in the center
  const base = {
    x: Math.floor(cols / 2) - 1,
    y: Math.floor(rows / 2) - 1,
    width: 2,
    height: 2,
  };

  function generateMap() {
    walls = [];
    // No walls/bricks - empty map
  }

  function drawGrid() {
    ctx.strokeStyle = LCD_GRID;
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
    }

    for (let i = 0; i <= rows; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }
  }

  function drawCell(cx, cy) {
    ctx.fillStyle = LCD_DARK;
    ctx.fillRect(cx * cellSize + 1, cy * cellSize + 1, cellSize - 2, cellSize - 2);
  }

  function drawTank(tank) {
    const baseX = tank.x;
    const baseY = tank.y;

    // Boss tank: 4x4 with double cannons
    if (tank.isBoss) {
      if (tank.direction === 'up') {
        // Top: two cannons
        drawCell(baseX + 1, baseY);
        drawCell(baseX + 2, baseY);
        // Middle rows: full body
        for (let i = 0; i < 4; i++) {
          drawCell(baseX + i, baseY + 1);
          drawCell(baseX + i, baseY + 2);
        }
        // Bottom: sides
        drawCell(baseX, baseY + 3);
        drawCell(baseX + 3, baseY + 3);
      } else if (tank.direction === 'down') {
        // Top: sides
        drawCell(baseX, baseY);
        drawCell(baseX + 3, baseY);
        // Middle rows: full body
        for (let i = 0; i < 4; i++) {
          drawCell(baseX + i, baseY + 1);
          drawCell(baseX + i, baseY + 2);
        }
        // Bottom: two cannons
        drawCell(baseX + 1, baseY + 3);
        drawCell(baseX + 2, baseY + 3);
      } else if (tank.direction === 'left') {
        // Left: cannon
        drawCell(baseX, baseY + 1);
        drawCell(baseX, baseY + 2);
        // Middle columns: full body
        for (let i = 0; i < 4; i++) {
          drawCell(baseX + 1, baseY + i);
          drawCell(baseX + 2, baseY + i);
        }
        // Right: sides
        drawCell(baseX + 3, baseY);
        drawCell(baseX + 3, baseY + 3);
      } else if (tank.direction === 'right') {
        // Left: sides
        drawCell(baseX, baseY);
        drawCell(baseX, baseY + 3);
        // Middle columns: full body
        for (let i = 0; i < 4; i++) {
          drawCell(baseX + 1, baseY + i);
          drawCell(baseX + 2, baseY + i);
        }
        // Right: cannon
        drawCell(baseX + 3, baseY + 1);
        drawCell(baseX + 3, baseY + 2);
      }
      return;
    }

    // Regular tank: 3x3 with pattern
    if (tank.direction === 'up') {
      // Top: center
      drawCell(baseX + 1, baseY);
      // Middle: all 3
      drawCell(baseX, baseY + 1);
      drawCell(baseX + 1, baseY + 1);
      drawCell(baseX + 2, baseY + 1);
      // Bottom: sides only
      drawCell(baseX, baseY + 2);
      drawCell(baseX + 2, baseY + 2);
    } else if (tank.direction === 'down') {
      // Top: sides only
      drawCell(baseX, baseY);
      drawCell(baseX + 2, baseY);
      // Middle: all 3
      drawCell(baseX, baseY + 1);
      drawCell(baseX + 1, baseY + 1);
      drawCell(baseX + 2, baseY + 1);
      // Bottom: center
      drawCell(baseX + 1, baseY + 2);
    } else if (tank.direction === 'left') {
      // Left column: center only
      drawCell(baseX, baseY + 1);
      // Middle column: all 3
      drawCell(baseX + 1, baseY);
      drawCell(baseX + 1, baseY + 1);
      drawCell(baseX + 1, baseY + 2);
      // Right column: top and bottom
      drawCell(baseX + 2, baseY);
      drawCell(baseX + 2, baseY + 2);
    } else if (tank.direction === 'right') {
      // Left column: top and bottom
      drawCell(baseX, baseY);
      drawCell(baseX, baseY + 2);
      // Middle column: all 3
      drawCell(baseX + 1, baseY);
      drawCell(baseX + 1, baseY + 1);
      drawCell(baseX + 1, baseY + 2);
      // Right column: center only
      drawCell(baseX + 2, baseY + 1);
    }
  }

  function draw() {
    ctx.fillStyle = LCD_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();

    // Draw base
    for (let i = 0; i < base.width; i++) {
      for (let j = 0; j < base.height; j++) {
        drawCell(base.x + i, base.y + j);
      }
    }

    // Draw player tank
    drawTank(player);

    // Draw enemies
    enemies.forEach((enemy) => {
      drawTank(enemy);
    });

    // Draw bullets
    bullets.forEach((bullet) => {
      drawCell(bullet.x, bullet.y);
    });

    // Draw enemy bullets
    enemyBullets.forEach((bullet) => {
      drawCell(bullet.x, bullet.y);
    });
  }

  function canOccupy(x, y, width, height, excludeEntity = null) {
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        const cx = x + i;
        const cy = y + j;

        // Out of bounds
        if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) return false;

        // Check base collision
        if (cx >= base.x && cx < base.x + base.width &&
            cy >= base.y && cy < base.y + base.height) {
          return false;
        }

        // Check enemies (excluding the one that's trying to move)
        if (enemies.some((e) => {
          if (e === excludeEntity) return false; // Skip self
          return (e.x < cx + 1 && e.x + e.width > cx && e.y < cy + 1 && e.y + e.height > cy);
        })) {
          return false;
        }

        // Check player collision (only for enemies)
        if (excludeEntity !== null) {
          if (player.x < cx + 1 && player.x + player.width > cx && 
              player.y < cy + 1 && player.y + player.height > cy) {
            return false;
          }
        }
      }
    }
    return true;
  }

  function movePlayer() {
    let newX = player.x;
    let newY = player.y;

    if (upPressed) {
      player.direction = 'up';
      newY -= 1;
    } else if (downPressed) {
      player.direction = 'down';
      newY += 1;
    } else if (leftPressed) {
      player.direction = 'left';
      newX -= 1;
    } else if (rightPressed) {
      player.direction = 'right';
      newX += 1;
    }

    if (canOccupy(newX, newY, player.width, player.height)) {
      player.x = newX;
      player.y = newY;
    }
  }

  function shoot() {
    const now = Date.now();
    if (now - lastShot < 500) return; // 500ms cooldown
    lastShot = now;

    let bulletX = player.x;
    let bulletY = player.y;
    let bulletDx = 0;
    let bulletDy = 0;

    if (player.direction === 'up') {
      bulletX = player.x + 1;
      bulletY = player.y - 1;
      bulletDy = -1;
    } else if (player.direction === 'down') {
      bulletX = player.x + 1;
      bulletY = player.y + 3;
      bulletDy = 1;
    } else if (player.direction === 'left') {
      bulletX = player.x - 1;
      bulletY = player.y + 1;
      bulletDx = -1;
    } else if (player.direction === 'right') {
      bulletX = player.x + 3;
      bulletY = player.y + 1;
      bulletDx = 1;
    }

    bullets.push({ x: bulletX, y: bulletY, dx: bulletDx, dy: bulletDy });
  }

  function updateBullets() {
    bullets = bullets.filter((bullet) => {
      bullet.x += bullet.dx;
      bullet.y += bullet.dy;

      // Out of bounds
      if (bullet.x < 0 || bullet.x >= cols || bullet.y < 0 || bullet.y >= rows) {
        return false;
      }

      // Hit enemies
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if ((bullet.x >= enemy.x && bullet.x < enemy.x + enemy.width) &&
            (bullet.y >= enemy.y && bullet.y < enemy.y + enemy.height)) {
          if (enemy.isBoss) {
            enemy.hp = (enemy.hp || 10) - 1;
            if (enemy.hp <= 0) {
              enemies.splice(i, 1);
              score += 3;
              lives += 1;
            }
          } else {
            enemies.splice(i, 1);
            score += 1;
          }
          return false;
        }
      }

      return true;
    });

    enemyBullets = enemyBullets.filter((bullet) => {
      bullet.x += bullet.dx;
      bullet.y += bullet.dy;

      // Out of bounds
      if (bullet.x < 0 || bullet.x >= cols || bullet.y < 0 || bullet.y >= rows) {
        return false;
      }

      // Hit player
      if ((bullet.x >= player.x && bullet.x < player.x + player.width) &&
          (bullet.y >= player.y && bullet.y < player.y + player.height)) {
        loseLife('HIT BY ENEMY');
        return false;
      }

      // Hit base/bunker
      if ((bullet.x >= base.x && bullet.x < base.x + base.width) &&
          (bullet.y >= base.y && bullet.y < base.y + base.height)) {
        loseLife('BUNKER HIT');
        return false;
      }

      return true;
    });
  }

  function overlapsPlayer(x, y, width, height) {
    return (
      x < player.x + player.width &&
      x + width > player.x &&
      y < player.y + player.height &&
      y + height > player.y
    );
  }

  function getSafeSpawnPosition(size, minDistance) {
    const corners = [
      { x: 2, y: 2 },
      { x: cols - size - 2, y: 2 },
      { x: 2, y: rows - size - 2 },
      { x: cols - size - 2, y: rows - size - 2 },
    ];

    const playerCenterX = player.x + (player.width - 1) / 2;
    const playerCenterY = player.y + (player.height - 1) / 2;

    const ranked = corners
      .map((corner) => {
        const spawnCenterX = corner.x + (size - 1) / 2;
        const spawnCenterY = corner.y + (size - 1) / 2;
        const distance = Math.abs(spawnCenterX - playerCenterX) + Math.abs(spawnCenterY - playerCenterY);
        return { ...corner, distance };
      })
      .sort((a, b) => b.distance - a.distance);

    for (const corner of ranked) {
      if (corner.distance < minDistance) continue;
      if (!overlapsPlayer(corner.x, corner.y, size, size) && canOccupy(corner.x, corner.y, size, size)) {
        return corner;
      }
    }

    for (const corner of ranked) {
      if (!overlapsPlayer(corner.x, corner.y, size, size) && canOccupy(corner.x, corner.y, size, size)) {
        return corner;
      }
    }

    return null;
  }

  function loseLife(reason) {
    bullets = [];
    enemyBullets = [];

    if (lives === 0) {
      running = false;
      gameOverMessage.style.display = 'block';
      gameOverMessage.textContent = `${reason}\nNo lives left\nScore: ${score}\nPress R to restart`;
      return;
    }

    lives -= 1;

    // Reset player position after taking damage
    player.x = Math.floor(cols / 2) - 1;
    player.y = Math.floor(rows / 2) - 4;
    player.direction = 'up';
  }

  function spawnInitialEnemies() {
    enemies = [];
    
    // Spawn 4 enemies at each corner
    const corners = [
      { x: 2, y: 2 },                           // Top-left
      { x: cols - 5, y: 2 },                    // Top-right
      { x: 2, y: rows - 5 },                    // Bottom-left
      { x: cols - 5, y: rows - 5 }              // Bottom-right
    ];
    
    corners.forEach((corner) => {
      enemies.push({
        x: corner.x,
        y: corner.y,
        direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)],
        width: 3,
        height: 3,
        moveCounter: 0,
        shootCounter: 0,
        isBoss: false,
      });
    });
  }

  function spawnEnemy() {
    if (enemies.length >= maxEnemies) return;

    const corner = getSafeSpawnPosition(3, 8);
    if (!corner) return;
    
    enemies.push({
      x: corner.x,
      y: corner.y,
      direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)],
      width: 3,
      height: 3,
      moveCounter: 0,
      shootCounter: 0,
      isBoss: false,
    });
  }

  function spawnBoss() {
    const corner = getSafeSpawnPosition(4, 9);
    if (!corner) return;
    
    // Calculate boss phase (how many directions it shoots)
    // Every 10 bosses = new phase (1+2+3+4 = 10 bosses per cycle)
    const bossPhase = Math.floor(bossesSpawned / 10) + 1;
    const shootDirections = Math.min(bossPhase, 4);
    
    enemies.push({
      x: corner.x,
      y: corner.y,
      direction: 'down',
      width: 4,
      height: 4,
      moveCounter: 0,
      shootCounter: 0,
      isBoss: true,
      hp: 10,
      shootDirections: shootDirections,
    });
    
    bossesSpawned++;
  }

  function enemyShoot(enemy) {
    if (enemy.isBoss) {
      const directions = [];
      const shootDirs = enemy.shootDirections || 1;
      
      // Determine which directions to shoot based on shootDirections
      if (shootDirs === 1) {
        directions.push(enemy.direction);
      } else if (shootDirs === 2) {
        directions.push('up', 'down');
      } else if (shootDirs === 3) {
        directions.push('up', 'down', 'left');
      } else if (shootDirs >= 4) {
        directions.push('up', 'down', 'left', 'right');
      }
      
      // Shoot in each direction
      directions.forEach(dir => {
        let bullet1X, bullet1Y, bullet2X, bullet2Y;
        let bulletDx = 0, bulletDy = 0;
        
        if (dir === 'up') {
          bullet1X = enemy.x + 1;
          bullet1Y = enemy.y - 1;
          bullet2X = enemy.x + 2;
          bullet2Y = enemy.y - 1;
          bulletDy = -1;
        } else if (dir === 'down') {
          bullet1X = enemy.x + 1;
          bullet1Y = enemy.y + 4;
          bullet2X = enemy.x + 2;
          bullet2Y = enemy.y + 4;
          bulletDy = 1;
        } else if (dir === 'left') {
          bullet1X = enemy.x - 1;
          bullet1Y = enemy.y + 1;
          bullet2X = enemy.x - 1;
          bullet2Y = enemy.y + 2;
          bulletDx = -1;
        } else if (dir === 'right') {
          bullet1X = enemy.x + 4;
          bullet1Y = enemy.y + 1;
          bullet2X = enemy.x + 4;
          bullet2Y = enemy.y + 2;
          bulletDx = 1;
        }
        
        enemyBullets.push({ x: bullet1X, y: bullet1Y, dx: bulletDx, dy: bulletDy });
        enemyBullets.push({ x: bullet2X, y: bullet2Y, dx: bulletDx, dy: bulletDy });
      });
    } else {
      // Regular tank shoots one bullet
      let bulletX = enemy.x;
      let bulletY = enemy.y;
      let bulletDx = 0;
      let bulletDy = 0;
      
      if (enemy.direction === 'up') {
        bulletX = enemy.x + 1;
        bulletY = enemy.y - 1;
        bulletDy = -1;
      } else if (enemy.direction === 'down') {
        bulletX = enemy.x + 1;
        bulletY = enemy.y + 3;
        bulletDy = 1;
      } else if (enemy.direction === 'left') {
        bulletX = enemy.x - 1;
        bulletY = enemy.y + 1;
        bulletDx = -1;
      } else if (enemy.direction === 'right') {
        bulletX = enemy.x + 3;
        bulletY = enemy.y + 1;
        bulletDx = 1;
      }
      
      enemyBullets.push({ x: bulletX, y: bulletY, dx: bulletDx, dy: bulletDy });
    }
  }

  function updateEnemies() {
    enemies.forEach((enemy) => {
      enemy.moveCounter += 1;
      enemy.shootCounter += 1;

      // Move every 5 frames (faster movement)
      if (enemy.moveCounter >= 5) {
        enemy.moveCounter = 0;

        // Ocasional random direction change (5% probability)
        if (Math.random() < 0.05) {
          enemy.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
        }

        let newX = enemy.x;
        let newY = enemy.y;

        if (enemy.direction === 'up') newY -= 1;
        else if (enemy.direction === 'down') newY += 1;
        else if (enemy.direction === 'left') newX -= 1;
        else if (enemy.direction === 'right') newX += 1;

        if (canOccupy(newX, newY, enemy.width, enemy.height, enemy)) {
          enemy.x = newX;
          enemy.y = newY;
        } else {
          // Try turning when hitting obstacle
          enemy.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
        }
      }

      // Shoot randomly every 20-35 frames
      if (enemy.shootCounter >= 20 + Math.random() * 15) {
        enemy.shootCounter = 0;
        enemyShoot(enemy);
      }
    });
  }

  function checkCollisions() {
    // Base hit by enemy contact
    if (enemies.some((e) => 
      (e.x < base.x + base.width && e.x + e.width > base.x &&
       e.y < base.y + base.height && e.y + e.height > base.y)
    )) {
      loseLife('BUNKER HIT');
      return;
    }

    // Base hit by enemy bullet (fallback; usually handled in updateBullets)
    if (enemyBullets.some((b) =>
      (b.x >= base.x && b.x < base.x + base.width &&
       b.y >= base.y && b.y < base.y + base.height)
    )) {
      loseLife('BUNKER HIT');
      return;
    }

    // Player hit by enemy contact
    if (enemies.some((e) =>
      (e.x < player.x + player.width && e.x + e.width > player.x &&
       e.y < player.y + player.height && e.y + e.height > player.y)
    )) {
      loseLife('HIT BY ENEMY');
      return;
    }
  }

  function update() {
    if (!running) return;

    movePlayer();
    if (spacePressed) shoot();

    updateBullets();
    updateEnemies();
    checkCollisions();

    // Spawn bosses progressively every 10 points
    if (score >= 10 && score % 10 === 0 && score > lastBossScore) {
      // Calculate how many bosses to spawn
      const cycle = Math.floor((score - 10) / 40); // Which full cycle (0, 1, 2...)
      const positionInCycle = ((score - 10) % 40) / 10; // 0, 1, 2, 3
      const bossesToSpawn = positionInCycle + 1; // 1, 2, 3, or 4 bosses
      
      for (let i = 0; i < bossesToSpawn; i++) {
        spawnBoss();
      }
      
      lastBossScore = score;
    }

    // Always maintain at least 1 enemy
    if (enemies.length === 0) {
      spawnEnemy();
    }

    // Spawn new enemies periodically
    spawnCounter++;
    if (spawnCounter >= 60) {  // Every 60 frames (~5 seconds)
      spawnCounter = 0;
      if (enemies.length < maxEnemies) {
        spawnEnemy();
      }
    }

    scoreDisplay.textContent = `Lives: ${lives} | Score: ${score} | Enemies: ${enemies.length}`;
  }

  function restart() {
    player.x = Math.floor(cols / 2) - 1;
    player.y = Math.floor(rows / 2) - 4;
    player.direction = 'up';
    bullets = [];
    enemyBullets = [];
    generateMap();
    spawnInitialEnemies();
    score = 0;
    lives = initialLives;
    spawnCounter = 0;
    bossesSpawned = 0;
    lastBossScore = 0;
    running = true;
    paused = false;
    scoreDisplay.textContent = `Lives: ${initialLives} | Score: 0 | Enemies: 4`;
    gameOverMessage.style.display = 'none';
  }

  function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'w') {
      upPressed = true;
      e.preventDefault();
    } else if (key === 'arrowdown' || key === 's') {
      downPressed = true;
      e.preventDefault();
    } else if (key === 'arrowleft' || key === 'a') {
      leftPressed = true;
      e.preventDefault();
    } else if (key === 'arrowright' || key === 'd') {
      rightPressed = true;
      e.preventDefault();
    } else if (key === ' ') {
      spacePressed = true;
      e.preventDefault();
    } else if (key === 'p' && running) {
      paused = !paused;
      if (paused) {
        gameOverMessage.style.display = 'block';
        gameOverMessage.textContent = 'PAUSED\nPress P to resume';
      } else if (gameOverMessage.textContent.startsWith('PAUSED')) {
        gameOverMessage.style.display = 'none';
      }
      e.preventDefault();
    } else if (key === 'r') {
      restart();
    }
  }

  function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'w') upPressed = false;
    else if (key === 'arrowdown' || key === 's') downPressed = false;
    else if (key === 'arrowleft' || key === 'a') leftPressed = false;
    else if (key === 'arrowright' || key === 'd') rightPressed = false;
    else if (key === ' ') spacePressed = false;
  }

  function gameLoop() {
    if (running && !paused) {
      update();
    }
    draw();
  }

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  generateMap();
  spawnInitialEnemies();
  scoreDisplay.textContent = `Lives: ${initialLives} | Score: 0 | Enemies: 4`;

  const gameInterval = setInterval(gameLoop, 80);

  return {
    stop: () => {
      clearInterval(gameInterval);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    },
  };
}
