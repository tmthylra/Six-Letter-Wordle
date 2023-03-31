const gameContainer = document.getElementById("game-container");
let wordList = [];
let gameState;
let targetWord = "";
let currentGuess;
let remainingGuesses = 7;

function getRandomWord() {
  const today = new Date();
  // seed ends up being YYYYMMDD
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
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

function handleGuess() {
  const squareInputs = document.querySelectorAll(".square-input");
  currentGuess = Array.from(squareInputs)
    .map((input) => input.value)
    .join("")
    .toLowerCase();

  if (currentGuess.length === 6) {
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

    gameState = JSON.parse(localStorage.getItem("slw_game_state"));

    const result = checkGuess(currentGuess, targetWord);
    gameState.currentGame.previousGuesses.push({ currentGuess, result });

    updateUI(currentGuess, result);
    remainingGuesses--;
    gameState.currentGame.remainingGuesses--;
    if (currentGuess === gameState.currentGame.targetWord ||
      gameState.currentGame.remainingGuesses === 1 ) 
      {
      gameContainer.innerHTML += `<p class="end-message">Nice Job! Come back tomorrow :)</p>`;
      // const endMessage = document.createElement("p");
      // endMessage.classList.add("end-message");
      // endMessage.innerHTML += `Game Over! The word was ${targetWord.toUpperCase()}`;
      const inputContainer = document.getElementById("input-container");
      inputContainer.classList.add("hidden");

      if (currentGuess === targetWord) {
        gameState.stats.previousWins++;
        gameState.stats.wins[7 - remainingGuesses]++;

        if (gameState.stats.streak > 0) {
          if (
            gameState.stats.previousWinDate ===
            gameState.currentGame.date - 1
          ) {
            gameState.stats.streak++;
            gameState.stats.previousWinDate = gameState.currentGame.date;
            if (gameState.stats.streak > gameState.stats.maxStreak)
              gameState.stats.maxStreak = gameState.stats.streak;
          }
        }
      }
      // squareInputs.forEach((input) => {
      //   console.log(input)
      //   input.classList.add("hidden")
      // });
    } else {
      squareInputs.forEach((input) => (input.value = ""));
      squareInputs[0].focus();
    }

    localStorage.setItem("slw_game_state", JSON.stringify(gameState));
  } else {
    alert("Please enter a 6-letter-word.");
  }
}

function initializeLocalStorage() {
  const today = new Date();
  const state = {
    stats: {
      previousWins: 0,
      previousWinDate: 0,
      streak: 0,
      maxStreak: 0,
      gamesPlayed: 1,
      wins: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
    },
    currentGame: {
      previousGuesses: [],
      remainingGuesses: 7,
      targetWord: "",
      date:
        today.getFullYear() * 10000 +
        (today.getMonth() + 1) * 100 +
        today.getDate(),
    },
  };
  localStorage.setItem("slw_game_state", JSON.stringify(state));
  return state;
}

function initGame() {
  const guessContainer = document.createElement("div");
  guessContainer.id = "guess-container";
  gameContainer.appendChild(guessContainer);

  const inputContainer = document.createElement("div");
  inputContainer.id = "input-container";
  gameContainer.appendChild(inputContainer);

  for (let i = 0; i < 6; i++) {
    const squareInput = document.createElement("input");
    squareInput.type = "text";
    squareInput.maxLength = 1;
    squareInput.classList.add("square-input");
    inputContainer.appendChild(squareInput);

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
  }

  const squareInputs = document.querySelectorAll(".square-input");
  squareInputs[0].focus();

  // Local storage
  gameState = JSON.parse(localStorage.getItem("slw_game_state"));
  console.log(gameState);
  if (!gameState) {
    data = initializeLocalStorage();
    console.log("initialized a fresh storage");
  }

  console.log(gameState);

  remainingGuesses = gameState.currentGame.remainingGuesses;
  //if the target word based on today's seed is wrong the game state is most likely stale.
  if (targetWord != gameState.currentGame.targetWord) {
    //reset the current game
    // currentGame: {
    //   previousGuesses: [],
    //   remainingGuesses: 7,
    //   targetWord: "",
    //   date: today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate(),
    // }
    gameState.currentGame.previousGuesses = [];
    gameState.currentGame.remainingGuesses = 7;
    gameState.currentGame.targetWord = targetWord;
    const today = new Date();
    gameState.currentGame.date = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  }
  localStorage.setItem("slw_game_state", JSON.stringify(gameState));

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

// Initialize the game
fetch("./words.json")
  .then((res) => res.json())
  .then((data) => {
    wordList = data;
    targetWord = getRandomWord();
    console.log(targetWord);
    initGame();
  })
  .catch((err) => console.log(err));
