// Game Configuration
const CONFIG = {
    timeMode: 60, // 60 seconds
    wordsMode: 30, // 30 words
    difficulty: {
        easy: { minLength: 3, maxLength: 5, wordsPerLine: 8 },
        medium: { minLength: 4, maxLength: 7, wordsPerLine: 10 },
        hard: { minLength: 5, maxLength: 9, wordsPerLine: 12 },
        expert: { minLength: 6, maxLength: 12, wordsPerLine: 14 }
    },
    wordLists: {
        common: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I'],
        programming: ['function', 'variable', 'console', 'log', 'const', 'let', 'return', 'async', 'await', 'promise'],
        quotes: [
            'The only way to do great work is to love what you do.',
            'Innovation distinguishes between a leader and a follower.',
            'Your time is limited, so don\'t waste it living someone else\'s life.'
        ]
    }
};

// Game State
let gameState = {
    isPlaying: false,
    currentMode: 'time',
    currentDifficulty: 'easy',
    words: [],
    currentWordIndex: 0,
    correctChars: 0,
    incorrectChars: 0,
    startTime: null,
    timerInterval: null,
    timeLeft: 60,
    totalWords: 0,
    completedWords: 0
};

// DOM Elements
const typingInput = document.getElementById('typing-input');
const textDisplay = document.getElementById('text-display');
const timeDisplay = document.getElementById('time');
const currentWPM = document.getElementById('current-wpm');
const currentAccuracy = document.getElementById('current-accuracy');
const progressBar = document.getElementById('progress-bar');
const resultsPanel = document.getElementById('results-panel');
const restartBtn = document.getElementById('restart-btn');
const modeButtons = document.querySelectorAll('.mode-btn');
const diffButtons = document.querySelectorAll('.diff-btn');
const highScoreEl = document.getElementById('high-score');
const highAccuracyEl = document.getElementById('high-accuracy');
const streakEl = document.getElementById('streak');

// Initialize Game
function initGame() {
    loadStats();
    generateWords();
    updateDisplay();
    setupEventListeners();
    typingInput.focus();
}

// Generate words based on difficulty and mode
function generateWords() {
    const diff = CONFIG.difficulty[gameState.currentDifficulty];
    let wordCount = gameState.currentMode === 'words' ? CONFIG.wordsMode : 100;
    
    gameState.words = [];
    
    if (gameState.currentMode === 'quotes') {
        // For quotes mode, use full quotes
        const quote = CONFIG.wordLists.quotes[Math.floor(Math.random() * CONFIG.wordLists.quotes.length)];
        gameState.words = quote.split(' ').map(word => ({ text: word, status: 'pending' }));
    } else if (gameState.currentMode === 'code') {
        // For code mode, use programming words
        for (let i = 0; i < wordCount; i++) {
            const word = CONFIG.wordLists.programming[
                Math.floor(Math.random() * CONFIG.wordLists.programming.length)
            ];
            gameState.words.push({ text: word, status: 'pending' });
        }
    } else {
        // For normal mode, generate random words
        for (let i = 0; i < wordCount; i++) {
            const length = Math.floor(Math.random() * 
                (diff.maxLength - diff.minLength + 1)) + diff.minLength;
            gameState.words.push({ 
                text: generateRandomWord(length), 
                status: 'pending' 
            });
        }
    }
    
    gameState.currentWordIndex = 0;
    gameState.totalWords = gameState.words.length;
    gameState.completedWords = 0;
}

// Generate random word
function generateRandomWord(length) {
    const vowels = 'aeiou';
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    let word = '';
    
    for (let i = 0; i < length; i++) {
        if (i % 2 === 0) {
            word += consonants[Math.floor(Math.random() * consonants.length)];
        } else {
            word += vowels[Math.floor(Math.random() * vowels.length)];
        }
    }
    
    return word;
}

// Update word display
function updateDisplay() {
    textDisplay.innerHTML = '';
    const diff = CONFIG.difficulty[gameState.currentDifficulty];
    
    gameState.words.forEach((word, index) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = `word ${word.status} ${index === gameState.currentWordIndex ? 'current' : ''}`;
        wordSpan.textContent = word.text;
        textDisplay.appendChild(wordSpan);
    });
    
    updateProgress();
}

// Update progress bar
function updateProgress() {
    const progress = (gameState.completedWords / gameState.totalWords) * 100;
    progressBar.style.width = `${progress}%`;
}

// Start the game
function startGame() {
    if (gameState.isPlaying) return;
    
    gameState.isPlaying = true;
    gameState.startTime = Date.now();
    gameState.correctChars = 0;
    gameState.incorrectChars = 0;
    gameState.timeLeft = gameState.currentMode === 'time' ? CONFIG.timeMode : Infinity;
    gameState.completedWords = 0;
    
    typingInput.value = '';
    typingInput.disabled = false;
    typingInput.focus();
    
    if (gameState.currentMode === 'time') {
        startTimer();
    }
    
    updateStats();
}

// Start timer for time mode
function startTimer() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    
    timeDisplay.textContent = gameState.timeLeft;
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        timeDisplay.textContent = gameState.timeLeft;
        
        updateStats();
        
        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

// Update real-time stats
function updateStats() {
    if (!gameState.startTime) return;
    
    const elapsedTime = (Date.now() - gameState.startTime) / 1000; // in seconds
    const minutes = elapsedTime / 60;
    
    // Calculate WPM
    const wordsTyped = gameState.correctChars / 5; // Average word = 5 chars
    const wpm = minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
    currentWPM.textContent = wpm;
    
    // Calculate accuracy
    const totalChars = gameState.correctChars + gameState.incorrectChars;
    const accuracy = totalChars > 0 ? 
        Math.round((gameState.correctChars / totalChars) * 100) : 100;
    currentAccuracy.textContent = accuracy;
}

// Handle typing input
function handleInput() {
    if (!gameState.isPlaying) {
        startGame();
    }
    
    const input = typingInput.value;
    const currentWord = gameState.words[gameState.currentWordIndex];
    
    if (!currentWord) return;
    
    // Play key sound (optional)
    playKeySound();
    
    // Check if word is complete (space pressed)
    if (input.endsWith(' ')) {
        const typedWord = input.trim();
        
        if (typedWord === currentWord.text) {
            // Correct word
            currentWord.status = 'correct';
            gameState.correctChars += currentWord.text.length;
        } else {
            // Incorrect word
            currentWord.status = 'incorrect';
            gameState.incorrectChars += Math.max(typedWord.length, currentWord.text.length);
        }
        
        gameState.currentWordIndex++;
        gameState.completedWords++;
        typingInput.value = '';
        
        // Check if game is complete
        if (gameState.currentWordIndex >= gameState.words.length || 
            (gameState.currentMode === 'words' && gameState.completedWords >= CONFIG.wordsMode)) {
            endGame();
        }
        
        updateDisplay();
        scrollToCurrentWord();
    }
    
    updateStats();
}

// End the game
function endGame() {
    gameState.isPlaying = false;
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    typingInput.disabled = true;
    
    // Calculate final stats
    const elapsedTime = (Date.now() - gameState.startTime) / 1000;
    const minutes = elapsedTime / 60;
    const wordsTyped = gameState.correctChars / 5;
    const wpm = minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
    const totalChars = gameState.correctChars + gameState.incorrectChars;
    const accuracy = totalChars > 0 ? 
        Math.round((gameState.correctChars / totalChars) * 100) : 100;
    const score = Math.round(wpm * accuracy / 100);
    
    // Play completion sound
    playCompleteSound();
    
    // Update results panel
    document.getElementById('result-wpm').textContent = wpm;
    document.getElementById('result-accuracy').textContent = accuracy + '%';
    document.getElementById('result-time').textContent = Math.round(elapsedTime);
    document.getElementById('result-score').textContent = score;
    
    // Show results
    resultsPanel.style.display = 'block';
    
    // Update high scores
    updateHighScores(wpm, accuracy);
    
    // Save stats
    saveStats();
}

// Update high scores
function updateHighScores(wpm, accuracy) {
    const highScore = parseInt(localStorage.getItem('highScore') || '0');
    const highAccuracy = parseInt(localStorage.getItem('highAccuracy') || '0');
    const streak = parseInt(localStorage.getItem('streak') || '0');
    
    if (wpm > highScore) {
        localStorage.setItem('highScore', wpm);
        highScoreEl.textContent = wpm;
    }
    
    if (accuracy > highAccuracy) {
        localStorage.setItem('highAccuracy', accuracy);
        highAccuracyEl.textContent = accuracy;
    }
    
    // Update streak
    const newStreak = streak + 1;
    localStorage.setItem('streak', newStreak);
    streakEl.textContent = newStreak;
}

// Load stats from localStorage
function loadStats() {
    highScoreEl.textContent = localStorage.getItem('highScore') || '0';
    highAccuracyEl.textContent = localStorage.getItem('highAccuracy') || '0';
    streakEl.textContent = localStorage.getItem('streak') || '0';
}

// Save stats to localStorage
function saveStats() {
    // Stats are auto-saved in updateHighScores
}

// Restart game
function restartGame() {
    resultsPanel.style.display = 'none';
    generateWords();
    updateDisplay();
    gameState.isPlaying = false;
    typingInput.disabled = false;
    typingInput.value = '';
    typingInput.focus();
    
    if (gameState.currentMode === 'time') {
        timeDisplay.textContent = CONFIG.timeMode;
    }
    
    currentWPM.textContent = '0';
    currentAccuracy.textContent = '100';
    progressBar.style.width = '0%';
}

// Change game mode
function changeMode(mode) {
    gameState.currentMode = mode;
    modeButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    restartGame();
}

// Change difficulty
function changeDifficulty(diff) {
    gameState.currentDifficulty = diff;
    diffButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    restartGame();
}

// Scroll to current word
function scrollToCurrentWord() {
    const currentWordElement = document.querySelector('.word.current');
    if (currentWordElement) {
        currentWordElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
    }
}

// Sound functions (optional)
function playKeySound() {
    const sound = document.getElementById('key-sound');
    sound.currentTime = 0;
    sound.play().catch(e => console.log("Audio play failed:", e));
}

function playCompleteSound() {
    const sound = document.getElementById('complete-sound');
    sound.currentTime = 0;
    sound.play().catch(e => console.log("Audio play failed:", e));
}

// Setup event listeners
function setupEventListeners() {
    typingInput.addEventListener('input', handleInput);
    restartBtn.addEventListener('click', restartGame);
    
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => changeMode(btn.dataset.mode));
    });
    
    diffButtons.forEach(btn => {
        btn.addEventListener('click', () => changeDifficulty(btn.dataset.diff));
    });
    
    document.getElementById('play-again-btn').addEventListener('click', restartGame);
    document.getElementById('share-btn').addEventListener('click', shareScore);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            restartGame();
        }
        
        if (e.key === 'Escape') {
            typingInput.focus();
        }
    });
}

// Share score function
function shareScore() {
    const wpm = document.getElementById('result-wpm').textContent;
    const accuracy = document.getElementById('result-accuracy').textContent;
    
    const text = `I just typed at ${wpm} WPM with ${accuracy} accuracy on TypeMaster Pro! 🚀`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Typing Score',
            text: text,
            url: window.location.href
        });
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(text).then(() => {
            alert('Score copied to clipboard!');
        });
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initGame);
