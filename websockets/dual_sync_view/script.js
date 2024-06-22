document
  .getElementById("fileInput")
  .addEventListener("change", handleFileSelect, false);

const leftCanvas = document.getElementById("leftCanvas");
const rightCanvas = document.getElementById("rightCanvas");
const leftContext = leftCanvas.getContext("2d");
const rightContext = rightCanvas.getContext("2d");

let videoElement = null;
let sendSocket = null;
let receiveSocket = null;

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    if (videoElement) {
      videoElement.pause();
      URL.revokeObjectURL(videoElement.src);
    } else {
      videoElement = document.createElement("video");
      videoElement.addEventListener("loadedmetadata", () => {
        const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
        adjustCanvasSize(aspectRatio);
      });
      videoElement.addEventListener("play", () => {
        sendFrame();
        drawFrame(leftContext, videoElement, leftCanvas);
      });
    }
    videoElement.src = url;
    videoElement.play();
    console.log("Video file selected and playing");
  }
}

function adjustCanvasSize(aspectRatio) {
  const maxWidth = window.innerWidth / 2 - 20; // Half the window width minus some padding
  const maxHeight = window.innerHeight - 100; // Almost the full window height minus some padding

  let width, height;

  if (aspectRatio > 1) {
    // Width > Height
    width = maxWidth;
    height = maxWidth / aspectRatio;
  } else {
    // Height >= Width
    height = maxHeight;
    width = maxHeight * aspectRatio;
  }

  leftCanvas.width = rightCanvas.width = width;
  leftCanvas.height = rightCanvas.height = height;
}

function drawFrame(context, video, canvas) {
  if (video.paused || video.ended) {
    return;
  }
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  requestAnimationFrame(() => drawFrame(context, video, canvas));
}

function sendFrame() {
  if (videoElement.paused || videoElement.ended) {
    return;
  }
  leftCanvas.toBlob((blob) => {
    if (sendSocket && sendSocket.readyState === WebSocket.OPEN) {
      sendSocket.send(blob);
      console.log("Frame sent to WebSocket server");
    }
  }, "image/jpeg");

  setTimeout(sendFrame, 1000 / 5); // Sending frames at approximately 30 FPS
}

function setupSendSocket() {
  sendSocket = new WebSocket("ws://localhost:8765");
  sendSocket.onopen = function () {
    console.log("WebSocket send connection established");
    sendSocket.send("sender"); // Identify as sender
  };
  sendSocket.onerror = function (error) {
    console.log("WebSocket send error:", error);
  };
  sendSocket.onclose = function () {
    console.log("WebSocket send connection closed, retrying in 3 seconds...");
    setTimeout(setupSendSocket, 3000); // Retry connection after 3 seconds
  };
}

function setupReceiveSocket() {
  receiveSocket = new WebSocket("ws://localhost:8765");
  receiveSocket.onopen = function () {
    console.log("WebSocket receive connection established");
    receiveSocket.send("receiver"); // Identify as receiver
  };
  receiveSocket.onmessage = function (event) {
    const blob = new Blob([event.data], { type: "image/jpeg" });
    const img = new Image();
    img.onload = function () {
      rightContext.drawImage(img, 0, 0, rightCanvas.width, rightCanvas.height);
      URL.revokeObjectURL(img.src);
      console.log("Frame received and drawn on right canvas");
    };
    img.src = URL.createObjectURL(blob);
  };
  receiveSocket.onerror = function (error) {
    console.log("WebSocket receive error:", error);
  };
  receiveSocket.onclose = function () {
    console.log(
      "WebSocket receive connection closed, retrying in 3 seconds..."
    );
    setTimeout(setupReceiveSocket, 3000); // Retry connection after 3 seconds
  };
}

setupSendSocket();
setupReceiveSocket();
