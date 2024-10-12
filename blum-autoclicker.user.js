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

    let flowerSkipPercentage = 50;
    let minIceHits = 1;
    let minBombHits = 1;
    let minDelayMs = 50;
    let maxDelayMs = 150;
    let autoClickPlay = true;
    let bombHits = 0;
    let iceHits = 0;

    // Thêm biến để theo dõi số lần nhấp vào chó
    let dogHits = 0;
    // Thêm cài đặt cho số lần nhấp tối đa vào chó
    let maxDogHits = 5;

    localStorage.getItem("flowerSkipPercentage") ? flowerSkipPercentage = parseInt(localStorage.getItem("flowerSkipPercentage")) : localStorage.setItem("flowerSkipPercentage", flowerSkipPercentage);
    localStorage.getItem("minIceHits") ? minIceHits = parseInt(localStorage.getItem("minIceHits")) : localStorage.setItem("minIceHits", minIceHits);
    localStorage.getItem("minBombHits") ? minBombHits = parseInt(localStorage.getItem("minBombHits")) : localStorage.setItem("minBombHits", minBombHits);
    localStorage.getItem("minDelayMs") ? minDelayMs = parseInt(localStorage.getItem("minDelayMs")) : localStorage.setItem("minDelayMs", minDelayMs);
    localStorage.getItem("maxDelayMs") ? maxDelayMs = parseInt(localStorage.getItem("maxDelayMs")) : localStorage.setItem("maxDelayMs", maxDelayMs);
    localStorage.getItem("autoClickPlay") ? autoClickPlay = localStorage.getItem("autoClickPlay") === 'true' : localStorage.setItem("autoClickPlay", autoClickPlay);
    localStorage.getItem("maxDogHits") ? maxDogHits = parseInt(localStorage.getItem("maxDogHits")) : localStorage.setItem("maxDogHits", maxDogHits); // Lưu giá trị maxDogHits vào localStorage

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
            case "DOG": // Thêm case "DOG" để xử lý biểu tượng chó
                processDog(element);
                break;
        }
    }

    function processFlower(element) {
        if (Math.random() * 100 > flowerSkipPercentage) {
            clickElement(element);
        }
    }

    function processBomb(element) {
        if (bombHits < minBombHits) {
            clickElement(element);
            bombHits++;
        }
    }

    function processIce(element) {
        if (iceHits < minIceHits) {
            clickElement(element);
            iceHits++;
        }
    }

    // Hàm xử lý biểu tượng chó
    function processDog(element) {
        if (dogHits < maxDogHits) {
            clickElement(element);
            dogHits++;
        }
    }

    function clickElement(element) {
        if (element && element.element) {
            setTimeout(() => {
                element.element.click();
            }, minDelayMs + Math.random() * (maxDelayMs - minDelayMs));
        }
    }

    const originalPush = Array.prototype.push;
    Array.prototype.push = function(...args) {
        const element = args[0];
        handleGameElement(element);
        return originalPush.apply(this, args);
    };

    function checkGameCompletion() {
        const rewardElement = document.querySelector('.reward');
        if (rewardElement) {
            resetGameStats();

            if (autoClickPlay) {
                checkAndClickPlayButton();
            }
        }
    }

    function resetGameStats() {
        bombHits = 0;
        iceHits = 0;
        dogHits = 0; // Đặt lại số lần nhấp vào chó khi trò chơi kết thúc
    }

    function checkAndClickPlayButton() {
        const playButton = document.querySelector('[data-testid="play-button"]');
        if (playButton) {
            setTimeout(() => {
                playButton.click();
            }, 1000); // Chờ 1 giây trước khi nhấp vào nút "Play"
        }
    }

    const observer = new MutationObserver(checkGameCompletion);
    observer.observe(document.body, { childList: true, subtree: true });

    checkAndClickPlayButton();

    // Tạo menu cài đặt
    const settingsButton = document.createElement("button");
    settingsButton.textContent = "Cài đặt Blum Auto Clicker";
    settingsButton.style.position = "fixed";
    settingsButton.style.top = "10px";
    settingsButton.style.left = "10px";
    settingsButton.style.zIndex = "9999";
    document.body.appendChild(settingsButton);

    settingsButton.addEventListener("click", () => {
        flowerSkipPercentage = parseInt(prompt("Tỷ lệ bỏ qua hoa (%):", flowerSkipPercentage));
        minIceHits = parseInt(prompt("Số lần nhấp tối thiểu vào đá:", minIceHits));
        minBombHits = parseInt(prompt("Số lần nhấp tối thiểu vào bom:", minBombHits));
        maxDogHits = parseInt(prompt("Số lần nhấp tối đa vào chó:", maxDogHits)); // Thêm prompt cho maxDogHits
        minDelayMs = parseInt(prompt("Độ trễ tối thiểu (ms):", minDelayMs));
        maxDelayMs = parseInt(prompt("Độ trễ tối đa (ms):", maxDelayMs));
        autoClickPlay = confirm("Tự động nhấp vào nút Play?");

        localStorage.setItem("flowerSkipPercentage", flowerSkipPercentage);
        localStorage.setItem("minIceHits", minIceHits);
        localStorage.setItem("minBombHits", minBombHits);
        localStorage.setItem("maxDogHits", maxDogHits); // Lưu giá trị maxDogHits vào localStorage
        localStorage.setItem("minDelayMs", minDelayMs);
        localStorage.setItem("maxDelayMs", maxDelayMs);
        localStorage.setItem("autoClickPlay", autoClickPlay);
    });
})();