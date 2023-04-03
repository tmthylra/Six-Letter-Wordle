const gameContainer = document.getElementById("game-container");
let wordList = [];
let gameState;
let targetWord = "";
let currentGuess;
let remainingGuesses;

function getTodayDate() {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

function createSquareInput() {
  const squareInput = document.createElement("input");
  squareInput.type = "text";
  squareInput.maxLength = 1;
  squareInput.classList.add("square-input");

  squareInput.addEventListener("input", (event) => {
    event.target.value = event.target.value.toUpperCase();
    if (event.target.nextSibling) {
      event.target.nextSibling.focus();
    }
  });

  squareInput.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && event.target.previousSibling) {
      if (!event.target.nextSibling && event.target.value != "") {
        event.target.value = "";
      } else {
        event.target.previousSibling.value = "";
        event.target.previousSibling.focus();
      }
    }
  });

  squareInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      handleGuess();
    }
  });

  return squareInput;
}

function getRandomWord() {
  // seed ends up being YYYYMMDD
  const seed = getTodayDate();
  const rng = new Math.seedrandom(seed);
  return wordList[Math.floor(rng() * wordList.length)];
}

function checkGuess(guess, target) {
  const result = [];
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === target[i]) result.push("correct");
    else if (target.includes(guess[i])) result.push("partially-correct");
    else result.push("incorrect");
  }
  return result;
}

function updateUI(guess, result) {
  const guessRow = document.createElement("div");
  guessRow.classList.add("guess-row");

  for (let i = 0; i < guess.length; i++) {
    const tile = document.createElement("div");
    tile.classList.add("tile");
    tile.textContent = guess[i].toUpperCase();

    if (result[i] === "correct") {
      tile.classList.add("correct");
    } else if (result[i] === "partially-correct")
      tile.classList.add("partially-correct");

    guessRow.appendChild(tile);
  }
  const guessContainer = document.getElementById("guess-container");
  guessContainer.appendChild(guessRow);
}

function hideInputs() {
  const inputContainer = document.getElementById("input-container");
  inputContainer.classList.add("hidden");
}

function handleGuess() {
  const squareInputs = document.querySelectorAll(".square-input");
  currentGuess = Array.from(squareInputs)
    .map((input) => input.value)
    .join("")
    .toLowerCase();

  if (currentGuess.length === 6) {
    // Wrong guess
    if (!wordList.includes(currentGuess)) {
      console.log("invalid word");
      squareInputs.forEach((input) => (input.value = ""));
      squareInputs[0].focus();

      Toastify({
        text: "Not in word list.",
        duration: 1000,
        destination: "#",
        newWindow: true,
        close: false,
        gravity: "top", // `top` or `bottom`
        position: "center", // `left`, `center` or `right`
        stopOnFocus: false, // Prevents dismissing of toast on hover
        style: {
          background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
        onClick: function () {}, // Callback after click
      }).showToast();
      return;
    }

    gameState = loadGameState();

    const result = checkGuess(currentGuess, targetWord);

    gameState.currentGame.previousGuesses.push({ currentGuess, result });

    updateUI(currentGuess, result);

    remainingGuesses--;
    gameState.currentGame.remainingGuesses--;

    // Match
    if (currentGuess === gameState.currentGame.targetWord) {
      gameContainer.innerHTML += `<p class="end-message">Nice Job! Come back tomorrow :)</p>`;
      hideInputs();

      gameState.stats.previousWins++;
      gameState.stats.wins[7 - remainingGuesses]++;
      gameState.stats.previousWinDate = getTodayDate();
      if(gameState.stats.streak > 0) {
        if (gameState.stats.previousWinDate === gameState.currentGame.date - 1) {
          gameState.stats.streak += 1;
          if (gameState.stats.streak > gameState.stats.maxStreak)
            gameState.stats.maxStreak = gameState.stats.streak;
        }
      } else {
        gameState.stats.streak = 1;
      }
      
    } else if (gameState.currentGame.remainingGuesses === 0) {
      // Out of guesses
      gameContainer.innerHTML += `<p class="end-message">Come back tomorrow :)</p>`;
      hideInputs();
    } else {
      // Continue guessing
      squareInputs.forEach((input) => (input.value = ""));
      squareInputs[0].focus();
    }
    saveGameState(gameState)
  } else {
    alert("Please enter a 6-letter-word.");
  }
}

function saveGameState(gameState) {
  localStorage.setItem("slw_game_state", JSON.stringify(gameState));
}

function loadGameState() {
  const defaultGameState = {
    stats: {
      previousWins: 0,
      previousWinDate: 0,
      streak: 0,
      gamesPlayed: 1,
      wins: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
    },
    currentGame: {
      targetWord: targetWord,
      previousGuesses: [],
      remainingGuesses: 7,
      date: getTodayDate()
    }
  };

  const storedGameState = JSON.parse(localStorage.getItem("slw_game_state"));

  if (!storedGameState) {
    return defaultGameState;
  }

  const gameState = {
    ...defaultGameState,
    ...storedGameState,
    currentGame: {
      ...defaultGameState.currentGame,
      ...storedGameState.currentGame
    }
  };

  if (getTodayDate() !== gameState.currentGame.date) {
    gameState = {
      stats: {
        ...gameState.stats,
        gamesPlayed: gameState.stats.gamesPlayed + 1,
      },
      currentGame: {
        ...gameState.currentGame,
        targetWord: targetWord,
        previousGuesses: [],
        remainingGuesses: 7,
        date: getTodayDate()
      }
    };
  }

  return gameState;
}

function initGame() {
  const guessContainer = document.getElementById("guess-container");
  const inputContainer = document.getElementById("input-container");

  for (let i = 0; i < 6; i++) {
    const squareInput = createSquareInput(i);
    inputContainer.appendChild(squareInput);
  }

  const squareInputs = document.querySelectorAll(".square-input");
  squareInputs[0].focus();

  // Local storage
  gameState = loadGameState();

  console.log(gameState);

  remainingGuesses = gameState.currentGame.remainingGuesses;

  saveGameState(gameState);

  // Restore the game board
  if(gameState.currentGame.previousGuesses.length > 0){
    for (let x = 0; x < gameState.currentGame.previousGuesses.length; x++) {
      const guess = gameState.currentGame.previousGuesses[x];
      updateUI(guess.currentGuess, guess.result);
      if (gameState.currentGame.previousGuesses[x].currentGuess === targetWord) {
        const inputContainer = document.getElementById("input-container");
        inputContainer.classList.add("hidden");
        gameContainer.innerHTML += `<p class="end-message">Nice Job! Come back tomorrow :)</p>`;
      }
    }
  }

}

async function loadWords() {
  try {
    const response = await fetch("./words.json");
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function startGame() {
  wordList = await loadWords();

  if (wordList.length > 0) {
    targetWord = getRandomWord();
    console.log(targetWord);
    initGame();
  } else {
    console.error("Failed to load words.json unable to start the game.");
  }
}

startGame();