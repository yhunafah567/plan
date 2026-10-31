const taskForm = document.getElementById("Task-form");
const taskInput = document.getElementById("Task-input");
const taskDescription = document.getElementById("Task-description");
const taskList = document.getElementById("Task-list");
const filterButtons = document.querySelectorAll("#Filter-buttons button");
const submitBtn = taskForm.querySelector("button[type='submit']");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";
let editingId = null; // the id of the task being edited, or null

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ---------- Clapping sound (made in code, no file needed) ----------
let audioCtx;

function playClap() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();

  const claps = 6;   // how many claps
  const gap = 0.55;  // seconds between claps (bigger = slower)

  for (let i = 0; i < claps; i++) {
    const clapTime = audioCtx.currentTime + i * gap + Math.random() * 0.03;

    // Layer a few "hands" together so each clap sounds full and warm
    for (let h = 0; h < 4; h++) {
      const start = clapTime + Math.random() * 0.025;
      const length = Math.floor(audioCtx.sampleRate * 0.18);

      const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < length; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 2.5);
      }

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 700 + Math.random() * 900; // lower = warmer
      filter.Q.value = 0.7;

      const gain = audioCtx.createGain();
      gain.gain.value = (0.3 + Math.random() * 0.15) * (1 - i * 0.06); // fades slightly

      source.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      source.start(start);
    }
  }
}

// ---------- Drawing the list ----------
function renderTasks() {
  taskList.innerHTML = "";

  const visibleTasks = tasks.filter(function (task) {
    if (currentFilter === "pending") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  visibleTasks.forEach(function (task) {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-start";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "form-check-input me-2 mt-2";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", function () {
      task.completed = checkbox.checked;
      if (checkbox.checked) playClap();
      saveTasks();
      renderTasks();
    });

    const text = document.createElement("div");
    text.innerHTML = "<strong></strong><br><small></small>";
    text.querySelector("strong").textContent = task.title;
    text.querySelector("small").textContent = task.description;

    if (task.completed) {
      text.querySelector("strong").classList.add("text-decoration-line-through", "text-muted");
    }

    const left = document.createElement("div");
    left.className = "d-flex align-items-start";
    left.appendChild(checkbox);
    left.appendChild(text);

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "btn btn-sm btn-outline-secondary me-2";
    editBtn.addEventListener("click", function () {
      editingId = task.id;
      taskInput.value = task.title;
      taskDescription.value = task.description;
      submitBtn.textContent = "Save changes";
      taskInput.focus();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "btn btn-sm btn-danger";
    deleteBtn.addEventListener("click", function () {
      // If this task was being edited, cancel the edit
      if (editingId === task.id) {
        editingId = null;
        submitBtn.textContent = "Add";
        taskForm.reset();
      }
      tasks = tasks.filter(function (t) {
        return t.id !== task.id;
      });
      saveTasks();
      renderTasks();
    });

    const buttons = document.createElement("div");
    buttons.className = "d-flex flex-shrink-0 ms-2";
    buttons.appendChild(editBtn);
    buttons.appendChild(deleteBtn);

    li.appendChild(left);
    li.appendChild(buttons);
    taskList.appendChild(li);
  });
}

// ---------- Add or edit a task ----------
taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = taskInput.value.trim();
  const description = taskDescription.value.trim();
  if (title === "") return;

  if (editingId !== null) {
    // Update the existing task
    const task = tasks.find(function (t) {
      return t.id === editingId;
    });
    task.title = title;
    task.description = description;
    editingId = null;
    submitBtn.textContent = "Add";
  } else {
    // Add a new task
    tasks.push({
      id: Date.now(),
      title: title,
      description: description,
      completed: false,
      createdAt: Date.now(),
    });
  }

  saveTasks();
  renderTasks();
  taskForm.reset();
});

// ---------- Filter buttons ----------
filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    currentFilter = button.dataset.filter;
    filterButtons.forEach(function (b) {
      b.classList.remove("active");
    });
    button.classList.add("active");
    renderTasks();
  });
});

renderTasks();

// ---------- Makes it installable as an app ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}