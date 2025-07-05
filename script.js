const editor = document.getElementById("note");
const addBlockBtn = document.getElementById("add-block");
const modeToggle = document.getElementById("mode");
const downloadBtn = document.getElementById("down");
const filesList = document.getElementById("files-list");
const rightPanel = document.getElementById("right-side");
const right = document.getElementById("right-side h3");


let notes = JSON.parse(localStorage.getItem("notes")) || {};
let currentNote = null;


// write the note 
function createBlock(type = "paragraph", content = "Type here...") {
  const block = document.createElement("div");
  block.className = "block";
  block.style.outline = "none"
  block.style.margin = ".8vw"
  block.dataset.type = type;
  block.setAttribute("draggable", "true");

  const contentDiv = document.createElement("div");
  contentDiv.className = "content";
  contentDiv.contentEditable = true;
  contentDiv.innerHTML = content;
  contentDiv.style.outline = "none"
  contentDiv.style.background = "var(--sec)"
  contentDiv.style.border = "none"

  block.appendChild(contentDiv);

  // Save on input
contentDiv.addEventListener("input", (e) => {
  if (currentNote) saveCurrentNote();

  // Slash command trigger
  const sel = window.getSelection();
  if (sel && sel.anchorNode && sel.anchorNode.nodeType === 3) {
    const text = sel.anchorNode.textContent;
    if (text.endsWith("/")) {
      showSlashMenu(block, sel.anchorNode);
    }
  }
});


  return block;
}

function renderEditor(noteData) {
  editor.innerHTML = "";
  noteData.blocks.forEach(({ type, content }) => {
    const block = createBlock(type, content);
    editor.appendChild(block);
  });
}

function saveCurrentNote() {
  const blocks = [...editor.querySelectorAll(".block")].map((block) => {
    const type = block.dataset.type;
    const content = block.querySelector(".content").innerHTML;
    return { type, content };
  });

  notes[currentNote] = { blocks };
  localStorage.setItem("notes", JSON.stringify(notes));
  renderNotesList();
}

function renderNotesList() {
  filesList.innerHTML = "";
  Object.keys(notes).forEach((title) => {
    const h3 = document.createElement("h3");
    h3.innerText = title;
    h3.style.cursor = "pointer";

    h3.addEventListener("click", () => {
      openNote(title);
    });

    // Delete button
    const del = document.createElement("span");
    del.innerText = " 🗑️";
    del.style.cursor = "pointer";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      delete notes[title];
      localStorage.setItem("notes", JSON.stringify(notes));
      renderNotesList();
      if (currentNote === title) {
        currentNote = null;
        editor.innerHTML = "";
      }
    });

    h3.appendChild(del);
    filesList.appendChild(h3);
  });
}

function openNote(title) {
  currentNote = title;
  renderEditor(notes[title]);
  // Only affect the note section
  editor.style.display = "block";
  editor.scrollIntoView({ behavior: "smooth", block: "start" });

  // Clear any previous minimize buttons
  const oldBtn = editor.querySelector("button.minimize-btn");
  if (oldBtn) oldBtn.remove();

  const minimizeBtn = document.createElement("button");
  minimizeBtn.innerText = "🔽 Minimize";
  minimizeBtn.className = "minimize-btn";
  minimizeBtn.style.margin = "10px 0";
  minimizeBtn.style.padding = ".5vw 1.5vw"
  minimizeBtn.style.backgroundColor = "lightblue"
  minimizeBtn.style.border = "none"
  minimizeBtn.style.borderRadius = "1vw"
  minimizeBtn.style.marginLeft = ".8vw"
  minimizeBtn.onclick = () => {
    editor.innerHTML = "";
    currentNote = null;
  };

  editor.prepend(minimizeBtn);
}



// create the note 

addBlockBtn.addEventListener("click", () => {
  const title = prompt("Enter new note title:");
  if (!title || notes[title]) return;
  notes[title] = { blocks: [] };
  localStorage.setItem("notes", JSON.stringify(notes));
  renderNotesList();
});

modeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(notes, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "notes.json";
  a.click();
});

// Ctrl+B, Ctrl+I, Ctrl+U
editor.addEventListener("keydown", (e) => {
  const active = document.activeElement;
  if (e.ctrlKey && active.classList.contains("content")) {
    if (e.key === "b") {
      e.preventDefault();
      document.execCommand("bold");
    } else if (e.key === "i") {
      e.preventDefault();
      document.execCommand("italic");
    } else if (e.key === "u") {
      e.preventDefault();
      document.execCommand("underline");
    }
  }
});

// Drag & drop
let dragSrc = null;

editor.addEventListener("dragstart", (e) => {
  if (e.target.classList.contains("block")) {
    dragSrc = e.target;
    e.dataTransfer.effectAllowed = "move";
  }
});

editor.addEventListener("dragover", (e) => {
  e.preventDefault();
  const dropTarget = e.target.closest(".block");
  if (dropTarget && dropTarget !== dragSrc) {
    dropTarget.classList.add("drop-target");
  }
});

editor.addEventListener("dragleave", (e) => {
  const leaveTarget = e.target.closest(".block");
  if (leaveTarget) {
    leaveTarget.classList.remove("drop-target");
  }
});

editor.addEventListener("drop", (e) => {
  e.preventDefault();
  const dropTarget = e.target.closest(".block");
  document.querySelectorAll(".drop-target").forEach(el =>
    el.classList.remove("drop-target")
  );

  if (dragSrc && dropTarget && dragSrc !== dropTarget) {
    editor.insertBefore(dragSrc, dropTarget.nextSibling);
    saveCurrentNote();
  }
});

//Ctrl + /
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "r") {
    e.preventDefault();
    showBlockPanel();
  }
  // ADD Ctrl + / for block panel
  if (e.ctrlKey && e.key === "/") {
    e.preventDefault();
    showBlockPanel();
  }
});


//notes panel
function showBlockPanel() {
  const panel = document.createElement("div");
  panel.id = "block-panel";
  panel.style.position = "fixed";
  panel.style.top = "20%";
  panel.style.left = "50%";
  panel.style.transform = "translateX(-50%)";
  panel.style.padding = "1rem";
  panel.style.background = "var(--pri)";
  panel.style.border = "1px solid #ccc";
  panel.style.borderRadius = "8px";
  panel.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
  panel.style.zIndex = "9999";
  panel.style.display = "flex";
  panel.style.flexDirection = "column";
  panel.style.gap = "10px";

  const blockTypes = ["Heading", "Paragraph", "Quote", "Checklist", "Code", "Cancel"];
  blockTypes.forEach((type) => {
    const btn = document.createElement("button");
    btn.innerText = type;
    btn.style.padding = "8px 12px";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "1rem";
    btn.style.borderRadius = "4px";
    btn.style.background = "var(--tri1)";
    btn.style.color = "var(--black)"

    btn.addEventListener("click", () => {
      if (type.toLowerCase() === "cancel") {
        document.body.removeChild(panel);
        return;
      }

      insertBlockByType(type.toLowerCase());
      document.body.removeChild(panel);
    });

    panel.appendChild(btn);
  });

  document.addEventListener("keydown", function escClose(e) {
    if (e.key === "Escape") {
      document.body.removeChild(panel);
      document.removeEventListener("keydown", escClose);
    }
  });

  document.body.appendChild(panel);
}

function updateBlockType(block, type) {
  block.dataset.type = type;
  const contentDiv = block.querySelector(".content");

  // Strip / command and insert appropriate wrapper
  let inner = contentDiv.innerText.replace("/", "").trim();

  switch (type) {
    case "h1": inner = `<h1>${inner}</h1>`; break;
    case "h2": inner = `<h2>${inner}</h2>`; break;
    case "h3": inner = `<h3>${inner}</h3>`; break;
    case "h4": inner = `<h4>${inner}</h4>`; break;
    case "h5": inner = `<h5>${inner}</h5>`; break;
    case "h6": inner = `<h6>${inner}</h6>`; break;
    case "quote": inner = `<blockquote>${inner}</blockquote>`; break;
    case "checklist": inner = `<label><input type="checkbox"> ${inner}</label>`; break;
    case "code": inner = `<pre><code>${inner}</code></pre>`; break;
    default: inner = inner || "Type here..."; break;
  }

  contentDiv.innerHTML = inner;
  saveCurrentNote();
}

function insertBlockByType(type) {
  let content = "Type here...";
  if (type === "heading") content = "<h1>Heading</h1>";
  else if (type === "quote") content = "<blockquote>Quote</blockquote>";
  else if (type === "checklist") content = '<label><input type="checkbox"> Task</label>';
  else if (type === "code") content = "<pre><code>// Your code</code></pre>";

  const block = createBlock(type, content);
  editor.appendChild(block);
  block.querySelector(".content").focus();
  saveCurrentNote();
}


//rules
document.getElementById('howtouse').addEventListener('click', function () {
  // Remove existing modal if open
  const existingModal = document.getElementById('howtouse-modal');
  if (existingModal) existingModal.remove();

  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'howtouse-modal';
  modal.style.position = 'fixed';
  modal.style.top = '50%';
  modal.style.left = '50%';
  modal.style.transform = 'translate(-50%, -50%)';
  modal.style.background = 'var(--tri2)';
  modal.style.padding = '20px';
  modal.style.border = '1px solid #ccc';
  modal.style.borderRadius = '8px';
  modal.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
  modal.style.zIndex = '10000';

  // Create content
  modal.innerHTML = `
    <h3>Features</h3>
    <ul style="padding-left: 20px;">
      <li>Press any note block OR</li>
      <li>Drag the block up or down</li>
      <li>create note , click note and👇</li>
      <li> press Ctrl + / </li>
      <li>Select and press <b>Ctrl + B</b> (Bold)</li>
      <li>Select and press <b>Ctrl + I</b> (Italic)</li>
      <li>Select and press <b>Ctrl + U</b> (Underline)</li>
    </ul>
    <button id="close-howtouse" style="margin-top: 10px;">Close</button>
  `;

  document.body.appendChild(modal);

  // Add close button event
  const closebtn = document.getElementById('close-howtouse');
  closebtn.addEventListener('click', function () {
    modal.remove();
  });
  closebtn.style.padding = ".5vw 1vw"
});


renderNotesList();
const noteTitles = Object.keys(notes);
if (noteTitles.length > 0) {
  openNote(noteTitles[0]);
}


