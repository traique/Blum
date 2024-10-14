// ==UserScript==
// @name         Blum Autoclicker
// @version      1.0
// @namespace    Violentmonkey Scripts
// @author       Traique
// @match        https://telegram.blum.codes/*
// @grant        none
// @icon         https://imgur.com/a/IyF61ni
// @downloadURL  https://github.com/traique/Blum/raw/main/blum-autoclicker.user.js
// @updateURL    https://github.com/traique/Blum/raw/main/blum-autoclicker.user.js
// @homepage     https://github.com/traique/Blum
// ==/UserScript==

(function() {
    'use strict';

    let GAME_SETTINGS = {
        minBombHits: Math.floor(Math.random() * 2),
        minIceHits: Math.floor(Math.random() * 2) + 2,
        flowerSkipPercentage: Math.floor(Math.random() * 11) + 5,
        dogSkipPercentage: Math.floor(Math.random() * 11) + 2,
        minDelayMs: 2000,
        maxDelayMs: 5000,
        autoClickPlay: true
    };

    let isGamePaused = false;

    function handleGameElement(element) {
        if (!element || !element.item) return;

        const { type } = element.item;
        switch (type) {
            case "CLOVER":
                processFlower(element);
                break;
            case "BOMB":
                processBomb(element);
                break;
            case "FREEZE":
                processIce(element);
                break;
            case "DOG":
                processDog(element);
                break;
        }
    }

    function processFlower(element) {
        const shouldSkip = Math.random() < (GAME_SETTINGS.flowerSkipPercentage / 100);
        if (!shouldSkip) {
            clickElement(element);
        }
    }

    function processDog(element) {
        const shouldSkip = Math.random() < (GAME_SETTINGS.dogSkipPercentage / 100);
        if (!shouldSkip) {
            clickElement(element);
        }
    }

    function processBomb(element) {
        if (Math.random() < 0.5) {
            clickElement(element);
        }
    }

    function processIce(element) {
        if (Math.random() < 0.7) {
            clickElement(element);
        }
    }

    function clickElement(element) {
        if (element && element.onClick && typeof element.onClick === 'function') {
            element.onClick(element);
        }
    }

    function getNewGameDelay() {
        return Math.floor(Math.random() * (GAME_SETTINGS.maxDelayMs - GAME_SETTINGS.minDelayMs + 1) + GAME_SETTINGS.minDelayMs);
    }

    function checkAndClickPlayButton() {
        const playButtons = document.querySelectorAll('button.kit-button.is-large.is-primary, a.play-btn[href="/game"], button.kit-button.is-large.is-primary');

        playButtons.forEach(button => {
            if (!isGamePaused && GAME_SETTINGS.autoClickPlay && (/Play/.test(button.textContent) || /Continue/.test(button.textContent))) {
                setTimeout(() => {
                    button.click();
                }, getNewGameDelay());
            }
        });
    }

    function continuousPlayButtonCheck() {
        checkAndClickPlayButton();
        setTimeout(continuousPlayButtonCheck, 1000);
    }

    function AutoClaimAndStart() {
        setInterval(() => {
            const claimButton = document.querySelector('button.kit-button.is-large.is-drop.is-fill.button.is-done');
            const startFarmingButton = document.querySelector('button.kit-button.is-large.is-primary.is-fill.button');
            const continueButton = document.querySelector('button.kit-button.is-large.is-primary.is-fill.btn');
            if (claimButton) {
                claimButton.click();
            } else if (startFarmingButton) {
                startFarmingButton.click();
            } else if (continueButton) {
                continueButton.click();
            }
        }, Math.floor(Math.random() * 5000) + 5000);
    }

    function initializeGame() {
        const originalPush = Array.prototype.push;
        Array.prototype.push = function (...items) {
            if (!isGamePaused) {
                items.forEach(item => handleGameElement(item));
            }
            return originalPush.apply(this, items);
        };

        continuousPlayButtonCheck();
        AutoClaimAndStart();
    }

    // Khởi tạo trò chơi
    initializeGame();

    // Thêm giao diện cài đặt (có thể thêm vào đây nếu cần)
})();
