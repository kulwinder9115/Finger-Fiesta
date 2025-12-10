const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
canvas.width = 640;
canvas.height = 480;

const video = document.createElement("video");
video.width = 640;
video.height = 480;
video.autoplay = true;

let model;
let score = 0;
let gameStarted = false;
let gameOver = false;

const scoreEl = document.getElementById("score");
const finalScoreEl = document.getElementById("final-score");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");

const objects = [];
let spawnInterval;

// Start webcam
async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: false
    });
    video.srcObject = stream;

    video.onloadeddata = async () => {
      model = await handpose.load();
      console.log("Handpose loaded");
      requestAnimationFrame(loop);
    };
  } catch (err) {
    console.error(err);
    alert("Cannot access webcam");
  }
}

// Spawn objects
function spawnObject() {
  if (!gameStarted) return;
  if (objects.length < 3) {
    objects.push({
      x: Math.random() * (canvas.width - 30) + 15,
      y: -20,
      radius: 15,
      color: "yellow",
      speed: 3 + Math.random() * 2
    });
  }
}

// Start game
function startGame() {
  score = 0;
  scoreEl.innerText = score;
  objects.length = 0;
  gameStarted = true;
  gameOver = false;
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  spawnInterval = setInterval(spawnObject, 1000);
}

// Restart game
function restartGame() {
  startGame();
}

// Game loop
async function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  let handLandmarks = [];

  if (model && gameStarted) {
    const predictions = await model.estimateHands(video, true);

    predictions.forEach(hand => {
      handLandmarks = handLandmarks.concat(hand.landmarks);

      // Draw red dots
      hand.landmarks.forEach(([x, y]) => {
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  // Update objects and check collisions
  objects.forEach((obj, index) => {
    obj.y += obj.speed;

    // Draw object
    ctx.fillStyle = obj.color;
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
    ctx.fill();

    // Collision with any red dot
    for (let i = 0; i < handLandmarks.length; i++) {
      const [hx, hy] = handLandmarks[i];
      const dx = obj.x - hx;
      const dy = obj.y - hy;
      if (Math.sqrt(dx*dx + dy*dy) < obj.radius + 7) {
        objects.splice(index, 1);
        score++;
        scoreEl.innerText = score;
        break;
      }
    }

    // Missed object = game over
    if (obj.y > canvas.height + 20) {
      objects.splice(index, 1);
      gameOver = true;
      gameStarted = false;
      clearInterval(spawnInterval);
      finalScoreEl.innerText = score;
      gameOverScreen.classList.remove("hidden");
    }
  });

  requestAnimationFrame(loop);
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);

startWebcam();
