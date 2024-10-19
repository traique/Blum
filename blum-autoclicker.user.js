// ==UserScript==
// @name Blum Autoclicker
// @version 1.5
// @namespace Violentmonkey Scripts
// @match https://telegram.blum.codes/*
// @grant none
// ==/UserScript==

(function () {
    'use strict';

    let GAME_SETTINGS = {
        minBombHits: Math.floor(Math.random() * 2),
        minIceHits: Math.floor(Math.random() * 2) + 1,
        flowerSkipPercentage: Math.floor(Math.random() * 11) + 5,
        minDelayMs: 2000,
        maxDelayMs: 5000,
        autoClickPlay: false
    };

    let isGamePaused = false;
    let gameStats = {
        score: 0,
        bombHits: 0,
        iceHits: 0,
        flowersSkipped: 0,
        isGameOver: false
    };

    function triggerMouseEvent(element, eventType) {
        const clickEvent = new MouseEvent(eventType, {
            view: window,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(clickEvent);
    }

    const originalPush = Array.prototype.push;
    Array.prototype.push = function (...items) {
        if (!isGamePaused) {
            items.forEach(item => handleGameElement(item));
        }
        return originalPush.apply(this, items);
    };

    function handleGameElement(element) {
        if (!element || !element.item) return;
        switch (element.item.type) {
            case "CLOVER":
                processFlower(element);
                break;
            case "BOMB":
                processBomb(element);
                break;
            case "FREEZE":
                processIce(element);
                break;
        }
    }

    function processFlower(element) {
        if (Math.random() < (GAME_SETTINGS.flowerSkipPercentage / 100)) {
            gameStats.flowersSkipped++;
        } else {
            gameStats.score++;
            triggerMouseEvent(element, 'click');
        }
    }

    function processBomb(element) {
        if (gameStats.bombHits < GAME_SETTINGS.minBombHits) {
            gameStats.score = 0;
            triggerMouseEvent(element, 'click');
            gameStats.bombHits++;
        }
    }

    function processIce(element) {
        if (gameStats.iceHits < GAME_SETTINGS.minIceHits) {
            triggerMouseEvent(element, 'click');
            gameStats.iceHits++;
        }
    }

    function checkGameCompletion() {
        const rewardElement = document.querySelector('#app > div > div > div.content > div.reward');
        if (rewardElement && !gameStats.isGameOver) {
            gameStats.isGameOver = true;
            resetGameStats();
        }
    }

    function resetGameStats() {
        gameStats = {
            score: 0,
            bombHits: 0,
            iceHits: 0,
            flowersSkipped: 0,
            isGameOver: false
        };
    }

    function getNewGameDelay() {
        return Math.floor(Math.random() * (GAME_SETTINGS.maxDelayMs - GAME_SETTINGS.minDelayMs + 1) + GAME_SETTINGS.minDelayMs);
    }

    function checkAndClickPlayButton() {
        const playButtons = document.querySelectorAll('button.kit-button.is-large.is-primary:not(.is-disabled), a.play-btn[href="/game"]');
        playButtons.forEach(button => {
            if (!isGamePaused && GAME_SETTINGS.autoClickPlay && (/Play/i.test(button.textContent) || /Continue/i.test(button.textContent))) {
                setTimeout(() => {
                    triggerMouseEvent(button, 'click');
                    gameStats.isGameOver = false;
                }, getNewGameDelay());
            }
        });
    }

    function continuousPlayButtonCheck() {
        checkAndClickPlayButton();
        setTimeout(continuousPlayButtonCheck, 1000);
    }

    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                checkGameCompletion();
            }
        }
    });

    const appElement = document.querySelector('#app');
    if (appElement) {
        observer.observe(appElement, { childList: true, subtree: true });
    }

    continuousPlayButtonCheck();

    const settingsMenu = document.createElement('div');
    settingsMenu.className = 'settings-menu';
    settingsMenu.style.display = 'none';

    const menuTitle = document.createElement('h3');
    menuTitle.className = 'settings-title';
    menuTitle.textContent = 'Blum Autoclicker';

    const closeButton = document.createElement('button');
    closeButton.className = 'settings-close-button';
    closeButton.textContent = '×';
    closeButton.onclick = () => {
        settingsMenu.style.display = 'none';
    };

    menuTitle.appendChild(closeButton);
    settingsMenu.appendChild(menuTitle);

    function updateSettingsMenu() {
        document.getElementById('flowerSkipPercentage').value = GAME_SETTINGS.flowerSkipPercentage;
        document.getElementById('flowerSkipPercentageDisplay').textContent = GAME_SETTINGS.flowerSkipPercentage;
        document.getElementById('minIceHits').value = GAME_SETTINGS.minIceHits;
        document.getElementById('minIceHitsDisplay').textContent = GAME_SETTINGS.minIceHits;
        document.getElementById('minBombHits').value = GAME_SETTINGS.minBombHits;
        document.getElementById('minBombHitsDisplay').textContent = GAME_SETTINGS.minBombHits;
        document.getElementById('minDelayMs').value = GAME_SETTINGS.minDelayMs;
        document.getElementById('minDelayMsDisplay').textContent = GAME_SETTINGS.minDelayMs;
        document.getElementById('maxDelayMs').value = GAME_SETTINGS.maxDelayMs;
        document.getElementById('maxDelayMsDisplay').textContent = GAME_SETTINGS.maxDelayMs;
        document.getElementById('autoClickPlay').checked = GAME_SETTINGS.autoClickPlay;
    }

    settingsMenu.appendChild(createSettingElement('Flower Skip (%)', 'flowerSkipPercentage', 'range', 0, 100, 1, 'Percentage probability of skipping a flower.'));
    settingsMenu.appendChild(createSettingElement('Min Freeze Hits', 'minIceHits', 'range', 1, 10, 1, 'Minimum number of clicks per freeze.'));
    settingsMenu.appendChild(createSettingElement('Min Bomb Hits', 'minBombHits', 'range', 0, 10, 1, 'Minimum number of clicks per bomb.'));
    settingsMenu.appendChild(createSettingElement('Min Delay (ms)', 'minDelayMs', 'range', 10, 10000, 10, 'Minimum delay between clicks.'));
    settingsMenu.appendChild(createSettingElement('Max Delay (ms)', 'maxDelayMs', 'range', 10, 10000, 10, 'Maximum delay between clicks.'));
    settingsMenu.appendChild(createSettingElement('Auto Click Play', 'autoClickPlay', 'checkbox', null, null, null, 'Automatically start the next game at the end of.'));

    const pauseResumeButton = document.createElement('button');
    pauseResumeButton.textContent = 'Pause';
    pauseResumeButton.className = 'pause-resume-btn';
    pauseResumeButton.onclick = toggleGamePause;
    settingsMenu.appendChild(pauseResumeButton);

    const socialButtons = document.createElement('div');
    socialButtons.className = 'social-buttons';

    const githubButton = document.createElement('a');
    githubButton.href = 'https://github.com/traique/Blum';
    githubButton.target = '_blank';
    githubButton.className = 'social-button';
    githubButton.textContent = 'GitHub';
    socialButtons.appendChild(githubButton);

    settingsMenu.appendChild(socialButtons);
    document.body.appendChild(settingsMenu);

    const settingsButton = document.createElement('button');
    settingsButton.className = 'settings-button';
    settingsButton.textContent = '⚙️';
    settingsButton.onclick = () => {
        settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
    };
    document.body.appendChild(settingsButton);

    const style = document.createElement('style');
    style.textContent = `/* ... (CSS styles) ... */`;
    document.head.appendChild(style);

    function saveSettings() {
        localStorage.setItem('BlumAutoclickerSettings', JSON.stringify(GAME_SETTINGS));
    }

    function loadSettings() {
        const savedSettings = localStorage.getItem('BlumAutoclickerSettings');
        if (savedSettings) {
            try {
                const parsedSettings = JSON.parse(savedSettings);
                GAME_SETTINGS = { ...GAME_SETTINGS, ...parsedSettings };
            } catch (error) {
                console.error("Lỗi khi tải cài đặt:", error);
            }
        }
    }

    loadSettings();
    updateSettingsMenu();

    function toggleGamePause() {
        isGamePaused = !isGamePaused;
        pauseResumeButton.textContent = isGamePaused ? 'Resume' : 'Pause';
        pauseResumeButton.style.backgroundColor = isGamePaused ? '#e5c07b' : '#98c379';
    }

    function AutoClaimAndStart() {
        setInterval(() => {
            const claimButton = document.querySelector('button.kit-button.is-large.is-drop.is-fill.button.is-done');
                const startFarmingButton = document.querySelector('button.kit-button.is-large.is-primary.is-fill.button');
    const continueButton = document.querySelector('button.kit-button.is-large.is-primary.is-fill.btn');
    if (claimButton) {
        triggerMouseEvent(claimButton, 'click');
    } else if (startFarmingButton) {
        triggerMouseEvent(startFarmingButton, 'click');
    } else if (continueButton) {
        triggerMouseEvent(continueButton, 'click');
    }
}, Math.floor(Math.random() * 5000) + 5000);
}

AutoClaimAndStart();
})();
