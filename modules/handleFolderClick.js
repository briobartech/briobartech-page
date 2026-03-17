import { initSnake } from './snake.js';
import { initRacing } from './racing.js';
import { initBrickBreaker } from './brickBreaker.js';
import { initBattleCity } from './battleCity.js';

export function initFolders() {
    const folderIcons = document.querySelectorAll('.folder-icon');
    const gameIcons = document.querySelectorAll('.game-icon');
    const closeBtns = document.querySelectorAll('.folder-close');
    const maximizeBtns = document.querySelectorAll('.folder-maximize');

    // Map folder names to window IDs
    const folderWindows = {
        'contact': 'contactWindow',
        'social': 'socialWindow',
        'projects': 'projectsWindow',
        'musicplayer': 'musicPlayerWindow'
    };

    // Map game names to window IDs
    const gameWindows = {
        'snake': 'snakeWindow',
        'racing': 'racingWindow',
        'brickbreaker': 'brickBreakerWindow',
        'battlecity': 'battleCityWindow'
    };

    let snakeGameInstance = null;
    let racingGameInstance = null;
    let brickBreakerGameInstance = null;
    let battleCityGameInstance = null;
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    function openFolder(folderType) {
        const windowId = folderWindows[folderType];
        if (!windowId) return;

        const window = document.getElementById(windowId);
        if (window) {
            window.style.display = 'flex';
        }
    }

    function openGame(gameType) {
        const windowId = gameWindows[gameType];
        if (!windowId) return;

        const window = document.getElementById(windowId);
        if (window) {
            window.style.display = 'flex';

            if (gameType === 'snake' && !snakeGameInstance) {
                snakeGameInstance = initSnake();
            } else if (gameType === 'racing' && !racingGameInstance) {
                racingGameInstance = initRacing();
            } else if (gameType === 'brickbreaker' && !brickBreakerGameInstance) {
                brickBreakerGameInstance = initBrickBreaker();
            } else if (gameType === 'battlecity' && !battleCityGameInstance) {
                battleCityGameInstance = initBattleCity();
            }
        }
    }

    // Handle double-click on folder icons
    folderIcons.forEach(folder => {
        const openEvent = isTouchDevice ? 'click' : 'dblclick';
        folder.addEventListener(openEvent, (e) => {
            e.preventDefault();
            const folderType = folder.dataset.folder;
            openFolder(folderType);
        });
    });

    // Handle double-click on game icons
    gameIcons.forEach(game => {
        const openEvent = isTouchDevice ? 'click' : 'dblclick';
        game.addEventListener(openEvent, (e) => {
            e.preventDefault();
            const gameType = game.dataset.game;
            openGame(gameType);
        });
    });

    // Handle close buttons on folder windows
    closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const windowId = btn.dataset.window;
            const window = document.getElementById(windowId);
            if (window) {
                window.style.display = 'none';
                
                // Stop snake game if closing snake window
                if (windowId === 'snakeWindow' && snakeGameInstance) {
                    snakeGameInstance.stop();
                    snakeGameInstance = null;
                }
                
                // Stop racing game if closing racing window
                if (windowId === 'racingWindow' && racingGameInstance) {
                    racingGameInstance.stop();
                    racingGameInstance = null;
                }

                // Stop brick breaker game if closing brick breaker window
                if (windowId === 'brickBreakerWindow' && brickBreakerGameInstance) {
                    brickBreakerGameInstance.stop();
                    brickBreakerGameInstance = null;
                }

                // Stop battle city game if closing battle city window
                if (windowId === 'battleCityWindow' && battleCityGameInstance) {
                    battleCityGameInstance.stop();
                    battleCityGameInstance = null;
                }
            }
        });
    });

    // Handle maximize/restore buttons on folder windows
    maximizeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const windowId = btn.dataset.window;
            const window = document.getElementById(windowId);
            if (!window) return;

            if (!window.classList.contains('maximized')) {
                window.dataset.prevTop = window.style.top || '';
                window.dataset.prevLeft = window.style.left || '';
                window.dataset.prevWidth = window.style.width || '';
                window.dataset.prevHeight = window.style.height || '';
                window.classList.add('maximized');
                btn.textContent = '❐';
                btn.title = 'Restaurar';
            } else {
                window.classList.remove('maximized');
                window.style.top = window.dataset.prevTop || '';
                window.style.left = window.dataset.prevLeft || '';
                window.style.width = window.dataset.prevWidth || '';
                window.style.height = window.dataset.prevHeight || '';
                btn.textContent = '□';
                btn.title = 'Maximizar';
            }
        });
    });
}
