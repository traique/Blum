// ==UserScript==
// @name         Blum Autoclicker
// @version      1.3
// @namespace    Violentmonkey Scripts
// @author       Traique, Coding Partner
// @match        https://telegram.blum.codes/*
// @grant        none
// @icon         https://imgur.com/a/IyF61ni
// @downloadURL  https://github.com/traique/Blum/raw/main/blum-autoclicker.user.js
// @updateURL    https://github.com/traique/Blum/raw/main/blum-autoclicker.user.js
// @homepage     https://github.com/traique/Blum
// ==/UserScript==

(function () {
    'use strict';

    // Cấu hình trò chơi
    let GAME_SETTINGS = {
        minBombHits: Math.floor(Math.random() * 2), // Số lần click tối thiểu vào bom
        minIceHits: Math.floor(Math.random() * 2) + 1, // Số lần click tối thiểu vào băng
        flowerSkipPercentage: Math.floor(Math.random() * 11) + 5, // Tỷ lệ phần trăm bỏ qua hoa
        minDelayMs: 2000, // Độ trễ tối thiểu giữa các lần click (ms)
        maxDelayMs: 5000, // Độ trễ tối đa giữa các lần click (ms)
        autoClickPlay: false // Tự động click vào nút "Play"
    };

    let isGamePaused = false; // Trạng thái tạm dừng
    let gameStats = { // Thống kê trò chơi
        score: 0,
        bombHits: 0,
        iceHits: 0,
        flowersSkipped: 0,
        isGameOver: false
    };

    // Mô phỏng sự kiện click chuột
    function triggerMouseEvent(element, eventType) {
        const clickEvent = new MouseEvent(eventType, {
            view: window,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(clickEvent);
    }

    // Ghi đè hàm push của Array để tự động xử lý các element mới
    const originalPush = Array.prototype.push;
    Array.prototype.push = function (...items) {
        if (!isGamePaused) {
            items.forEach(item => handleGameElement(item));
        }
        return originalPush.apply(this, items);
    };

    // Xử lý element trong game
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

    // Xử lý khi hoa xuất hiện
    function processFlower(element) {
        if (Math.random() < (GAME_SETTINGS.flowerSkipPercentage / 100)) {
            gameStats.flowersSkipped++;
        } else {
            gameStats.score++;
            triggerMouseEvent(element, 'click'); // Click vào hoa
        }
    }

    // Xử lý khi bom xuất hiện
    function processBomb(element) {
        if (gameStats.bombHits < GAME_SETTINGS.minBombHits) {
            gameStats.score = 0;
            triggerMouseEvent(element, 'click'); // Click vào bom
            gameStats.bombHits++;
        }
    }

    // Xử lý khi băng xuất hiện
    function processIce(element) {
        if (gameStats.iceHits < GAME_SETTINGS.minIceHits) {
            triggerMouseEvent(element, 'click'); // Click vào băng
            gameStats.iceHits++;
        }
    }

    // Kiểm tra xem game đã kết thúc chưa
    function checkGameCompletion() {
        const rewardElement = document.querySelector('#app > div > div > div.content > div.reward');
        if (rewardElement && !gameStats.isGameOver) {
            gameStats.isGameOver = true;
            resetGameStats();
        }
    }

    // Reset thống kê game
    function resetGameStats() {
        gameStats = {
            score: 0,
            bombHits: 0,
            iceHits: 0,
            flowersSkipped: 0,
            isGameOver: false
        };
    }

    // Lấy độ trễ giữa các lần click mới
    function getNewGameDelay() {
        return Math.floor(Math.random() * (GAME_SETTINGS.maxDelayMs - GAME_SETTINGS.minDelayMs + 1) + GAME_SETTINGS.minDelayMs);
    }

    // Kiểm tra và click vào nút "Play/Continue"
    function checkAndClickPlayButton() {
        // Tìm tất cả các nút "Play" hoặc "Continue"
        const playButtons = document.querySelectorAll('button.kit-button.is-large.is-primary:not(.is-disabled), a.play-btn[href="/game"]');
        playButtons.forEach(button => {
            // Kiểm tra nếu nút chứa text "Play" hoặc "Continue" và không bị disabled
            if (!isGamePaused && GAME_SETTINGS.autoClickPlay && (/Play/i.test(button.textContent) || /Continue/i.test(button.textContent))) {
                setTimeout(() => {
                    triggerMouseEvent(button, 'click'); // Click vào nút
                    gameStats.isGameOver = false;
                }, getNewGameDelay());
            }
        });
    }

    // Liên tục kiểm tra nút "Play/Continue"
    function continuousPlayButtonCheck() {
        checkAndClickPlayButton();
        setTimeout(continuousPlayButtonCheck, 1000);
    }

    // Theo dõi sự thay đổi trên trang web để kiểm tra game kết thúc
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

    // --- Menu Cài đặt ---
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

    // Cập nhật menu cài đặt
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

    // Tạo element cài đặt
    settingsMenu.appendChild(createSettingElement('Flower Skip (%)', 'flowerSkipPercentage', 'range', 0, 100, 1,
        'Percentage probability of skipping a flower.'));
    settingsMenu.appendChild(createSettingElement('Min Freeze Hits', 'minIceHits', 'range', 1, 10, 1,
        'Minimum number of clicks per freeze.'));
    settingsMenu.appendChild(createSettingElement('Min Bomb Hits', 'minBombHits', 'range', 0, 10, 1,
        'Minimum number of clicks per bomb.'));
    settingsMenu.appendChild(createSettingElement('Min Delay (ms)', 'minDelayMs', 'range', 10, 10000, 10,
        'Minimum delay between clicks.'));
    settingsMenu.appendChild(createSettingElement('Max Delay (ms)', 'maxDelayMs', 'range', 10, 10000, 10,
        'Maximum delay between clicks.'));
    settingsMenu.appendChild(createSettingElement('Auto Click Play', 'autoClickPlay', 'checkbox', null, null, null,
        'Automatically start the next game at the end of.'));

    // Nút tạm dừng/tiếp tục
    const pauseResumeButton = document.createElement('button');
    pauseResumeButton.textContent = 'Pause';
    pauseResumeButton.className = 'pause-resume-btn';
    pauseResumeButton.onclick = toggleGamePause;
    settingsMenu.appendChild(pauseResumeButton);

    // --- Nút Mạng xã hội ---
    const socialButtons = document.createElement('div');
    socialButtons.className = 'social-buttons';

    const githubButton = document.createElement('a');
    githubButton.href = 'https://github.com/traique/Blum';
    githubButton.target = '_blank';
    githubButton.className = 'social-button';
    githubButton.innerHTML = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADtklEQVR4nO2ZSWgVQRCGP2OCS3CJYoy7uCtiDi6o8aAIikvQi4oGvCiiRo2E6FXJQdxQg4LgUTx4cyPuHhVRD0bcsyDu4IJrTNTnSEMNPOfNm1czb2YSJD8UDNNT1fV3V1dX90AH/l8UAEuBfUAt8Bj4CLSKmOdH0ma+WQL0pp2gC1AGXAJ+A5ZPMToXgFViK3Z0AyqBVwGcTycvga1A17hILAAaQiTglHpgfpQEzNTXREjAKcdl5kNFf+BOjCQskVtAYVgkhst0W20kT8WHrNBP0qjVxtIAFAUl0bWNwsnyCLNAKfpoO3DecsjhICnWy+B2CbspwA7gWRbOmd1+G1As1cGBDN/P05LoptgnBruEoSH0A7gKVACzgNFAvsgYebcROAN8BTYDnR22ihWLXxVilYpRTLf75mlHy+PbAYr+zUB5oouy7Ah9o0pCkaL/F5lmpUwZ1+MiJFKi9GGll5FLSiPLIyRSrvThfDoDBT5K8eoIiRxT+vAL6OlmYKnSwGdZkFFhPPBT6Uupm4H9SmWT56PGSaUve92Ua5XK02Igskzpy1k35afKuMyNgchYJRFT0KbgvULRfBMHhiiJvHNTblUomm86xUBkoiMKPor8cfjT4qZsZ4rZUu+MAPoAA+XZljiIJCNXtoYC6dtUFYOSBjYFn6TxJnAXaJRQeiPPtqwgehz2iIrvScvAzFIKnkjjNUmxWyRPm4p1khw37VGJGjnS11BggmTKRVI575a7MPsIkIKL0rhLqsuDwCngOlAns/FBpnN1xLPRIqPdBDwAbgPngCNyFtrvVaZUKzOFkW8yU2FjncuC9pKdbkbm+jBgpBlYE1KomZJ8j08SRua4GeuuTMFOuSFryXnS0yBfBqMxQL8tXucie504xZxT1soGlM7wW+AEsEFGaiTQK8l2XznHmOvQKikvvgYgYImYkiotSj1SXomcwd8qw65KbihtFMq75iyct5JkYaa015RGsU7apwJfMpAwpNOhJAQy9eKLJyo8DJhcbpcQFyU07J84z4ErwOJMHQDrsyRSrr3duBckLn0gx6MPK4Pc9VOBzwQSLkYSIe4fGwKQSADT/XZ0JI2xT3KxNlgTpx4YFYBITZCO8qTu8tNRZ5/2/di+7PMC8B/09BnLfqG1+yCMP8DDgIdtSOS+nBhDQQ+pNOMmciWKf/F5UmInYiCSAA5FfdExWc4HURGpA2YQE3IlBTc4fvj7xeskfWNrU0zXTSnIkbLldFL54gelorswyz2pAx0gIvwFLXDNiM6zHVAAAAAASUVORK5CYII=">GitHub';
    socialButtons.appendChild(githubButton);

    // ... (Nút Telegram và Donate) ...

    settingsMenu.appendChild(socialButtons);
    document.body.appendChild(settingsMenu);

    // --- Nút Cài đặt ---
    const settingsButton = document.createElement('button');
    settingsButton.className = 'settings-button';
    settingsButton.textContent = '⚙️';
    settingsButton.onclick = () => {
        settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
    };
    document.body.appendChild(settingsButton);

    // --- CSS Styles ---
    const style = document.createElement('style');
    style.textContent = `/* ... (CSS styles) ... */`;
    document.head.appendChild(style);

    // ... (Hàm createSettingElement) ...

    // Lưu cài đặt
    function saveSettings() {
        localStorage.setItem('BlumAutoclickerSettings', JSON.stringify(GAME_SETTINGS));
    }

    // Tải cài đặt
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

    // Tạm dừng/tiếp tục trò chơi
    function toggleGamePause() {
        isGamePaused = !isGamePaused;
        pauseResumeButton.textContent = isGamePaused ? 'Resume' : 'Pause';
        pauseResumeButton.style.backgroundColor = isGamePaused ? '#e5c07b' : '#98c379';
    }

    // --- Tự động Claim và Start --- 
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