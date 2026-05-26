const videoElement = document.getElementById("video");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");

const repCountElement = document.getElementById("repCount");
const startBtn = document.getElementById("startBtn");

let repCount = 0;

// Pull-up state
let isUp = false;

function calculatePullup(landmarks) {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const nose = landmarks[0];

  // Average shoulder height
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;

  /*
    Smaller Y = higher on screen
    Detect when shoulders rise close to nose level
  */

  // UP position
  if (shoulderY < nose.y + 0.12 && !isUp) {
    isUp = true;
  }

  // DOWN position
  if (shoulderY > nose.y + 0.22 && isUp) {
    repCount++;
    repCountElement.innerText = repCount;
    isUp = false;
  }
}

function onResults(results) {
  canvasCtx.save();

  canvasCtx.clearRect(
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  if (results.poseLandmarks) {

    // Draw skeleton
    drawConnectors(
      canvasCtx,
      results.poseLandmarks,
      POSE_CONNECTIONS,
      { color: "#00FF00", lineWidth: 4 }
    );

    drawLandmarks(
      canvasCtx,
      results.poseLandmarks,
      { color: "#FF0000", lineWidth: 2 }
    );

    calculatePullup(results.poseLandmarks);
  }

  canvasCtx.restore();
}

const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
  }
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

pose.onResults(onResults);

startBtn.addEventListener("click", async () => {

  const stream = await navigator.mediaDevices.getUserMedia({
    video: true
  });

  videoElement.srcObject = stream;

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await pose.send({ image: videoElement });
    },
    width: 640,
    height: 480
  });

  camera.start();
});