let canvas;
let ctx;
let chickens = [];
let availableChickens = [];
let raceStarted = false;
let raceFinished = false;
let raceHistory = [];
let leaderboardData = [];
let globalTime = 0;
let replayData = [];
let stopReplay = false;
let cheeringSound = new Audio('https://rektgang.mypinata.cloud/ipfs/QmVPzhKmpADgcVj92bASXzTfTA8JzuF2hUFud9RZgAfrF4?_gl=1*1gla2ue*_ga*MTQ2ODA0NTgxNS4xNjUzODgyMDYy*_ga_5RMPXG14TE*MTY5NjQwNjg5OS4yNC4xLjE2OTY0MDY5MTMuNDYuMC4w');
cheeringSound.loop = true;
let beepSound = new Audio('https://rektgang.mypinata.cloud/ipfs/Qmbf8xqZr3PVg9eCKhfCEjPjFHEcYt1rDHp8haLo5KLvVG?preview=1&_gl=1*g8jxzk*_ga*MTQ2ODA0NTgxNS4xNjUzODgyMDYy*_ga_5RMPXG14TE*MTY5NjQwNjg5OS4yNC4xLjE2OTY0MDc5ODMuNDYuMC4w');
const startLine = 100;
const finishLine = 1820;
const imageSize = 56;
const trackHeight = 80;
    
// Chicken Class
class Chicken {
  constructor(username, name, x, trackIndex, imageUrl, imageNoBgUrl) {
    this.username = username;
    this.name = name;
    this.x = x + 25;
    this.y = (trackIndex + 1) * trackHeight - imageSize;
    this.speed = Math.random() * 3 + 2;
    this.image = new Image();
    this.image.src = imageUrl;
    this.dirty = true;
    this.timestamp = null;
    this.finished = false;
    this.finishTime = null;
    this.yOffset = 0;
    this.shouldJump = false;
    this.jumpHeight = 0;
    
    // Initialize and load the image without background
    this.imageNoBg = new Image();
    this.imageNoBg.src = imageNoBgUrl;
    this.imageNoBg.onload = () => {
      console.log(`ImageNoBg for ${this.name} loaded.`);
      this.imageNoBgLoaded = true;
    };
    this.imageNoBgLoaded = false;
  }
}

// createChickenButton
function createChickenButton(id, username, name, imageUrl) {
  const chickenButton = document.createElement('div');
  chickenButton.id = `chicken-${id}`;
  chickenButton.classList.add("chicken-button");

  chickenButton.innerHTML = `<img src="${imageUrl}" alt="${name}"><br>${username} ${name}<br><button onclick="deleteChicken(${id})">x</button>`;
  chickenButton.addEventListener('click', function(event) {
    if (event.target.tagName !== 'BUTTON') {
      toggleChicken(id);
    }
  });
  document.getElementById("availableChickens").appendChild(chickenButton);
}

// toggleChicken
function toggleChicken(id) {
  const chicken = availableChickens[id];
  const existingIndex = chickens.findIndex(c => c.name === chicken.name);

  if (existingIndex === -1) {
    if (chickens.length >= 8) {
      alert("Maximum 8 chickens allowed in a race.");
      return;
    }
    const newChicken = new Chicken(chicken.username, chicken.name, 0, chickens.length, chicken.imageUrl, chicken.imageNoBgUrl);
    chickens.push(newChicken);
    document.getElementById(`chicken-${id}`).classList.add("in-race");
  
    // Wait for the image to load before drawing
    newChicken.imageNoBg.onload = function() {
      // Calculate the aspect ratio of the image
      const scaleFactor = imageSize / Math.max(newChicken.imageNoBg.width, newChicken.imageNoBg.height);
      // Use the aspect ratio to calculate the height of the image when the width is set to imageSize
      const width = newChicken.imageNoBg.width * scaleFactor;
      const height = newChicken.imageNoBg.height * scaleFactor;
      const adjustedY = newChicken.y + imageSize - height;


      ctx.drawImage(newChicken.imageNoBg, newChicken.x, adjustedY, width, height);
      ctx.font = "20px 'Press Start 2P'";
      ctx.textAlign = "right";
      ctx.fillStyle = '#D2D2D2';
      const middleOfTrack = newChicken.y + 7;
      const rightPadding = canvas.width - 112;
      ctx.fillText(`${chicken.username} ${chicken.name}`, rightPadding, middleOfTrack);
    }
  } else {
    const removedChicken = chickens[existingIndex];
    // Clear the chicken drawing
    ctx.clearRect(removedChicken.x, removedChicken.y, imageSize, imageSize);
    ctx.fillStyle = '#55372F';  // Replace with your canvas background color
    ctx.fillRect(removedChicken.x, removedChicken.y, imageSize, imageSize);
    chickens.splice(existingIndex, 1);
    document.getElementById(`chicken-${id}`).classList.remove("in-race");
  }
}    

// saveRaceData
function saveRaceData() {
  const sortedChickens = [...chickens].sort((a, b) => a.finishTime - b.finishTime);

  // Show the results
  let raceResultPopups = document.getElementsByClassName("raceResultPopup");
  for(let i = 0; i < raceResultPopups.length; i++) {
    raceResultPopups[i].style.display = "flex";
  }

  document.getElementById("startRace").style.display = "none";
  document.getElementById("nextRace").style.display = "block";

  // Update the results
  let resultsHTML = "";
  sortedChickens.forEach((chicken, index) => {
    let placeSuffix = "th";
    if (index === 0) placeSuffix = "st";
    else if (index === 1) placeSuffix = "nd";
    else if (index === 2) placeSuffix = "rd";

    resultsHTML += `<div class="result-item">
                      <span>${index + 1}${placeSuffix} </span>
                      <img src="${chicken.imageNoBg.src}" class="result-img">
                      <span>${chicken.username} ${chicken.name}</span>
                    </div>`;
  });
  for(let i = 0; i < raceResultPopups.length; i++) {
    raceResultPopups[i].innerHTML = resultsHTML;
  }

  updateLeaderboard(raceHistory.length + 1, sortedChickens);
  raceHistory.push(sortedChickens.map(chicken => ({
    username: chicken.username,
    name: chicken.name,
    imageUrl: chicken.image.src
  })));
  displayRaceHistory();
  
  // Automatically update the leaderboards
  updateLeaderboardDisplay();
  // Stop the cheering sound when the race ends
  cheeringSound.pause();
  cheeringSound.currentTime = 0; // Reset the sound to the start
}
        
// displayRaceHistory
function displayRaceHistory() {
  const tableBody = document.getElementById("raceResultsBody");
  tableBody.innerHTML = "";
  raceHistory.forEach((race, index) => {
    const row = document.createElement("tr");
    const raceNumberCell = document.createElement("td");
    raceNumberCell.textContent = `Race ${index + 1}`;
    row.appendChild(raceNumberCell);
    race.forEach(chicken => {
      const cell = document.createElement("td");
      
      const img = document.createElement('img');
      img.src = chicken.imageUrl;
      img.className = "race-result-img";
      
      const inlineContainer = document.createElement('div');
      inlineContainer.className = 'inline-container';

      const usernameDiv = document.createElement("div");
      usernameDiv.className = "race-result-username inline-item";
      usernameDiv.textContent = chicken.username;

      const nameDiv = document.createElement("div");
      nameDiv.className = "race-result-name inline-item";
      nameDiv.textContent = chicken.name;
      
      inlineContainer.appendChild(img);
      inlineContainer.appendChild(usernameDiv);
      inlineContainer.appendChild(nameDiv);

      cell.appendChild(inlineContainer);
      row.appendChild(cell);
    });
    tableBody.appendChild(row);
  });
}

// updateLeaderboard
function updateLeaderboard(raceId, sortedChickens) {
  const raceData = {
    raceId: raceId,
    results: sortedChickens.map((chicken, index) => {
      return {
        username: chicken.username,
        chickenName: chicken.name,
        finishTime: chicken.finishTime,
        position: index + 1
      };
    })
  };
  leaderboardData.push(raceData);
}

// prepareNextRace
function prepareNextRace() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTrackLines();
  chickens = [];
  raceStarted = false;
  raceFinished = false;
  document.getElementById("nextRace").style.display = "none";
  const chickenButtons = document.getElementsByClassName("chicken-button");
  Array.from(chickenButtons).forEach(button => button.classList.remove("in-race"));
  stopReplay = true;  // Stop the replay
  replayData = [];  // Clear replay data
  document.getElementById("startRace").style.display = "block";
  document.getElementById("nextRace").style.display = "none";
  let raceResultPopups = document.getElementsByClassName("raceResultPopup");
  for(let i = 0; i < raceResultPopups.length; i++) {
    raceResultPopups[i].innerHTML = "";
  }  const startRaceButton = document.getElementById("startRace");
  startRaceButton.style.display = "block";
  startRaceButton.classList.remove("disabled");
  startRaceButton.disabled = false;
  drawTrackLines();
  cheeringSound.pause();
  cheeringSound.currentTime = 0; // Reset the sound to the start
  const randomSelectButton = document.getElementById("randomSelectButton");
  randomSelectButton.disabled = false;
  randomSelectButton.classList.remove("disabled");}

// drawTrackLines
function drawTrackLines() {
  ctx.fillStyle = "#55372F";  // Background
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw start line
  if (!raceStarted) {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(startLine, 0);
    ctx.lineTo(startLine, canvas.height);
    ctx.stroke();
  }

  // Draw finish line
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(finishLine, 0);
  ctx.lineTo(finishLine, canvas.height);
  ctx.stroke();
  ctx.beginPath();  // Close path

  // Line in between
  ctx.strokeStyle = "#F19E34";
    for (let i = 1; i < 9; i++) {
      ctx.lineWidth = 16;
      ctx.moveTo(0, i * trackHeight);
      ctx.lineTo(1920, i * trackHeight);
      ctx.stroke();
      ctx.beginPath();  // Close path
    }
    drawFlag();
}

//drawFlag
function drawFlag() {
  const flagStart = 1820;
  const flagEnd = 1920;
  const flagWidth = flagEnd - flagStart;
  const stripeHeight = canvas.height / 8; // 8 stripes for 8 chickens
  const squareSize = flagWidth / 8; // 8 squares per stripe

  for (let i = 0; i < 8; i++) { // Loop for each track
    for (let j = 0; j < 8; j++) { // Loop for each stripe
      for (let k = 0; k < 8; k++) { // Loop for each square
        ctx.fillStyle = (j + k) % 2 === 0 ? 'black' : 'white';
        ctx.fillRect(flagStart + k * squareSize, i * stripeHeight + j * squareSize, squareSize, squareSize);
      }
    }
  }
}

// gameLoop
function gameLoop() {
  if (raceStarted && !raceFinished) {
    let frameData = [];
    let allFinished = true;
    let currentTime = new Date().getTime();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawTrackLines();

    for (const chicken of chickens) {
      if (!chicken.finished) {
        ctx.font = "20px 'Press Start 2P'";
        ctx.textAlign = "right";
        ctx.fillStyle = 'grey';
        const middleOfTrack = chicken.y;
        const rightPadding = canvas.width - 112;
        ctx.fillText(`${chicken.username} ${chicken.name}`, rightPadding, middleOfTrack);
        
        // Dynamic speed adjustment logic starts here
        if (globalTime % 10 === 0) {
          chicken.speed += Math.random() * 2 - 1;
          chicken.speed = Math.max(2, Math.min(5, chicken.speed));
        }
        if (globalTime % 3.5 === 0) {  
          chicken.shouldJump = !chicken.shouldJump;
          chicken.jumpHeight = chicken.shouldJump ? Math.random() * 2 - 5 : 0;  
        }
        chicken.x += chicken.speed; 

        const scaleFactor = imageSize / Math.max(chicken.imageNoBg.width, chicken.imageNoBg.height);
        // Calculate the width and height of the image on the canvas
        const width = chicken.imageNoBg.width * scaleFactor;
        const height = chicken.imageNoBg.height * scaleFactor;
        // Adjust the y-coordinate based on the height of the image
        const adjustedY = chicken.y + imageSize - height;
        // Drawing logic
        if (chicken.imageNoBgLoaded) {
          ctx.drawImage(chicken.imageNoBg, chicken.x, adjustedY + chicken.jumpHeight, width, height);
        } else {
          ctx.drawImage(chicken.imageNoBg, chicken.x, adjustedY + chicken.jumpHeight, width, height);
        }
        if ((chicken.x + width) >= finishLine) {
          chicken.finished = true;
          chicken.finishTime = currentTime;
        }

        chicken.dirty = true;

        allFinished = false;
      }
      frameData.push({
        x: chicken.x, 
        y: chicken.y, 
        image: chicken.image, 
        imageNoBg: chicken.imageNoBg,
        jumpHeight: chicken.jumpHeight,
        finished: chicken.finished,
        username: chicken.username,
        name: chicken.name
      });
    }
    replayData.push(frameData);

    globalTime++;

    if (allFinished) {
      saveRaceData();
      document.getElementById("nextRace").style.display = "block";
      raceFinished = true;
      startReplay();
    }
  }
  requestAnimationFrame(gameLoop);
}

// startReplay
function startReplay() {
  stopReplay = false;  // Reset flag
  let frameRate = 30; // 30 frames per second
  let slowMoFactor = 2; // 2x slower

  let startIndex = 0; // Start from the beginning of the race
  let endIndex = replayData.length;

  let replayIndex = startIndex;

  function replayLoop() {
    if (stopReplay) return;

    if (replayIndex < endIndex) {
      let frameData = replayData[replayIndex];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawTrackLines();

      for (const chicken of frameData) {
        if (!chicken.finished) {  // Check if the chicken has finished
          ctx.font = "20px 'Press Start 2P'";
          ctx.textAlign = "right";
          ctx.fillStyle = 'grey';
          const middleOfTrack = chicken.y;
          const rightPadding = canvas.width - 112;
          ctx.fillText(`${chicken.username} ${chicken.name}`, rightPadding, middleOfTrack);
                // Calculate the scale factor
      const scaleFactor = imageSize / Math.max(chicken.imageNoBg.width, chicken.imageNoBg.height);
      // Calculate the width and height of the image on the canvas
      const width = chicken.imageNoBg.width * scaleFactor;
      const height = chicken.imageNoBg.height * scaleFactor;
      // Adjust the y-coordinate based on the height of the image
      const adjustedY = chicken.y + imageSize - height;
          if (chicken.imageNoBg) {
            ctx.drawImage(chicken.imageNoBg, chicken.x, adjustedY + chicken.jumpHeight, width, height);
          } else {
            ctx.drawImage(chicken.imageNoBg, chicken.x, adjustedY + chicken.jumpHeight, width, height);
          }
        }
      }

      drawReplayText();

      replayIndex++;
      setTimeout(replayLoop, 1000 / (frameRate / slowMoFactor));
    } else {
      replayIndex = startIndex;  // Loop
      replayLoop();
    }
  }
  cheeringSound.play();
  replayLoop();
}

// drawReplayText
function drawReplayText() {

  // Draw small red circle
  ctx.beginPath();
  ctx.arc(30, 30, 10, 0, 2 * Math.PI, false);
  ctx.fillStyle = 'red';
  ctx.fill();

  // Draw "Replay" text
  ctx.font = "20px 'Press Start 2P'";
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.fillText('Replay', 50, 35);
}

// startRace
function startRace() {
  if (chickens.length < 8) {
    alert("Add 8 chickens to start the race.");
    return;
  }
  
  const randomSelectButton = document.getElementById("randomSelectButton");
  randomSelectButton.disabled = true;
  randomSelectButton.classList.add("disabled");
  
  const startRaceButton = document.getElementById("startRace");
  startRaceButton.classList.add("disabled");
  startRaceButton.disabled = true;

  let countdown = 3;
  const countdownInterval = setInterval(() => {
    // Clear the previous countdown number
    ctx.clearRect(canvas.width / 2 - 50, canvas.height / 2 - 50, 100, 100);
    
    // Set text properties
    ctx.font = "20px 'Press Start 2P'";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FF0000';  // Red color for countdown numbers
    
    beepSound.play();

    // Draw countdown number
    ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
    
    countdown--;
    if (countdown < 0) {
      clearInterval(countdownInterval);
      
      // Clear the last countdown number
      ctx.clearRect(canvas.width / 2 - 50, canvas.height / 2 - 50, 100, 100);
      
      raceStarted = true;
      document.getElementById("nextRace").style.display = "none";
      cheeringSound.play();

    }
  }, 1000);

}

// deleteChicken
function deleteChicken(id) {
  const chickenDiv = document.getElementById(`chicken-${id}`);
  chickenDiv.remove();
  availableChickens = availableChickens.filter(chicken => chicken.id !== id);
}    

// calculateChickenRankings
function calculateChickenRankings() {
  let chickenPoints = {};
      
  leaderboardData.forEach(race => {
  race.results.forEach(result => {
  const chickenKey = `${result.username}-${result.chickenName}`;
  if (!chickenPoints[chickenKey]) {
      chickenPoints[chickenKey] = 0;
  }
  chickenPoints[chickenKey] += (9 - result.position);
  });
  });
    
  const sortedChickens = Object.keys(chickenPoints).sort((a, b) => chickenPoints[b] - chickenPoints[a]);
  return {sortedChickens, chickenPoints};
}
    
// updateLeaderboardDisplay
function updateLeaderboardDisplay() {
  const {sortedChickens, chickenPoints} = calculateChickenRankings();

  // Populate Chicken Leaderboard
  const chickenTableBody = document.getElementById("chickenLeaderboardBody");
  chickenTableBody.innerHTML = "";
  sortedChickens.forEach((chickenKey, index) => {
    const [username, chickenName] = chickenKey.split('-');
    const row = document.createElement("tr");
    row.innerHTML = `<td>${index + 1}</td><td>${username} ${chickenName}</td><td>${chickenPoints[chickenKey]}</td>`;
    chickenTableBody.appendChild(row);
  });
}

// preloadImages
function preloadImages(chickens, callback) {
  let loadedCount = 0;
  chickens.forEach(chicken => {
    const img = new Image();
    img.src = chicken.imageNoBgUrl;
    img.onload = () => {
      loadedCount++;
      if (loadedCount === chickens.length) {
        callback();
      }
    };
  });
}

function randomSelectChickens() {
  // Clear the entire canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTrackLines();  // Assuming you have a function to redraw the track lines

  // Clear the chickens array
  chickens = [];
  
  // Reset the "in-race" class for all chicken buttons
  availableChickens.forEach((chicken, id) => {
    document.getElementById(`chicken-${id}`).classList.remove("in-race");
  });

  // Create a copy of availableChickens and shuffle it
  let shuffledChickens = [...availableChickens];
  shuffledChickens.sort(() => Math.random() - 0.5);
  
  // Select the first 8 chickens from the shuffled array
  for (let i = 0; i < 8; i++) {
    const chicken = shuffledChickens[i];
    toggleChicken(chicken.id);
  }
}

// window.onlad
window.onload = function() {
      canvas = document.getElementById("gameCanvas");
      ctx = canvas.getContext("2d");
      drawTrackLines();
      gameLoop();
      
      // Preload chickens
      const preloadChickens = [
        {username: 'Cudo', name: '#178', imageUrl: 'https://ipfs-gw.stargaze-apis.com/ipfs/QmeR2zrH6kwKhXMZhTD5gsHMk13oJoSfsCv7GCiP9YRjXk/1.png', imageNoBgUrl: 'https://rektgang.mypinata.cloud/ipfs/QmapVvcJhRspLHovj5Ji2UJ1KxFaAMZxwRkwErkUT6YFgS/NFT_1.png'},
        {username: 'Zerk', name: '#534', imageUrl: 'https://ipfs-gw.stargaze-apis.com/ipfs/QmeR2zrH6kwKhXMZhTD5gsHMk13oJoSfsCv7GCiP9YRjXk/2.png', imageNoBgUrl: 'https://rektgang.mypinata.cloud/ipfs/QmapVvcJhRspLHovj5Ji2UJ1KxFaAMZxwRkwErkUT6YFgS/NFT_2.png'},
        {username: 'PBR', name: '#763', imageUrl: 'https://ipfs-gw.stargaze-apis.com/ipfs/QmeR2zrH6kwKhXMZhTD5gsHMk13oJoSfsCv7GCiP9YRjXk/3.png', imageNoBgUrl: 'https://rektgang.mypinata.cloud/ipfs/QmapVvcJhRspLHovj5Ji2UJ1KxFaAMZxwRkwErkUT6YFgS/NFT_3.png'},
        {username: 'Xulian', name: '#913', imageUrl: 'https://ipfs-gw.stargaze-apis.com/ipfs/QmeR2zrH6kwKhXMZhTD5gsHMk13oJoSfsCv7GCiP9YRjXk/4.png', imageNoBgUrl: 'https://rektgang.mypinata.cloud/ipfs/QmapVvcJhRspLHovj5Ji2UJ1KxFaAMZxwRkwErkUT6YFgS/NFT_4.png'},
        {username: 'Fehu', name: '#35', imageUrl: 'https://ipfs-gw.stargaze-apis.com/ipfs/QmeR2zrH6kwKhXMZhTD5gsHMk13oJoSfsCv7GCiP9YRjXk/5.png', imageNoBgUrl: 'https://rektgang.mypinata.cloud/ipfs/QmapVvcJhRspLHovj5Ji2UJ1KxFaAMZxwRkwErkUT6YFgS/NFT_5.png'}, 
        {username: 'Winny', name: '#7', imageUrl: 'https://ipfs-gw.stargaze-apis.com/ipfs/QmeR2zrH6kwKhXMZhTD5gsHMk13oJoSfsCv7GCiP9YRjXk/6.png', imageNoBgUrl: 'https://rektgang.mypinata.cloud/ipfs/QmapVvcJhRspLHovj5Ji2UJ1KxFaAMZxwRkwErkUT6YFgS/NFT_6.png'},
        {username: 'Merlioz', name: '#15', imageUrl: 'https://ipfs-gw.stargaze-apis.com/ipfs/QmeR2zrH6kwKhXMZhTD5gsHMk13oJoSfsCv7GCiP9YRjXk/7.png', imageNoBgUrl: 'https://rektgang.mypinata.cloud/ipfs/QmapVvcJhRspLHovj5Ji2UJ1KxFaAMZxwRkwErkUT6YFgS/NFT_7.png'},
        {username: 'Argos', name: '#37', imageUrl: 'https://ipfs-gw.stargaze-apis.com/ipfs/QmeR2zrH6kwKhXMZhTD5gsHMk13oJoSfsCv7GCiP9YRjXk/8.png', imageNoBgUrl: 'https://rektgang.mypinata.cloud/ipfs/QmapVvcJhRspLHovj5Ji2UJ1KxFaAMZxwRkwErkUT6YFgS/NFT_8.png'},

      ];
    
      // Preload chickens into availableChickens and create buttons for them
      for (let i = 0; i < preloadChickens.length; i++) {
        const chicken = preloadChickens[i];
        availableChickens.push({
          username: chicken.username, 
          name: chicken.name, 
          imageUrl: chicken.imageUrl, 
          imageNoBgUrl: chicken.imageNoBgUrl,
          id: i
        });
        createChickenButton(i, chicken.username, chicken.name, chicken.imageUrl);
      }
}