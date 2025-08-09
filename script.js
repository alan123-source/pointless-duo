
    // Helper function to convert PCM audio data to WAV format
    const pcmToWav = (pcmData, sampleRate) => {
        const pcm16 = new Int16Array(pcmData);
        const numChannels = 1;
        const bitDepth = 16;
        const numSamples = pcm16.length;
        const buffer = new ArrayBuffer(44 + numSamples * 2);
        const view = new DataView(buffer);
        const writeString = (view, offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + numSamples * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, bitDepth, true);
        writeString(view, 36, 'data');
        view.setUint32(40, numSamples * 2, true);
        let offset = 44;
        for (let i = 0; i < pcm16.length; i++, offset += 2) {
            view.setInt16(offset, pcm16[i], true);
        }
        return new Blob([buffer], { type: 'audio/wav' });
    };

    const base64ToArrayBuffer = (base64) => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    };

    document.addEventListener("DOMContentLoaded", () => {
      // Get references to DOM elements
      const situationInput = document.getElementById("situation");
      const generateBtn = document.getElementById("generateBtn");
      const excuseContainer = document.getElementById("excuseContainer");
      const excusesList = document.getElementById("excusesList");
      const recentExcusesContainer = document.getElementById("recentExcusesContainer");
      const recentExcusesList = document.getElementById("recentExcusesList");
      const savedExcusesContainer = document.getElementById("savedExcusesContainer");
      const savedExcusesList = document.getElementById("savedExcusesList");
      const messageBox = document.getElementById("messageBox");

      // API key for the Gemini model
      const API_KEY = "";
      let currentExcuses = [];

      // A hardcoded array of excuses to be used instead of an API call
      const staticExcuses = [
        "A flock of pigeons mistook my bicycle for a giant bird feeder and I had to spend an hour shooing them away.",
        "I was delayed because my neighbor's cat got stuck in a tree, but it wasn't just a cat—it was a highly territorial Bengal tiger in a tiny cat's body.",
        "The WiFi router at my cafe started glowing with an otherworldly aura, and I spent an hour trying to decipher its cryptic messages.",
        "I was caught in a flash mob that was performing an interpretive dance about the history of toast.",
        "My digital assistant became sentient and decided it was the perfect time for a philosophical debate on the meaning of 'on time.'",
        "I got a sudden burst of inspiration to write a haiku about my shoe laces, and it took me a while to find the perfect metaphor.",
        "I had to help a group of squirrels who were attempting to build a miniature rollercoaster out of twigs and acorns.",
        "The bus driver challenged me to a staring contest, and I couldn't back down without compromising my honor.",
        "I accidentally joined a virtual reality game, and it took me an hour to find the 'exit' button.",
        "I was performing an archaeological dig in my backyard and uncovered what I believe to be a time capsule from a future civilization."
      ];

      // Function to show a custom, in-page message
      function showMessage(message, type = 'success') {
          messageBox.textContent = message;
          messageBox.style.backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
          messageBox.classList.add('visible');
          setTimeout(() => {
              messageBox.classList.remove('visible');
          }, 3000);
      }

      // --- UI Rendering Functions (using localStorage) ---
      function updateRecentUI() {
          const recent = JSON.parse(localStorage.getItem("recentExcuses") || "[]");
          if (recent.length > 0) {
              recentExcusesContainer.classList.remove("hidden");
          } else {
              recentExcusesContainer.classList.add("hidden");
          }
          recentExcusesList.innerHTML = recent.map(excuse => `<li>${excuse}</li>`).join('');
      }

      function updateSavedUI() {
          const saved = JSON.parse(localStorage.getItem("savedExcuses") || "[]");
          if (saved.length > 0) {
              savedExcusesContainer.classList.remove("hidden");
          } else {
              savedExcusesContainer.classList.add("hidden");
          }
          savedExcusesList.innerHTML = saved.map(excuse => `
              <li class="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                  <span>${excuse}</span>
                  <button class="delete-btn text-gray-500 hover:text-red-500 transition-colors" data-excuse="${excuse}">❌</button>
              </li>
          `).join('');

          document.querySelectorAll('.delete-btn').forEach(button => {
              button.addEventListener('click', (e) => {
                  const excuseToDelete = e.target.dataset.excuse;
                  let currentSaved = JSON.parse(localStorage.getItem("savedExcuses") || "[]");
                  const updatedSaved = currentSaved.filter(item => item !== excuseToDelete);
                  localStorage.setItem("savedExcuses", JSON.stringify(updatedSaved));
                  updateSavedUI();
                  showMessage("Excuse deleted!");
              });
          });
      }

      // Add to recent list with a max of 5
      function addToRecent(excuses) {
          let recent = JSON.parse(localStorage.getItem("recentExcuses") || "[]");
          excuses.forEach(excuse => {
              recent = recent.filter(item => item !== excuse);
              recent.unshift(excuse);
          });
          if (recent.length > 5) recent.splice(5);
          localStorage.setItem("recentExcuses", JSON.stringify(recent));
          updateRecentUI();
      }

      // --- Main Logic & Event Listeners ---
      generateBtn.addEventListener("click", () => {
          const situation = situationInput.value.trim();
          if (!situation) {
              showMessage("Please enter a situation first!", 'error');
              return;
          }

          generateBtn.textContent = 'Generating...';
          generateBtn.disabled = true;
          excuseContainer.classList.add("hidden");

          // Choose 3 random excuses from the static array
          const shuffled = [...staticExcuses].sort(() => 0.5 - Math.random());
          currentExcuses = shuffled.slice(0, 3);
          
          excusesList.innerHTML = currentExcuses.map(excuse => `
              <li class="p-4 bg-white rounded-lg shadow-md flex justify-between items-start">
                <span class="italic flex-grow">${excuse}</span>
                <div class="flex space-x-2 ml-4">
                  <button class="save-btn bg-yellow-500 text-white font-semibold py-1 px-2 rounded-full text-sm hover:bg-yellow-600 transition-colors play-btn" data-excuse="${excuse}">⭐</button>
                  <button class="copy-btn bg-green-500 text-white font-semibold py-1 px-2 rounded-full text-sm hover:bg-green-600 transition-colors" data-excuse="${excuse}">📋</button>
                  <button class="play-btn bg-gray-200 text-gray-800 font-semibold py-1 px-2 rounded-full text-sm hover:bg-gray-300 transition-colors" data-excuse="${excuse}">🔊</button>
                </div>
              </li>
          `).join('');
          excuseContainer.classList.remove("hidden");
          addToRecent(currentExcuses);

          // Attach event listeners for the new buttons
          document.querySelectorAll('.save-btn').forEach(btn => {
              btn.addEventListener('click', (e) => {
                  const text = e.target.dataset.excuse;
                  let saved = JSON.parse(localStorage.getItem("savedExcuses") || "[]");
                  if (!saved.includes(text)) {
                      saved.push(text);
                      localStorage.setItem("savedExcuses", JSON.stringify(saved));
                      showMessage("Excuse saved!");
                      updateSavedUI();
                  } else {
                      showMessage("Excuse already saved!", 'error');
                  }
              });
          });
          document.querySelectorAll('.copy-btn').forEach(btn => {
              btn.addEventListener('click', (e) => {
                  const text = e.target.dataset.excuse;
                  navigator.clipboard.writeText(text)
                      .then(() => showMessage("Excuse copied!"))
                      .catch(() => showMessage("Failed to copy.", 'error'));
              });
          });

          document.querySelectorAll('.play-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const text = e.target.dataset.excuse;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  });
});

   
          
          generateBtn.textContent = 'Generate Excuse';
          generateBtn.disabled = false;
      });

      // Initial UI load
      updateRecentUI();
      updateSavedUI();
    });
  