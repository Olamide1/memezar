// Variable declarations
const imageUpload = document.getElementById('imageUpload');
const memeCanvas = document.getElementById('memeCanvas');
const ctx = memeCanvas.getContext('2d');
const generateMeme = document.getElementById('generateMeme');
const downloadMeme = document.getElementById('downloadMeme');
const stickerSelect = document.getElementById('stickerSelect');
const templateSelect = document.getElementById('templateSelect');
const autoCaption = document.getElementById('autoCaption');
const cropButton = document.getElementById('cropButton');
const rotateButton = document.getElementById('rotateButton');
const flipButton = document.getElementById('flipButton');
const clearCanvasButton = document.getElementById('clearCanvasButton');
const addTextBoxButton = document.getElementById('addTextBox');
const textBoxList = document.getElementById('textBoxList');
const textBoxTextInput = document.getElementById('textBoxText');
const textBoxFontSelect = document.getElementById('textBoxFont');
const textBoxFontSizeInput = document.getElementById('textBoxFontSize');
const textBoxFontColorInput = document.getElementById('textBoxFontColor');

document.getElementById('saveProject').addEventListener('click', saveProject);
document.getElementById('loadProjects').addEventListener('click', loadProjects);
document.getElementById('updateProject').addEventListener('click', updateProject);

let db;
let currentProjectId = null;
let uploadedImage = null;
let stickers = [];
let selectedStickerIndex = null;
let rotationAngle = 0;
let flipped = false;

let textBoxes = [];
let selectedTextBoxIndex = null;

// Undo/Redo stacks
let undoStack = [];
let redoStack = [];

const memeTemplates = {
    drake: 'https://i.imgflip.com/30b1gx.jpg',
    distractedBoyfriend: 'https://i.imgflip.com/1ur9b0.jpg',
    twoButtons: 'https://i.imgflip.com/1g8my4.jpg',
    gruPlan: 'https://i.imgflip.com/26jxvz.jpg',
    changeMyMind: 'https://i.imgflip.com/24y43o.jpg',
    successKid: 'https://i.imgflip.com/1bhk.jpg',
    rollSafe: 'https://i.imgflip.com/1h7in3.jpg',
    oneDoesNotSimply: 'https://i.imgflip.com/1bij.jpg',
    futuramaFry: 'https://i.imgflip.com/1bgw.jpg',
    evilKermit: 'https://i.imgflip.com/1e7ql7.jpg',
    braceYourselves: 'https://i.imgflip.com/1bhm.jpg',
    spongebobMocking: 'https://i.imgflip.com/1otk96.jpg',
    surprisedPikachu: 'https://i.imgflip.com/2kbn1e.jpg',
    cryingMichaelJordan: 'https://i.imgflip.com/1wz1x.jpg',
    grumpyCat: 'https://i.imgflip.com/8p0a.jpg',
    badLuckBrian: 'https://i.imgflip.com/1bip.jpg',
    yUNo: 'https://i.imgflip.com/1bh3.jpg',
    doge: 'https://i.imgflip.com/4t0m5.jpg',
    thisIsFine: 'https://i.imgflip.com/wxica.jpg',
    womanYellingAtCat: 'https://i.imgflip.com/345v97.jpg',
    // Custom Templates
    captainHolt: 'template_image/capt_Holt.jpg',
    darkMaga: 'template_image/dark_maga.png',
    darkMaga2: 'template_image/dark_maga2.jpeg',
    nakedOp: 'template_image/naked_oppeneimher.jpeg',
    whiteHousePresser: 'template_image/white_house_presser.jpeg',
    adviceYourself: 'template_image/advice_yourself.jpeg'
};

// IndexedDB setup
const request = indexedDB.open('MemeProjectsDB', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const store = db.createObjectStore('memeProjects', { keyPath: 'id', autoIncrement: true });
    store.createIndex('name', 'name', { unique: false });
};

request.onsuccess = function(event) {
    db = event.target.result;
    console.log('Database opened successfully');
    loadProjects();
};

request.onerror = function(event) {
    console.error('Database error:', event.target.errorCode);
};

function isDbReady() {
    if (!db) {
        alert('Database is not ready yet. Please try again later.');
        return false;
    }
    return true;
}

// Save current state for undo functionality
function saveState() {
    const state = {
        uploadedImageSrc: uploadedImage ? uploadedImage.src : null,
        textBoxes: JSON.parse(JSON.stringify(textBoxes)),
        stickers: JSON.parse(JSON.stringify(stickers)),
        rotationAngle: rotationAngle,
        flipped: flipped
    };
    undoStack.push(state);
    // Limit undo stack size to prevent memory issues
    if (undoStack.length > 50) {
        undoStack.shift();
    }
    // Clear redo stack whenever a new action is performed
    redoStack = [];
}

// Undo and redo functions
function undo() {
    if (undoStack.length > 0) {
        const state = undoStack.pop();
        redoStack.push(getCurrentState());
        applyState(state);
    }
}

function redo() {
    if (redoStack.length > 0) {
        const state = redoStack.pop();
        undoStack.push(getCurrentState());
        applyState(state);
    }
}

function getCurrentState() {
    return {
        uploadedImageSrc: uploadedImage ? uploadedImage.src : null,
        textBoxes: JSON.parse(JSON.stringify(textBoxes)),
        stickers: JSON.parse(JSON.stringify(stickers)),
        rotationAngle: rotationAngle,
        flipped: flipped
    };
}

function applyState(state) {
    if (state.uploadedImageSrc) {
        uploadedImage = new Image();
        uploadedImage.src = state.uploadedImageSrc;
        uploadedImage.onload = () => {
            textBoxes = state.textBoxes || [];
            stickers = state.stickers || [];
            rotationAngle = state.rotationAngle || 0;
            flipped = state.flipped || false;

            updateTextBoxList();
            updateTextBoxControls();
            redrawCanvas();
        };
    } else {
        uploadedImage = null;
        textBoxes = [];
        stickers = [];
        rotationAngle = 0;
        flipped = false;

        updateTextBoxList();
        updateTextBoxControls();
        redrawCanvas();
    }
}

// Keyboard event listeners for undo/redo and clear canvas
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        undo();
    } else if (event.ctrlKey && event.key === 'y') {
        event.preventDefault();
        redo();
    } else if (event.key === 'Delete') {
        clearCanvas();
    }
});

// Clear canvas function
function clearCanvas() {
    saveState();
    uploadedImage = null;
    textBoxes = [];
    stickers = [];
    rotationAngle = 0;
    flipped = false;
    currentProjectId = null;
    updateTextBoxList();
    updateTextBoxControls();
    redrawCanvas();
}

// Clear canvas button event listener
clearCanvasButton.addEventListener('click', () => {
    clearCanvas();
});

// Template selection event listener
templateSelect.addEventListener('change', () => {
    saveState();
    const selectedTemplate = templateSelect.value;
    if (selectedTemplate) {
        uploadedImage = new Image();
        uploadedImage.crossOrigin = 'anonymous';
        uploadedImage.src = memeTemplates[selectedTemplate];
        uploadedImage.onload = () => {
            redrawCanvas();
        };
        uploadedImage.onerror = () => {
            alert('Error loading meme template. Please try again.');
        };
    }
});

// Image upload event listener
imageUpload.addEventListener('change', (event) => {
    saveState();
    const reader = new FileReader();
    reader.onload = () => {
        uploadedImage = new Image();
        uploadedImage.src = reader.result;
        uploadedImage.onload = () => {
            redrawCanvas();
        };
        uploadedImage.onerror = () => {
            alert('Error loading the image. Please try again with a different file.');
        };
    };
    reader.readAsDataURL(event.target.files[0]);
});

// Sticker selection event listener
stickerSelect.addEventListener('change', () => {
    const selectedSticker = stickerSelect.value;
    if (selectedSticker) {
        saveState();
        stickers.push({
            emoji: stickerSelect.options[stickerSelect.selectedIndex].text,
            x: memeCanvas.width / 2,
            y: memeCanvas.height / 2
        });
        stickerSelect.value = "";
        redrawCanvas();
    }
});

// Canvas event listeners for dragging text boxes and stickers
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

memeCanvas.addEventListener('mousedown', (event) => {
    isDragging = true;
    const rect = memeCanvas.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) * (memeCanvas.width / rect.width);
    const mouseY = (event.clientY - rect.top) * (memeCanvas.height / rect.height);

    selectedStickerIndex = null;
    selectedTextBoxIndex = null;

    // Check if a sticker is clicked
    for (let i = stickers.length - 1; i >= 0; i--) {
        const sticker = stickers[i];
        const distance = Math.sqrt((mouseX - sticker.x) ** 2 + (mouseY - sticker.y) ** 2);
        if (distance < 25) {
            selectedStickerIndex = i;
            dragOffsetX = mouseX - sticker.x;
            dragOffsetY = mouseY - sticker.y;
            break;
        }
    }

    // Check if a text box is clicked
    if (selectedStickerIndex === null) {
        for (let i = textBoxes.length - 1; i >= 0; i--) {
            const textBox = textBoxes[i];
            if (textBox.contains(mouseX, mouseY)) {
                selectedTextBoxIndex = i;
                dragOffsetX = mouseX - textBox.x;
                dragOffsetY = mouseY - textBox.y;
                updateTextBoxControls();
                break;
            }
        }
    }
});

memeCanvas.addEventListener('mousemove', (event) => {
    if (!isDragging) return;

    const rect = memeCanvas.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) * (memeCanvas.width / rect.width);
    const mouseY = (event.clientY - rect.top) * (memeCanvas.height / rect.height);

    if (selectedStickerIndex !== null) {
        stickers[selectedStickerIndex].x = mouseX - dragOffsetX;
        stickers[selectedStickerIndex].y = mouseY - dragOffsetY;
        redrawCanvas();
    } else if (selectedTextBoxIndex !== null) {
        textBoxes[selectedTextBoxIndex].x = mouseX - dragOffsetX;
        textBoxes[selectedTextBoxIndex].y = mouseY - dragOffsetY;
        redrawCanvas();
    }
});

memeCanvas.addEventListener('mouseup', () => {
    if (isDragging) {
        saveState();
    }
    isDragging = false;
});

memeCanvas.addEventListener('mouseleave', () => {
    if (isDragging) {
        saveState();
    }
    isDragging = false;
});

// Auto-caption event listener
autoCaption.addEventListener('click', () => {
    const selectedTemplate = templateSelect.value;
    if (selectedTemplate) {
        saveState();
        let captions = [];
        const canvasWidth = memeCanvas.width;
        const canvasHeight = memeCanvas.height;
        switch (selectedTemplate) {
            case 'drake':
                captions.push({ text: 'Not Cool', x: canvasWidth / 2, y: canvasHeight / 4 });
                captions.push({ text: 'Cool', x: canvasWidth / 2, y: (canvasHeight / 4) * 3 });
                break;
            case 'distractedBoyfriend':
                captions.push({ text: 'Me', x: canvasWidth * 0.35, y: canvasHeight * 0.6 });
                captions.push({ text: 'My Responsibilities', x: canvasWidth * 0.7, y: canvasHeight * 0.4 });
                captions.push({ text: 'New Distraction', x: canvasWidth * 0.55, y: canvasHeight * 0.8 });
                break;
            case 'twoButtons':
                captions.push({ text: 'Option 1', x: canvasWidth * 0.3, y: canvasHeight * 0.45 });
                captions.push({ text: 'Option 2', x: canvasWidth * 0.7, y: canvasHeight * 0.45 });
                captions.push({ text: 'Sweating Man', x: canvasWidth * 0.5, y: canvasHeight * 0.85 });
                break;
            case 'gruPlan':
                captions.push({ text: 'Plan 1', x: canvasWidth * 0.25, y: canvasHeight * 0.25 });
                captions.push({ text: 'Plan 2', x: canvasWidth * 0.75, y: canvasHeight * 0.25 });
                captions.push({ text: 'Plan 3', x: canvasWidth * 0.25, y: canvasHeight * 0.75 });
                captions.push({ text: 'Fail', x: canvasWidth * 0.75, y: canvasHeight * 0.75 });
                break;
            case 'changeMyMind':
                captions.push({ text: 'Your Statement Here', x: canvasWidth * 0.5, y: canvasHeight * 0.6 });
                break;
            case 'successKid':
                captions.push({ text: 'Top Text', x: canvasWidth / 2, y: canvasHeight * 0.1 });
                captions.push({ text: 'Bottom Text', x: canvasWidth / 2, y: canvasHeight * 0.9 });
                break;
            case 'rollSafe':
                captions.push({ text: 'When you...', x: canvasWidth / 2, y: canvasHeight * 0.1 });
                break;
            case 'oneDoesNotSimply':
                captions.push({ text: 'One Does Not Simply...', x: canvasWidth / 2, y: canvasHeight * 0.1 });
                break;
            case 'futuramaFry':
                captions.push({ text: 'Not Sure If...', x: canvasWidth / 2, y: canvasHeight * 0.1 });
                captions.push({ text: 'Or...', x: canvasWidth / 2, y: canvasHeight * 0.9 });
                break;
            case 'evilKermit':
                captions.push({ text: 'Me:', x: canvasWidth / 2, y: canvasHeight * 0.1 });
                captions.push({ text: 'Also Me:', x: canvasWidth / 2, y: canvasHeight * 0.9 });
                break;
            case 'braceYourselves':
                captions.push({ text: 'Brace Yourselves', x: canvasWidth / 2, y: canvasHeight * 0.1 });
                captions.push({ text: 'Winter is Coming', x: canvasWidth / 2, y: canvasHeight * 0.9 });
                break;
            case 'spongebobMocking':
                captions.push({ text: 'When Someone Says...', x: canvasWidth / 2, y: canvasHeight * 0.1 });
                break;
            case 'surprisedPikachu':
                captions.push({ text: 'When You...', x: canvasWidth / 2, y: canvasHeight * 0.1 });
                break;
            case 'cryingMichaelJordan':
                captions.push({ text: 'When You...', x: canvasWidth / 2, y: canvasHeight * 0.1 });
                break;
            case 'grumpyCat':
                captions.push({ text: 'I Had Fun Once', x: canvasWidth / 2, y: canvasHeight * 0.1 });
                captions.push({ text: 'It Was Awful', x: canvasWidth / 2, y: canvasHeight * 0.9 });
                break;
            case 'badLuckBrian':
                captions.push({ text: 'Top Text', x: canvasWidth / 2, y: canvasHeight * 0.1 });
                captions.push({ text: 'Bottom Text', x: canvasWidth / 2, y: canvasHeight * 0.9 });
                break;
            case 'yUNo':
                captions.push({ text: 'Y U NO...', x: canvasWidth / 2, y: canvasHeight * 0.5 });
                break;
            case 'doge':
                captions.push({ text: 'Such Meme', x: canvasWidth * 0.2, y: canvasHeight * 0.2 });
                captions.push({ text: 'Much Wow', x: canvasWidth * 0.8, y: canvasHeight * 0.3 });
                captions.push({ text: 'Very Code', x: canvasWidth * 0.3, y: canvasHeight * 0.7 });
                break;
            case 'thisIsFine':
                captions.push({ text: 'This is Fine', x: canvasWidth / 2, y: canvasHeight * 0.9 });
                break;
            case 'womanYellingAtCat':
                captions.push({ text: 'Woman:', x: canvasWidth * 0.25, y: canvasHeight * 0.1 });
                captions.push({ text: 'Cat:', x: canvasWidth * 0.75, y: canvasHeight * 0.1 });
                break;
            // Custom Templates
            case 'captainHolt':
                captions.push({ text: 'Title', x: canvasWidth / 2, y: canvasHeight / 6 });
                captions.push({ text: 'When you...', x: canvasWidth / 2, y: (canvasHeight / 6) * 5 });
                break;
            case 'darkMaga':
                captions.push({ text: 'Dark Maga Rises', x: canvasWidth / 2, y: canvasHeight * 0.1 });
                captions.push({ text: '2024', x: canvasWidth / 2, y: canvasHeight * 0.9 });
                break;
            case 'darkMaga2':
                captions.push({ text: 'Feel The Power', x: canvasWidth / 2, y: canvasHeight * 0.1 });
                captions.push({ text: 'Of Dark Maga', x: canvasWidth / 2, y: canvasHeight * 0.9 });
                break;
            case 'nakedOp':
                captions.push({ text: 'When You...', x: canvasWidth / 2, y: canvasHeight * 0.1 });
                break;
            case 'whiteHousePresser':
                captions.push({ text: 'Press Conference Be Like', x: canvasWidth / 2, y: canvasHeight * 0.1 });
                break;
            case 'adviceYourself':
                captions.push({ text: 'Advice You Needed', x: canvasWidth / 2, y: canvasHeight * 0.1 });
                captions.push({ text: 'From Yourself', x: canvasWidth / 2, y: canvasHeight * 0.9 });
                break;
            default:
                captions.push({ text: 'Your Text Here', x: canvasWidth / 2, y: canvasHeight / 2 });
        }

        // Clear existing text boxes
        textBoxes = [];

        // Add captions as text boxes
        captions.forEach(caption => {
            const newTextBox = new TextBox(caption.text, caption.x, caption.y);
            textBoxes.push(newTextBox);
        });

        updateTextBoxList();
        redrawCanvas();
    } else {
        alert('Please select a meme template to auto-generate captions.');
    }
});

// Generate meme event listener
generateMeme.addEventListener('click', () => {
    if (uploadedImage) {
        redrawCanvas();
    } else {
        alert('Please upload an image or select a template first.');
    }
});

// Download meme event listener
downloadMeme.addEventListener('click', () => {
    if (uploadedImage) {
        redrawCanvas();
        const link = downloadMeme;
        link.href = memeCanvas.toDataURL('image/png');
        link.download = 'meme.png';
    } else {
        alert('Please upload an image or select a template first.');
    }
});

// Crop, rotate, and flip event listeners
cropButton.addEventListener('click', () => {
    saveState();
    const croppedWidth = memeCanvas.width * 0.8;
    const croppedHeight = memeCanvas.height * 0.8;
    const startX = (memeCanvas.width - croppedWidth) / 2;
    const startY = (memeCanvas.height - croppedHeight) / 2;

    const croppedImage = ctx.getImageData(startX, startY, croppedWidth, croppedHeight);
    ctx.clearRect(0, 0, memeCanvas.width, memeCanvas.height);
    ctx.putImageData(croppedImage, 0, 0);
    redrawCanvas();
});

rotateButton.addEventListener('click', () => {
    saveState();
    rotationAngle = (rotationAngle + 90) % 360;
    redrawCanvas();
});

flipButton.addEventListener('click', () => {
    saveState();
    flipped = !flipped;
    redrawCanvas();
});

// Redraw canvas function
const redrawCanvas = () => {
    ctx.clearRect(0, 0, memeCanvas.width, memeCanvas.height);

    ctx.save();
    ctx.translate(memeCanvas.width / 2, memeCanvas.height / 2);
    ctx.rotate((rotationAngle * Math.PI) / 180);
    if (flipped) {
        ctx.scale(-1, 1);
    }

    if (uploadedImage) {
        ctx.drawImage(uploadedImage, -memeCanvas.width / 2, -memeCanvas.height / 2, memeCanvas.width, memeCanvas.height);
    }
    ctx.restore();

    addTextToMeme();
};

// Add text to meme function
const addTextToMeme = () => {
    textBoxes.forEach(textBox => {
        ctx.font = `bold ${textBox.fontSize}px ${textBox.font}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = textBox.color;
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'black';
        ctx.strokeText(textBox.text, textBox.x, textBox.y);
        ctx.fillText(textBox.text, textBox.x, textBox.y);
    });

    stickers.forEach(sticker => {
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(sticker.emoji, sticker.x, sticker.y);
    });
};

// TextBox class
class TextBox {
    constructor(text, x, y, font, fontSize, color) {
        this.text = text || 'New Text';
        this.x = x || memeCanvas.width / 2;
        this.y = y || memeCanvas.height / 2;
        this.font = font || 'Arial';
        this.fontSize = fontSize || 20;
        this.color = color || '#000000';
    }

    contains(mouseX, mouseY) {
        ctx.font = `bold ${this.fontSize}px ${this.font}`;
        const textWidth = ctx.measureText(this.text).width;
        const textHeight = this.fontSize;

        return mouseX >= this.x - textWidth / 2 &&
               mouseX <= this.x + textWidth / 2 &&
               mouseY >= this.y - textHeight &&
               mouseY <= this.y;
    }
}

// Add Text Box functionality
addTextBoxButton.addEventListener('click', () => {
    saveState();
    const newTextBox = new TextBox();
    textBoxes.push(newTextBox);
    selectedTextBoxIndex = textBoxes.length - 1;
    updateTextBoxList();
    updateTextBoxControls();
    redrawCanvas();
});

// Update Text Box List
function updateTextBoxList() {
    textBoxList.innerHTML = '';

    textBoxes.forEach((textBox, index) => {
        const listItem = document.createElement('div');
        listItem.classList.add('text-box-item');
        listItem.textContent = `Text Box ${index + 1}: "${textBox.text}"`;
        listItem.addEventListener('click', () => {
            selectedTextBoxIndex = index;
            updateTextBoxControls();
        });
        textBoxList.appendChild(listItem);
    });
}

// Update Text Box Controls
function updateTextBoxControls() {
    if (selectedTextBoxIndex !== null) {
        const textBox = textBoxes[selectedTextBoxIndex];
        textBoxTextInput.value = textBox.text;
        textBoxFontSelect.value = textBox.font;
        textBoxFontSizeInput.value = textBox.fontSize;
        textBoxFontColorInput.value = textBox.color;
    }
}

// Event listeners for text box controls
textBoxTextInput.addEventListener('input', (event) => {
    if (selectedTextBoxIndex !== null) {
        saveState();
        textBoxes[selectedTextBoxIndex].text = event.target.value;
        redrawCanvas();
        updateTextBoxList();
    }
});

textBoxFontSelect.addEventListener('change', (event) => {
    if (selectedTextBoxIndex !== null) {
        saveState();
        textBoxes[selectedTextBoxIndex].font = event.target.value;
        redrawCanvas();
    }
});

textBoxFontSizeInput.addEventListener('input', (event) => {
    if (selectedTextBoxIndex !== null) {
        saveState();
        textBoxes[selectedTextBoxIndex].fontSize = event.target.value;
        redrawCanvas();
    }
});

textBoxFontColorInput.addEventListener('input', (event) => {
    if (selectedTextBoxIndex !== null) {
        saveState();
        textBoxes[selectedTextBoxIndex].color = event.target.value;
        redrawCanvas();
    }
});

// Functions for saving, loading, and updating projects
function saveProject() {
    if (!uploadedImage) {
        alert('Please create a meme first before saving.');
        return;
    }

    if (!isDbReady()) return;

    const projectName = prompt('Enter a name for your meme project:', 'Untitled');
    if (!projectName) return;

    const project = {
        name: projectName,
        imageSrc: uploadedImage.src,
        textBoxes: textBoxes,
        stickers: stickers,
        rotationAngle: rotationAngle,
        flipped: flipped
    };

    const transaction = db.transaction(['memeProjects'], 'readwrite');
    const store = transaction.objectStore('memeProjects');
    const request = store.add(project);

    request.onsuccess = function() {
        console.log('Project saved successfully');
        alert('Project saved successfully!');
        currentProjectId = request.result;
        loadProjects();
    };

    request.onerror = function(event) {
        console.error('Save failed:', event.target.error);
    };
}

function loadProjects() {
    if (!isDbReady()) return;

    const transaction = db.transaction(['memeProjects'], 'readonly');
    const store = transaction.objectStore('memeProjects');
    const request = store.getAll();

    request.onsuccess = function() {
        const projects = request.result;
        console.log('Loaded projects:', projects);
        displayProjects(projects);
    };
}

function displayProjects(projects) {
    const projectList = document.getElementById('projectList');
    projectList.innerHTML = '';

    if (projects.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.classList.add('project-list-empty');
        emptyMessage.textContent = 'No projects saved yet. Start creating your meme now!';
        projectList.appendChild(emptyMessage);
    } else {
        projects.forEach((project) => {
            const listItem = document.createElement('li');
            listItem.classList.add('project-item');

            const projectTitle = document.createElement('span');
            projectTitle.classList.add('project-title');
            projectTitle.textContent = project.name;
            listItem.appendChild(projectTitle);

            const buttonsContainer = document.createElement('div');
            buttonsContainer.classList.add('project-buttons');

            const loadButton = document.createElement('button');
            loadButton.classList.add('load-project-button');
            loadButton.textContent = 'Load';
            loadButton.onclick = () => loadProject(project);
            buttonsContainer.appendChild(loadButton);

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-project-button');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => deleteProject(project.id);
            buttonsContainer.appendChild(deleteButton);

            listItem.appendChild(buttonsContainer);
            projectList.appendChild(listItem);
        });
    }
}

function deleteProject(projectId) {
    if (!isDbReady()) return;

    const transaction = db.transaction(['memeProjects'], 'readwrite');
    const store = transaction.objectStore('memeProjects');
    const request = store.delete(projectId);

    request.onsuccess = function() {
        console.log('Project deleted successfully');
        loadProjects();
    };

    request.onerror = function(event) {
        console.error('Delete failed:', event.target.error);
    };
}

function loadProject(project) {
    if (!project.imageSrc) {
        alert('No image found for this project. The project might be corrupted.');
        return;
    }

    uploadedImage = new Image();
    uploadedImage.crossOrigin = 'anonymous';
    uploadedImage.src = project.imageSrc;

    uploadedImage.onload = () => {
        // Handle old projects that may not have multi-text support
        if (project.textBoxes) {
            textBoxes = project.textBoxes || [];
        } else if (project.text) {
            // Convert old text property to textBoxes array
            textBoxes = [new TextBox(project.text, memeCanvas.width / 2, memeCanvas.height / 2)];
        } else {
            textBoxes = [];
        }

        stickers = project.stickers || [];
        rotationAngle = project.rotationAngle || 0;
        flipped = project.flipped || false;

        updateTextBoxList();
        updateTextBoxControls();
        redrawCanvas();
        currentProjectId = project.id;
    };

    uploadedImage.onerror = () => {
        alert('Failed to load the project image. The project might be corrupted.');
    };
}

function updateProject() {
    if (currentProjectId === null) {
        alert('Please load a project first before updating.');
        return;
    }

    if (!isDbReady()) return;

    const projectName = prompt('Enter a new name for your meme project:', 'Untitled');
    if (!projectName) return;

    const updatedProject = {
        id: currentProjectId,
        name: projectName,
        imageSrc: uploadedImage.src,
        textBoxes: textBoxes,
        stickers: stickers,
        rotationAngle: rotationAngle,
        flipped: flipped
    };

    const transaction = db.transaction(['memeProjects'], 'readwrite');
    const store = transaction.objectStore('memeProjects');
    const request = store.put(updatedProject);

    request.onsuccess = function() {
        console.log('Project updated successfully');
        alert('Project updated successfully!');
        loadProjects();
    };

    request.onerror = function(event) {
        console.error('Update failed:', event.target.error);
    };
}
