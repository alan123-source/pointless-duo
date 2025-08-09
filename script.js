 // Wait until DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Get references to elements
  const situationInput = document.getElementById("situation");
  const generateBtn = document.getElementById("generateBtn");
  const excuseContainer = document.getElementById("excuseContainer");
  const excuseText = document.getElementById("excuseText");
  const playBtn = document.getElementById("playBtn");
  const copyBtn = document.getElementById("copyBtn");
  const saveBtn = document.getElementById("saveBtn");
  const recentExcusesList = document.getElementById("recentExcusesList");
  const savedExcusesList = document.getElementById("savedExcusesList");

  // Function to display excuse
  function displayExcuse(text) {
    excuseText.textContent = text;
    excuseContainer.classList.remove("hidden");
  }

    // Add excuse to recent list (max 5)
  function addToRecent(excuse) {
    let recent = JSON.parse(localStorage.getItem("recentExcuses") || "[]");
    // Avoid duplicates; remove if exists
    recent = recent.filter(item => item !== excuse);
    recent.unshift(excuse);
    if (recent.length > 5) recent.pop();
    localStorage.setItem("recentExcuses", JSON.stringify(recent));
    updateRecentUI();
  }

  // Update recent excuses UI list
  function updateRecentUI() {
    recentExcusesList.innerHTML = "";
    let recent = JSON.parse(localStorage.getItem("recentExcuses") || "[]");
    recent.forEach(excuse => {
      const li = document.createElement("li");
      li.textContent = excuse;
      recentExcusesList.appendChild(li);
    });
  }

  // Update saved excuses UI list
 function updateSavedUI() {
  savedExcusesList.innerHTML = "";
  let saved = JSON.parse(localStorage.getItem("savedExcuses") || "[]");

  saved.forEach((excuse, index) => {
    const li = document.createElement("li");
    li.textContent = excuse;

    // Create delete button
    const delBtn = document.createElement("button");
    delBtn.classList.add("dlt-button");
    delBtn.textContent = "❌";
    delBtn.style.marginLeft = "10px";
    delBtn.style.cursor = "pointer";

    // Delete handler
    delBtn.addEventListener("click", () => {
      saved.splice(index, 1);  // remove excuse at index
      localStorage.setItem("savedExcuses", JSON.stringify(saved));
      updateSavedUI();          // refresh the list
    });

    li.appendChild(delBtn);
    savedExcusesList.appendChild(li);
  });
}


  // Generate excuse on button click (placeholder for now)
  generateBtn.addEventListener("click", () => {
    const situation = situationInput.value.trim();
    if (!situation) {
      alert("Please enter a situation first!");
      return;
    }
    // For now, a fixed fake excuse
    const fakeExcuse = "my dog ate my  homework";
    displayExcuse(fakeExcuse);

    addToRecent(fakeExcuse);
  });

  // Play voice of excuse text
  playBtn.addEventListener("click", () => {
    const text = excuseText.textContent;
    if (text) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
    }
  });

  // Copy excuse text to clipboard
  copyBtn.addEventListener("click", () => {
    const text = excuseText.textContent;
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        alert("Excuse copied to clipboard!");
      });
    }
  });

  // Save excuse to localStorage
  saveBtn.addEventListener("click", () => {
    const text = excuseText.textContent;
    if (!text) return;

    let saved = JSON.parse(localStorage.getItem("savedExcuses") || "[]");
    if (!saved.includes(text)) {
      saved.push(text);
      localStorage.setItem("savedExcuses", JSON.stringify(saved));
      alert("Excuse saved!");
      updateSavedUI();
    } else {
      alert("Excuse already saved!");
    }
  });
   updateRecentUI();
   updateSavedUI();
});
