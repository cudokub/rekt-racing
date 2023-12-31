let canvas;
let ctx;
let nextChickenId = 0;
let chickens = [];
let availableChickens = [];
let raceStarted = false;
let raceFinished = false;
let raceHistory = [];
let leaderboardData = [];
let globalTime = 0;
let replayData = [];
let stopReplay = false;
let cheeringSound = new Audio('https://rektgang.mypinata.cloud/ipfs/QmSiQgh4z7s7kQS4xXirpzk3vpYqRhPCegQMzobzWFQocA?_gl=1*nnp5au*_ga*MTQ2ODA0NTgxNS4xNjUzODgyMDYy*_ga_5RMPXG14TE*MTY5NjYwNzY1MC4yNi4xLjE2OTY2MDg1MDcuNDcuMC4w');
cheeringSound.loop = true;
let beepSound = new Audio('https://rektgang.mypinata.cloud/ipfs/Qmbf8xqZr3PVg9eCKhfCEjPjFHEcYt1rDHp8haLo5KLvVG?_gl=1*tsafwh*_ga*MTQ2ODA0NTgxNS4xNjUzODgyMDYy*_ga_5RMPXG14TE*MTY5NjQyMTg5MC4yNS4xLjE2OTY0MjE4OTguNTIuMC4w');
let currentRaceNumber = 1;

let chickenData;
fetch('https://rektgang.mypinata.cloud/ipfs/QmeUEf2KYrBQfCHrDbtqUJ6Gut2bixhjCRbZYTfUZhphPr?_gl=1*1q0ymao*_ga*MTQ2ODA0NTgxNS4xNjUzODgyMDYy*_ga_5RMPXG14TE*MTY5NzA5MTE5MC4yOC4xLjE2OTcwOTE2MDQuNjAuMC4w')
  .then(response => response.json())
  .then(data => chickenData = data);

const startLine = 112;
const finishLine = 1340;
const imageSize = 64;
const trackHeight = 96;
    
// Chicken Class
class Chicken {
  constructor(username, name, x, trackIndex, imageUrl, imageNoBgUrl) {
    this.username = username;
    this.name = name;
    this.x = x + 25;
    this.y = (trackIndex + 1) * trackHeight - imageSize;
    this.speed = Math.random() * 0.5 + 0.4;
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

  chickenButton.innerHTML = `
  <img src="${imageUrl}" alt="${name}">
  <div class="chicken-username">${username}</div>
  <div class="chicken-name">${name}</div>
  <div class="trash-icon">&#128465;</div>
  `;

  chickenButton.addEventListener('click', function(event) {
    if (event.target.tagName !== 'BUTTON') {
      toggleChicken(id);
    }
  });
  document.getElementById("availableChickens").appendChild(chickenButton);

    // Create the trash icon
    const trashIcon = document.createElement('div');
    trashIcon.innerHTML = '&#128465;';
    trashIcon.classList.add('trash-icon');
  
    // Add the trash icon to the chicken button
    chickenButton.appendChild(trashIcon);
    
  
  // Add a click event listener to the trash icon
  trashIcon.addEventListener('click', function(event) {
    event.stopPropagation();  // Prevent the chicken button's click event from firing
    chickenButton.remove();  // Remove the chicken button from the DOM

    // Remove the chicken from the availableChickens array
    const index = availableChickens.findIndex(chicken => chicken.id === id);
    if (index !== -1) {
      availableChickens.splice(index, 1);
    }
  });

  nextChickenId++;  // Increment the ID for the next chicken
}

// toggleChicken
function toggleChicken(id) {
  const chicken = availableChickens.find(c => c.id === id);
  const existingIndex = chickens.findIndex(c => c.name === chicken.name);

  if (existingIndex === -1) {
    if (chickens.length >= 5) {
      alert("Maximum 5 chickens allowed in a race.");
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
      ctx.font = "16px 'Press Start 2P'";
      ctx.textAlign = "right";
      ctx.fillStyle = '#D2D2D2';
      const middleOfTrack = (newChicken.y + imageSize / 2);
      const rightPadding = canvas.width - 112;
      ctx.fillText(`${chicken.username} ${chicken.name}`, rightPadding, middleOfTrack);
    }
  }
}    

// saveRaceData
function saveRaceData() {
  const sortedChickens = [...chickens].sort((a, b) => a.finishTime - b.finishTime);

  let raceResultPopups = document.getElementsByClassName("raceResultPopup");
  for(let i = 0; i < raceResultPopups.length; i++) {
    raceResultPopups[i].style.display = "flex";
  }

  document.getElementById("startRace").style.display = "none";
  document.getElementById("nextRace").style.display = "block";

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
  updateLeaderboardDisplay();
  populateRaceResults(sortedChickens);
  document.querySelector('.race-results-content').style.display = 'flex';

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
      // Create a new cell for the chicken
      const chickenCell = document.createElement("td");

      // Create a div for the image
      const imgDiv = document.createElement("div");
      const img = document.createElement("img");
      img.src = chicken.imageUrl; // Set the image source to the chicken's image URL
      img.style.width = '40px'; // Set the size to 24px
      img.style.height = '40px'; // Set the height to 24px
      img.style.display = 'block'; // Set display to block
      img.style.margin = 'auto'; // Center the image
      img.style.paddingBottom = '8px';
      imgDiv.appendChild(img);

      // Create a div for the username
      const usernameDiv = document.createElement("div");
      usernameDiv.textContent = chicken.username;

      // Create a div for the name
      const nameDiv = document.createElement("div");
      nameDiv.textContent = chicken.name;

      // Append the divs to the cell
      chickenCell.appendChild(imgDiv);
      chickenCell.appendChild(usernameDiv);
      chickenCell.appendChild(nameDiv);

      // Append the cell to the row
      row.appendChild(chickenCell);
    });

    tableBody.appendChild(row);
  });
}


document.addEventListener('DOMContentLoaded', (event) => {
  document.getElementById('addChickenButton').addEventListener('click', () => {
    const nameField = document.querySelector('.input-inner-container #name');
    const usernameField = document.querySelector('.input-inner-container #username');
    const name = nameField.value;
    const username = usernameField.value;
    const chicken = chickenData.find(chicken => chicken.name === name);
    if (chicken) {
      const newChicken = {
        username: username,
        name: '#' + chicken.name, // Prepend '#' to the name
        imageUrl: chicken.imageUrl,
        imageNoBgUrl: chicken.imageNoBgUrl,
        id: availableChickens.length // New id is the current length of the array
      };
      availableChickens.push(newChicken); // Add the new chicken to the array
      createChickenButton(newChicken.id, newChicken.username, newChicken.name, newChicken.imageUrl);
      
      // Reset the input fields
      nameField.value = '';
      usernameField.value = '';
    } else {
      alert('No chicken found with the number');
      return
    }
  });
});





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
  }  
  const startRaceButton = document.getElementById("startRace");
  startRaceButton.style.display = "block";
  startRaceButton.classList.remove("disabled");
  startRaceButton.disabled = false;
  drawTrackLines();

  const randomSelectButton = document.getElementById("randomSelectButton");
  randomSelectButton.disabled = false;
  randomSelectButton.classList.remove("disabled");

  const resetRaceButton = document.getElementById("resetRace");
  resetRaceButton.classList.remove("disabled");
  resetRaceButton.disabled = false;

  currentRaceNumber++;
  document.getElementById("raceNumber").textContent = `Race ${currentRaceNumber}`;

  cheeringSound.pause();
  cheeringSound.currentTime = 0;

  updateRacePopupText(5);
}

// drawTrackLines
function drawTrackLines() {
  ctx.fillStyle = "#55372F";  // Background
  ctx.fillRect(2, 2, canvas.width - 4, canvas.height - 4);  // Draw background inside the border

    // Line in between
    ctx.strokeStyle = "#F19E34";
    for (let i = 1; i < 6; i++) {
      ctx.lineWidth = 24;
      ctx.moveTo(0, i * trackHeight);
      ctx.lineTo(1480, i * trackHeight);
      ctx.stroke();
      ctx.beginPath();
    }
    
  // Draw start line
  if (!raceStarted) {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 8;
    ctx.moveTo(startLine, 0);
    ctx.lineTo(startLine, canvas.height);
    ctx.stroke();
    ctx.beginPath();
  }

  // Draw finish line
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(finishLine, 0);
  ctx.lineTo(finishLine, canvas.height);
  ctx.stroke();
  ctx.beginPath();  // Close path


  drawFlag();

  // Border of canvas
  ctx.strokeStyle = "#000000";  // Border color
  ctx.lineWidth = 8;  // Border width
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);  // Draw border inside
  ctx.beginPath();

  }

//drawFlag
function drawFlag() {
  const flagStart = 1340;
  const flagEnd = 1480;
  const flagWidth = flagEnd - flagStart;
  const stripeHeight = canvas.height / 5; // 5 stripes for 5 chickens
  const squareSize = flagWidth / 5; // 5 squares per stripe

  for (let i = 0; i < 5; i++) { // Loop for each track
    for (let j = 0; j < 5; j++) { // Loop for each stripe
      for (let k = 0; k < 5; k++) { // Loop for each square
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
        ctx.font = "16px 'Press Start 2P'";
        ctx.textAlign = "right";
        ctx.fillStyle = 'grey';
        const middleOfTrack = (chicken.y + imageSize / 2);
        const rightPadding = canvas.width - 112;
        ctx.fillText(`${chicken.username} ${chicken.name}`, rightPadding, middleOfTrack);
        
        // Dynamic speed adjustment logic starts here
        if (globalTime % 3 === 0) {
          chicken.speed += (Math.random() * 2 - 1) * 0.5;  // Multiply by 0.4 to slow down
          chicken.speed = Math.max(1, Math.min(2, chicken.speed));  // Adjust the range to be slower
        }

        if (globalTime % 5 === 0) {  
          chicken.shouldJump = !chicken.shouldJump;
          chicken.jumpHeight = chicken.shouldJump ? Math.random() * 2 - 5 : 0;  
        }

        chicken.x += chicken.speed; 

        const scaleFactor = imageSize / Math.max(chicken.imageNoBg.width, chicken.imageNoBg.height);
        const width = chicken.imageNoBg.width * scaleFactor;
        const height = chicken.imageNoBg.height * scaleFactor;
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

  let endIndex = replayData.length;
  let startIndex = endIndex - (9 * frameRate); // Start from 18 seconds before the end of the race
  startIndex = Math.max(0, startIndex); // Ensure startIndex is not negative

  let replayIndex = startIndex;

  const resetRaceButton = document.getElementById("resetRace");
  resetRaceButton.classList.add("disabled");
  resetRaceButton.disabled = true;

  function replayLoop() {
    if (stopReplay) return;

    if (replayIndex < endIndex) {
      let frameData = replayData[replayIndex];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawTrackLines();

      for (const chicken of frameData) {
        if (!chicken.finished) {  // Check if the chicken has finished
          ctx.font = "16px 'Press Start 2P'";
          ctx.textAlign = "right";
          ctx.fillStyle = 'grey';
          const middleOfTrack = (chicken.y + imageSize / 2);
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
  ctx.font = "16px 'Press Start 2P'";
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.fillText('Replay', 50, 35);
  ctx.beginPath();

}

// startRace
function startRace() {
  if (chickens.length < 5) {
    alert("Add 5 chickens to start the race.");
    return;
  }

  updateRacePopupText(2);
  
  const randomSelectButton = document.getElementById("randomSelectButton");
  randomSelectButton.disabled = true;
  randomSelectButton.classList.add("disabled");
  
  const startRaceButton = document.getElementById("startRace");
  startRaceButton.classList.add("disabled");
  startRaceButton.disabled = true;

  const resetRaceButton = document.getElementById("resetRace");
  resetRaceButton.classList.add("disabled");
  resetRaceButton.disabled = true;

  let countdown = 3;
  const countdownInterval = setInterval(() => {
    // Clear the previous countdown number
    ctx.clearRect(canvas.width / 2 - 50, canvas.height / 2 - 50, 100, 100);
    
    // Set text properties
    ctx.font = "24px 'Press Start 2P'";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FF0000';  // Red color for countdown numbers
    
    beepSound.play();

    // Draw countdown number
    ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
    
    countdown--;
    if (countdown < 0) {
      clearInterval(countdownInterval);
      updateRacePopupText(3);
      // Clear the last countdown number
      ctx.clearRect(canvas.width / 2 - 50, canvas.height / 2 - 50, 100, 100);
      
      raceStarted = true;
      document.getElementById("nextRace").style.display = "none";
      cheeringSound.play();

    }
  }, 1000);
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

      // Define the points for each position
      let points;
      switch(result.position) {
        case 1:
          points = 4; // 1st place gets 10 points
          break;
        case 2:
          points = 3; // 2nd place gets 7 points
          break;
        case 3:
          points = 2; // 3rd place gets 5 points
          break;
        case 4:
          points = 1; // 4th place loses 2 points
          break;
        case 5:
          points = 0; // 5th place loses 5 points
          break;
        default:
          points = 0; // Default case, should not be reached
      }

      chickenPoints[chickenKey] += points;
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

    // Create a td element for the rank
    const rankCell = document.createElement("td");
    rankCell.textContent = index + 1;

    // Create an img element for the chicken image
    const imgCell = document.createElement("td");
    const img = document.createElement("img");
    const chicken = availableChickens.find(chicken => chicken.name === chickenName && chicken.username === username);
    if (chicken) {
      img.src = chicken.imageUrl;
      img.style.width = '40px'; // Set the size to 32px
      img.style.display = 'block'; // Set display to block
      img.style.margin = 'auto'; // Center the image
      imgCell.appendChild(img);
    }

    // Create a td element for the name
    const nameCell = document.createElement("td");
    nameCell.textContent = `${username} ${chickenName}`;

    // Create a td element for the points
    const pointsCell = document.createElement("td");
    pointsCell.textContent = chickenPoints[chickenKey];

    // Append the cells to the row in the desired order
    row.appendChild(rankCell);
    row.appendChild(imgCell);
    row.appendChild(nameCell);
    row.appendChild(pointsCell);

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
    const chickenElement = document.getElementById(`chicken-${id}`);
    if (chickenElement) {
      chickenElement.classList.remove("in-race");
    }
  });

  // Create a copy of availableChickens and shuffle it
  let shuffledChickens = [...availableChickens];
  shuffledChickens.sort(() => Math.random() - 0.5);
  
  // Select the first 5 chickens from the shuffled array
  for (let i = 0; i < 5; i++) {
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
      updateRacePopupText(1);
      
      // Preload chickens
      const preloadChickens = [
        {username: 'Cudo', name: '#178', imageUrl: 'https://ipfs-gw.stargaze-apis.com/ipfs/QmeR2zrH6kwKhXMZhTD5gsHMk13oJoSfsCv7GCiP9YRjXk/1.png', imageNoBgUrl: 'https://rektgang.mypinata.cloud/ipfs/QmapVvcJhRspLHovj5Ji2UJ1KxFaAMZxwRkwErkUT6YFgS/NFT_1.png'},
        {username: 'Zerk', name: '#534', imageUrl: 'https://ipfs-gw.stargaze-apis.com/ipfs/QmeR2zrH6kwKhXMZhTD5gsHMk13oJoSfsCv7GCiP9YRjXk/2.png', imageNoBgUrl: 'https://rektgang.mypinata.cloud/ipfs/QmapVvcJhRspLHovj5Ji2UJ1KxFaAMZxwRkwErkUT6YFgS/NFT_2.png'},
        {username: 'PBR', name: '#763', imageUrl: 'https://ipfs-gw.stargaze-apis.com/ipfs/QmeR2zrH6kwKhXMZhTD5gsHMk13oJoSfsCv7GCiP9YRjXk/3.png', imageNoBgUrl: 'https://rektgang.mypinata.cloud/ipfs/QmapVvcJhRspLHovj5Ji2UJ1KxFaAMZxwRkwErkUT6YFgS/NFT_3.png'},
        {username: 'Xulian', name: '#913', imageUrl: 'https://ipfs-gw.stargaze-apis.com/ipfs/QmeR2zrH6kwKhXMZhTD5gsHMk13oJoSfsCv7GCiP9YRjXk/4.png', imageNoBgUrl: 'https://rektgang.mypinata.cloud/ipfs/QmapVvcJhRspLHovj5Ji2UJ1KxFaAMZxwRkwErkUT6YFgS/NFT_4.png'},
        {username: 'Fehu', name: '#35', imageUrl: 'https://ipfs-gw.stargaze-apis.com/ipfs/QmeR2zrH6kwKhXMZhTD5gsHMk13oJoSfsCv7GCiP9YRjXk/5.png', imageNoBgUrl: 'https://rektgang.mypinata.cloud/ipfs/QmapVvcJhRspLHovj5Ji2UJ1KxFaAMZxwRkwErkUT6YFgS/NFT_5.png'}, 
        {username: 'Winny', name: '#7', imageUrl: 'https://ipfs-gw.stargaze-apis.com/ipfs/QmeR2zrH6kwKhXMZhTD5gsHMk13oJoSfsCv7GCiP9YRjXk/6.png', imageNoBgUrl: 'https://rektgang.mypinata.cloud/ipfs/QmapVvcJhRspLHovj5Ji2UJ1KxFaAMZxwRkwErkUT6YFgS/NFT_6.png'},
        {username: 'Merlioz', name: '#15', imageUrl: 'https://ipfs-gw.stargaze-apis.com/ipfs/QmeR2zrH6kwKhXMZhTD5gsHMk13oJoSfsCv7GCiP9YRjXk/7.png', imageNoBgUrl: 'https://rektgang.mypinata.cloud/ipfs/QmapVvcJhRspLHovj5Ji2UJ1KxFaAMZxwRkwErkUT6YFgS/NFT_7.png'},
        {username: 'Louis', name: '#37', imageUrl: 'https://ipfs-gw.stargaze-apis.com/ipfs/QmeR2zrH6kwKhXMZhTD5gsHMk13oJoSfsCv7GCiP9YRjXk/8.png', imageNoBgUrl: 'https://rektgang.mypinata.cloud/ipfs/QmapVvcJhRspLHovj5Ji2UJ1KxFaAMZxwRkwErkUT6YFgS/NFT_8.png'},
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

// resetRace
function resetRace() {
  // Clear the entire canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTrackLines();  // Assuming you have a function to redraw the track lines

  // Clear the chickens array
  chickens = [];

  const resetRaceButton = document.getElementById("resetRace");
  resetRaceButton.classList.remove("disabled");
  resetRaceButton.disabled = false;

  // Reset the "in-race" class for all chicken buttons
  availableChickens.forEach((chicken) => {
    const chickenElement = document.getElementById(`chicken-${chicken.id}`);
    if (chickenElement) {
      chickenElement.classList.remove("in-race");
    }
  });
}



// populateRaceResults
function populateRaceResults(sortedChickens) {
  // Get the podium and other positions elements
  const firstPlace = document.querySelector('.first-place');
  const secondPlace = document.querySelector('.second-place');
  const thirdPlace = document.querySelector('.third-place');
  const otherPositions = document.querySelector('.other-positions');

  // Clear previous results
  firstPlace.innerHTML = '';
  secondPlace.innerHTML = '';
  thirdPlace.innerHTML = '';
  otherPositions.innerHTML = '';

  // Populate the podium
  firstPlace.innerHTML = `<span>${sortedChickens[0].username}</span><span>${sortedChickens[0].name}</span><img src="${sortedChickens[0].imageNoBg.src}" class="result-img">`;
  secondPlace.innerHTML = `<span>${sortedChickens[1].username}</span><span>${sortedChickens[1].name}</span><img src="${sortedChickens[1].imageNoBg.src}" class="result-img">`;
  thirdPlace.innerHTML = `<span>${sortedChickens[2].username}</span><span>${sortedChickens[2].name}</span><img src="${sortedChickens[2].imageNoBg.src}" class="result-img">`;

  // Populate the other positions
  for (let i = 3; i < sortedChickens.length; i++) {
    const positionDiv = document.createElement('div');
    positionDiv.innerHTML = `<span>${i + 1}th ${sortedChickens[i].username} ${sortedChickens[i].name}</span>`;
    otherPositions.appendChild(positionDiv);
  }
  document.querySelector('.close-button').addEventListener('click', function() {
    document.querySelector('.race-results-content').style.display = 'none';
  });
}

function updateRacePopupText(stage) {
  let raceResultPopups = document.getElementsByClassName("raceResultPopup");
  let text = "";

  switch(stage) {
    case 1:
      text = "<span style='font-size:12px;'>Welcome to the race! Choose your 'Chickens' and click 'Start Race' to begin.</span>";
      break;
    case 2:
      text = "<span style='font-size:12px;'>Countdown started. Get ready!</span>";
      break;
    case 3:
      text = "<span style='font-size:12px;'>Race started! GO! GO! GO!</span>";
      break;
    case 5:
      text = "<span style='font-size:12px;'>Welcome back! Choose your 'Chickens' and click 'Start Race' to begin a new race.</span>";
      break;
    default:
      text = "";
  }

  for(let i = 0; i < raceResultPopups.length; i++) {
    raceResultPopups[i].innerHTML = text;
  }
}