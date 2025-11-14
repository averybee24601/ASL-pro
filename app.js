const WORDS_PATH = "Data/Button%20Words/all%20words";
const DEFAULT_PROFILE_NAME = "Ella";
const LOCAL_STORAGE_KEY = "talkAslProfiles";
const CURRENT_KEY = "talkAslCurrentProfile";

const layoutOrder = [
  "dad",
  "mom",
  "grammy",
  "drink",
  "play",
  "sister",
  "eat",
  "me",
];

const defaultAssets = {
  dad: {
    label: "Dad",
    baseImage: "Data/Base%20button%20Pictures/IMG_0048.jpeg",
    aslImage: "Data/ASL%20Pictures/asl.1.png",
    instructions:
      "Spread your fingers, place your thumb at your forehead, and tap twice.",
  },
  mom: {
    label: "Mom",
    baseImage: "Data/Base%20button%20Pictures/IMG_0049.jpeg",
    aslImage: "Data/ASL%20Pictures/asl.2.png",
    instructions:
      "Open your hand with fingers apart. Tap your thumb to your chin two times.",
  },
  grammy: {
    label: "Grammy",
    baseImage: "Data/Base%20button%20Pictures/IMG_0050.jpeg",
    aslImage: "Data/ASL%20Pictures/asl.3.png",
    instructions:
      "Hold the mom handshape at your chin and flutter it forward in a small arc.",
  },
  drink: {
    label: "Drink",
    baseImage: "Data/Base%20button%20Pictures/IMG_0051.jpeg",
    aslImage: "Data/ASL%20Pictures/asl.4.png",
    instructions:
      "Make a C-shape like a cup and tilt it toward your mouth as if sipping.",
  },
  play: {
    label: "Play",
    baseImage: "Data/Base%20button%20Pictures/IMG_0058.jpeg",
    aslImage: "Data/ASL%20Pictures/asl.5.png",
    instructions:
      "Form Y-hands with both hands and twist them side to side in front of you.",
  },
  sister: {
    label: "Sister",
    baseImage: "Data/Base%20button%20Pictures/IMG_0066.jpeg",
    aslImage: "Data/ASL%20Pictures/asl.6.png",
    instructions:
      "Touch your dominant L-hand to your chin, then bring it down to rest on the other L-hand.",
  },
  eat: {
    label: "Eat",
    baseImage: "Data/Base%20button%20Pictures/IMG_0075.jpeg",
    aslImage: "Data/ASL%20Pictures/asl.7.png",
    instructions:
      "Bring pinched fingers toward your mouth repeatedly like taking small bites.",
  },
  me: {
    label: "Me",
    baseImage: "Data/Base%20button%20Pictures/IMG_2870.jpeg",
    aslImage: "Data/ASL%20Pictures/asl.8.png",
    instructions:
      "Point to the center of your chest with your index finger one or two times.",
  },
};

const els = {
  buttonGrid: document.getElementById("buttonGrid"),
  aslImage: document.getElementById("aslImage"),
  aslHow: document.getElementById("aslHow"),
  aslDescription: document.getElementById("aslDescription"),
  readAloud: document.getElementById("readAloudBtn"),
  profilesBtn: document.getElementById("profilesBtn"),
  aboutBtn: document.getElementById("aboutBtn"),
  reorderBtn: document.getElementById("reorderBtn"),
  voiceName: document.getElementById("voiceName"),
  profilesModal: document.getElementById("profilesModal"),
  aboutModal: document.getElementById("aboutModal"),
  profileSelect: document.getElementById("profileSelect"),
  profileNameInput: document.getElementById("profileNameInput"),
  saveProfileName: document.getElementById("saveProfileName"),
  deleteProfileBtn: document.getElementById("deleteProfileBtn"),
  createProfileForm: document.getElementById("createProfileForm"),
  newProfileInput: document.getElementById("newProfileInput"),
  buttonManagerList: document.getElementById("buttonManagerList"),
  addButtonToggle: document.getElementById("addButtonToggle"),
  buttonForm: document.getElementById("buttonForm"),
  buttonFormTitle: document.getElementById("buttonFormTitle"),
  buttonSubmit: document.getElementById("buttonSubmit"),
  cancelButtonEdit: document.getElementById("cancelButtonEdit"),
  buttonWord: document.getElementById("buttonWord"),
  buttonInstructions: document.getElementById("buttonInstructions"),
  buttonBaseImage: document.getElementById("buttonBaseImage"),
  buttonAslImage: document.getElementById("buttonAslImage"),
  basePreview: document.getElementById("basePreview"),
  aslPreview: document.getElementById("aslPreview"),
};

let profiles = {};
let currentProfileName = DEFAULT_PROFILE_NAME;
let editingButtonId = null;
let reorderMode = false;
let draggedButtonId = null;
let activeButtonId = null;

init();

async function init() {
  attachListeners();
  const storedProfiles = getStoredProfiles();
  if (storedProfiles) {
    profiles = Object.fromEntries(
      Object.entries(storedProfiles).map(([name, data]) => [
        name,
        normalizeProfile(data),
      ])
    );
  }

  const words = await loadWordList();
  if (!profiles[DEFAULT_PROFILE_NAME]) {
    profiles[DEFAULT_PROFILE_NAME] = buildDefaultProfile(words);
  }

  const storedCurrent = localStorage.getItem(CURRENT_KEY);
  if (storedCurrent && profiles[storedCurrent]) {
    currentProfileName = storedCurrent;
  }

  persistProfiles();
  renderProfileOptions();
  updateVoiceName();
  renderButtons();
  renderButtonManager();
  focusFirstButton();
}

function attachListeners() {
  els.profilesBtn.addEventListener("click", () => openModal(els.profilesModal));
  els.aboutBtn.addEventListener("click", () => openModal(els.aboutModal));
  els.reorderBtn.addEventListener("click", toggleReorderMode);
  els.readAloud.addEventListener("click", () => {
    const button = getCurrentButtons().find((btn) => btn.id === activeButtonId);
    const text = button?.instructions || button?.word || "";
    speak(text);
  });

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const targetId = event.currentTarget.getAttribute("data-close");
      const modal = document.getElementById(targetId);
      closeModal(modal);
    });
  });

  [els.profilesModal, els.aboutModal].forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal(modal);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      [els.profilesModal, els.aboutModal].forEach(closeModal);
    }
  });

  els.profileSelect.addEventListener("change", (event) => {
    setCurrentProfile(event.target.value);
  });

  els.saveProfileName.addEventListener("click", () => {
    const nextName = els.profileNameInput.value.trim();
    if (!nextName || nextName === currentProfileName) return;
    renameProfile(nextName);
  });

  els.deleteProfileBtn.addEventListener("click", () => {
    if (currentProfileName === DEFAULT_PROFILE_NAME) return;
    delete profiles[currentProfileName];
    currentProfileName = DEFAULT_PROFILE_NAME;
    persistProfiles();
    renderProfileOptions();
    updateVoiceName();
    renderButtons();
    renderButtonManager();
  });

  els.createProfileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = els.newProfileInput.value.trim();
    if (!name) return;
    if (profiles[name]) {
      alert("That profile name already exists.");
      return;
    }
    profiles[name] = { name, buttons: [] };
    els.newProfileInput.value = "";
    setCurrentProfile(name);
    persistProfiles();
    renderProfileOptions();
    renderButtonManager();
  });

  els.addButtonToggle.addEventListener("click", () => {
    if (els.buttonForm.classList.contains("hidden")) {
      startAddButton();
    } else {
      clearButtonForm();
      els.buttonForm.classList.add("hidden");
    }
  });

  els.buttonForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveButtonChanges();
  });

  els.cancelButtonEdit.addEventListener("click", () => {
    clearButtonForm();
    els.buttonForm.classList.add("hidden");
  });

  [els.buttonBaseImage, els.buttonAslImage].forEach((input) => {
    input.addEventListener("change", () => updatePreview(input));
  });

  els.buttonManagerList.addEventListener("click", (event) => {
    const editId = event.target.getAttribute("data-edit");
    const deleteId = event.target.getAttribute("data-delete");
    if (editId) {
      startEditButton(editId);
    } else if (deleteId) {
      deleteButton(deleteId);
    }
  });
}

function getStoredProfiles() {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Unable to parse stored profiles", error);
    return null;
  }
}

function persistProfiles() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profiles));
  localStorage.setItem(CURRENT_KEY, currentProfileName);
}

async function loadWordList() {
  try {
    const response = await fetch(WORDS_PATH);
    if (!response.ok) throw new Error("Unable to load word list");
    const text = await response.text();
    return text
      .split(/\r?\n/)
      .map((word) => word.trim().toLowerCase())
      .filter(Boolean);
  } catch (error) {
    console.warn("Word list could not be loaded:", error);
    return layoutOrder;
  }
}

function buildDefaultProfile(words) {
  const wordSet = new Set(words);
  const buttons = layoutOrder
    .filter((key) => !wordSet.size || wordSet.has(key))
    .map((key) => {
      const asset = defaultAssets[key] || {};
      return {
        id: createId(),
        word: asset.label || formatWord(key),
        baseImage: asset.baseImage || "",
        aslImage: asset.aslImage || "",
        instructions: asset.instructions || defaultInstruction(key),
      };
    });
  return { name: DEFAULT_PROFILE_NAME, buttons };
}

function normalizeProfile(profile) {
  const safeButtons = Array.isArray(profile.buttons) ? profile.buttons : [];
  return {
    name: profile.name || DEFAULT_PROFILE_NAME,
    buttons: safeButtons.map((button) => ({
      id: button.id || createId(),
      word: button.word || "Word",
      baseImage: button.baseImage || "",
      aslImage: button.aslImage || "",
      instructions: button.instructions || defaultInstruction(button.word),
    })),
  };
}

function renderButtons() {
  els.buttonGrid.innerHTML = "";
  const buttons = getCurrentButtons();
  buttons.forEach((button) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "talk-button";
    card.dataset.id = button.id;
    card.innerHTML = `
      <div class="photo" style="background-image:url('${resolveSrc(
        button.baseImage
      )}')"></div>
      <div class="label">${button.word}</div>
    `;

    if (reorderMode) {
      card.draggable = true;
      card.addEventListener("dragstart", handleDragStart);
      card.addEventListener("dragover", handleDragOver);
      card.addEventListener("drop", handleDrop);
    } else {
      card.addEventListener("click", () => handleButtonPress(button));
    }

    els.buttonGrid.appendChild(card);
  });

  document.body.classList.toggle("reorder-mode", reorderMode);
}

function handleButtonPress(button) {
  speak(button.word);
  showAslCard(button);
}

function speak(text) {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

function showAslCard(button) {
  activeButtonId = button.id;
  els.aslImage.src = resolveSrc(button.aslImage) || placeholderImage();
  els.aslImage.alt = `ASL sign for ${button.word}`;
  els.aslHow.textContent = `How to sign: ${button.word}`;
  els.aslDescription.textContent =
    button.instructions || defaultInstruction(button.word);
}

function placeholderImage() {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="100%" height="100%" rx="24" fill="%23e5e9ff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%238a9eff" font-family="Poppins" font-size="24">No Image</text></svg>`;
}

function renderProfileOptions() {
  els.profileSelect.innerHTML = "";
  Object.keys(profiles).forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    if (name === currentProfileName) option.selected = true;
    els.profileSelect.appendChild(option);
  });
  els.profileNameInput.value = currentProfileName;
  els.deleteProfileBtn.disabled = currentProfileName === DEFAULT_PROFILE_NAME;
}

function renderButtonManager() {
  const buttons = getCurrentButtons();
  if (!buttons.length) {
    els.buttonManagerList.innerHTML =
      '<p class="empty">No buttons yet. Add one to get started.</p>';
    return;
  }

  els.buttonManagerList.innerHTML = buttons
    .map(
      (button) => `
        <div class="manager-row">
          <div>
            <strong>${button.word}</strong>
            <div class="helper">${truncate(button.instructions, 80)}</div>
          </div>
          <div class="actions">
            <button data-edit="${button.id}">Edit</button>
            <button data-delete="${button.id}">Delete</button>
          </div>
        </div>`
    )
    .join("");
}

function startAddButton() {
  editingButtonId = null;
  els.buttonFormTitle.textContent = "Add Button";
  els.buttonSubmit.textContent = "Save Button";
  clearButtonForm();
  els.buttonForm.classList.remove("hidden");
}

function startEditButton(id) {
  const button = getCurrentButtons().find((btn) => btn.id === id);
  if (!button) return;
  editingButtonId = id;
  els.buttonFormTitle.textContent = `Edit ${button.word}`;
  els.buttonSubmit.textContent = "Update Button";
  els.buttonWord.value = button.word;
  els.buttonInstructions.value =
    button.instructions || defaultInstruction(button.word);
  updatePreviewElement(els.basePreview, button.baseImage);
  updatePreviewElement(els.aslPreview, button.aslImage);
  els.buttonForm.classList.remove("hidden");
}

async function saveButtonChanges() {
  const wordRaw = els.buttonWord.value.trim();
  if (!wordRaw) return;
  const instructions = els.buttonInstructions.value.trim();
  const baseFile = els.buttonBaseImage.files[0];
  const aslFile = els.buttonAslImage.files[0];

  const buttons = getCurrentButtons();
  const existing = buttons.find((btn) => btn.id === editingButtonId);

  const baseImage = baseFile
    ? await fileToDataUrl(baseFile)
    : existing?.baseImage || defaultAssetsFallback(wordRaw).baseImage || "";
  const aslImage = aslFile
    ? await fileToDataUrl(aslFile)
    : existing?.aslImage || defaultAssetsFallback(wordRaw).aslImage || "";

  const buttonData = {
    id: editingButtonId || createId(),
    word: formatWord(wordRaw),
    baseImage,
    aslImage,
    instructions:
      instructions || existing?.instructions || defaultInstruction(wordRaw),
  };

  if (editingButtonId) {
    const index = buttons.findIndex((btn) => btn.id === editingButtonId);
    buttons.splice(index, 1, buttonData);
  } else {
    buttons.push(buttonData);
  }

  profiles[currentProfileName].buttons = buttons;
  persistProfiles();
  renderButtons();
  renderButtonManager();
  clearButtonForm();
  els.buttonForm.classList.add("hidden");
}

function deleteButton(id) {
  const buttons = getCurrentButtons().filter((btn) => btn.id !== id);
  profiles[currentProfileName].buttons = buttons;
  persistProfiles();
  renderButtons();
  renderButtonManager();
}

function toggleReorderMode() {
  reorderMode = !reorderMode;
  els.reorderBtn.classList.toggle("chip", true);
  els.reorderBtn.classList.toggle("active", reorderMode);
  renderButtons();
}

function handleDragStart(event) {
  draggedButtonId = event.currentTarget.dataset.id;
  event.dataTransfer.effectAllowed = "move";
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleDrop(event) {
  event.preventDefault();
  const targetId = event.currentTarget.dataset.id;
  if (!draggedButtonId || draggedButtonId === targetId) return;
  const buttons = getCurrentButtons();
  const sourceIndex = buttons.findIndex((btn) => btn.id === draggedButtonId);
  const targetIndex = buttons.findIndex((btn) => btn.id === targetId);
  const [moved] = buttons.splice(sourceIndex, 1);
  buttons.splice(targetIndex, 0, moved);
  profiles[currentProfileName].buttons = buttons;
  persistProfiles();
  renderButtons();
  renderButtonManager();
}

function updatePreview(input) {
  const preview =
    input === els.buttonBaseImage ? els.basePreview : els.aslPreview;
  const file = input.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.classList.add("visible");
  } else {
    preview.src = "";
    preview.classList.remove("visible");
  }
}

function updatePreviewElement(element, source) {
  if (source) {
    element.src = resolveSrc(source);
    element.classList.add("visible");
  } else {
    element.src = "";
    element.classList.remove("visible");
  }
}

function clearButtonForm() {
  editingButtonId = null;
  els.buttonForm.reset();
  [els.basePreview, els.aslPreview].forEach((img) => {
    img.src = "";
    img.classList.remove("visible");
  });
}

function renameProfile(newName) {
  if (profiles[newName]) {
    alert("That profile name already exists.");
    return;
  }
  profiles[newName] = { ...profiles[currentProfileName], name: newName };
  delete profiles[currentProfileName];
  currentProfileName = newName;
  persistProfiles();
  renderProfileOptions();
  updateVoiceName();
}

function setCurrentProfile(name) {
  if (!profiles[name]) return;
  currentProfileName = name;
  persistProfiles();
  renderProfileOptions();
  renderButtons();
  renderButtonManager();
  updateVoiceName();
  focusFirstButton();
}

function updateVoiceName() {
  const suffix = currentProfileName.toLowerCase().endsWith("s") ? "'" : "'s";
  els.voiceName.textContent = `${currentProfileName}${suffix} Voice`;
}

function focusFirstButton() {
  const first = getCurrentButtons()[0];
  if (first) {
    showAslCard(first);
  } else {
    activeButtonId = null;
    els.aslHow.textContent = "How to sign: —";
    els.aslDescription.textContent =
      "Add buttons to this profile to start practicing signs.";
    els.aslImage.src = placeholderImage();
  }
}

function openModal(modal) {
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  modal.classList.add("hidden");
}

function getCurrentButtons() {
  return profiles[currentProfileName]?.buttons || [];
}

function createId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resolveSrc(path = "") {
  if (!path) return "";
  if (path.startsWith("data:")) return path;
  return path.replace(/ /g, "%20");
}

function formatWord(word = "") {
  return word
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function defaultInstruction(word = "the word") {
  return `Practice saying “${formatWord(
    word
  )}” and use the ASL picture as your guide.`;
}

function defaultAssetsFallback(word = "") {
  const key = word.toLowerCase();
  return defaultAssets[key] || {};
}

function truncate(text = "", limit = 60) {
  if (!text) return "";
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

