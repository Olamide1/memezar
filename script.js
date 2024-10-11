const imageUpload = document.getElementById('imageUpload');
const memeCanvas = document.getElementById('memeCanvas');
const ctx = memeCanvas.getContext('2d');
const topText = document.getElementById('topText');
const bottomText = document.getElementById('bottomText');
const generateMeme = document.getElementById('generateMeme');
const downloadMeme = document.getElementById('downloadMeme');
const fontSelect = document.getElementById('fontSelect');
const fontSizeInput = document.getElementById('fontSize');
const fontColorInput = document.getElementById('fontColor');
const stickerSelect = document.getElementById('stickerSelect');
const templateSelect = document.getElementById('templateSelect');
const autoCaption = document.getElementById('autoCaption');
const cropButton = document.getElementById('cropButton');
const rotateButton = document.getElementById('rotateButton');
const flipButton = document.getElementById('flipButton');
document.getElementById('saveProject').addEventListener('click', saveProject);
document.getElementById('loadProjects').addEventListener('click', loadProjects);
document.getElementById('updateProject').addEventListener('click', updateProject);

let db;
let currentProjectId = null; // Track the currently loaded project for updates
let uploadedImage;
let stickers = [];
let selectedStickerIndex = null;
let rotationAngle = 0;
let flipped = false;

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
    captainHolt: 'template_image/capt_Holt.jpg',
    darkMaga: 'template_image/dark_maga.png',
    darkMaga2: 'template_image/dark_maga 2.jpeg',
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
    loadProjects();  // Load projects immediately after DB opens
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

templateSelect.addEventListener('change', () => {
    const selectedTemplate = templateSelect.value;
    if (selectedTemplate) {
        uploadedImage = new Image();
        uploadedImage.crossOrigin = 'anonymous'; // Ensure CORS is allowed
        uploadedImage.src = memeTemplates[selectedTemplate];
        uploadedImage.onload = () => {
            redrawCanvas();
        };
        uploadedImage.onerror = () => {
            alert('Error loading meme template. Please try again.');
        };
    }
});


imageUpload.addEventListener('change', (event) => {
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

stickerSelect.addEventListener('change', () => {
    const selectedSticker = stickerSelect.value;
    if (selectedSticker) {
        stickers.push({
            emoji: stickerSelect.options[stickerSelect.selectedIndex].text,
            x: memeCanvas.width / 2,
            y: memeCanvas.height / 2,
        });
        stickerSelect.value = "";
        redrawCanvas();
    }
});

memeCanvas.addEventListener('mousedown', (event) => {
    const rect = memeCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    stickers.forEach((sticker, index) => {
        const distance = Math.sqrt((mouseX - sticker.x) ** 2 + (mouseY - sticker.y) ** 2);
        if (distance < 25) { // Assuming the sticker size is roughly 50px
            selectedStickerIndex = index;
        }
    });
});

memeCanvas.addEventListener('mousemove', (event) => {
    if (selectedStickerIndex !== null) {
        const rect = memeCanvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        stickers[selectedStickerIndex].x = mouseX;
        stickers[selectedStickerIndex].y = mouseY;
        redrawCanvas();
    }
});

memeCanvas.addEventListener('mouseup', () => {
    selectedStickerIndex = null;
});

autoCaption.addEventListener('click', () => {
    const selectedTemplate = templateSelect.value;
    if (selectedTemplate) {
        switch (selectedTemplate) {
            case 'drake':
                topText.value = "Not Cool";
                bottomText.value = "Cool";
                break;
            case 'distractedBoyfriend':
                topText.value = "Me";
                bottomText.value = "Something I Shouldn't Spend Money On";
                break;
            case 'twoButtons':
                topText.value = "Stay In";
                bottomText.value = "Go Out And Regret It";
                break;
            case 'gruPlan':
                topText.value = "Step 1: Make a Plan\nStep 2: Execute Plan\nStep 3: Fail Miserably";
                bottomText.value = "Step 4: Be Sad";
                break;
            case 'changeMyMind':
                topText.value = "Pineapple Belongs On Pizza";
                bottomText.value = "Change My Mind";
                break;
            case 'evilKermit':
                topText.value = "Me: I Should Eat Healthy";
                bottomText.value = "Inner Me: Order Pizza";
                break;
            case 'braceYourselves':
                topText.value = "Brace Yourselves";
                bottomText.value = "The Weekend Is Over";
                break;
            case 'spongebobMocking':
                topText.value = "Me: I'm Fine";
                bottomText.value = "Also Me: I'm FiNe";
                break;
            case 'successKid':
                topText.value = "Set A Goal";
                bottomText.value = "Achieved It";
                break;
            case 'oneDoesNotSimply':
                topText.value = "One Does Not Simply";
                bottomText.value = "Achieve Success Without Effort";
                break;
            case 'futuramaFry':
                topText.value = "Not Sure If";
                bottomText.value = "Motivated Or Just Stubborn";
                break;
            case 'doge':
                topText.value = "Such Effort";
                bottomText.value = "Much Achievement";
                break;
            case 'surprisedPikachu':
                topText.value = "When You Didn't Study";
                bottomText.value = "And Failed The Test";
                break;
            case 'distractedCat':
                topText.value = "Me Looking at My Cat";
                bottomText.value = "Instead of Doing Work";
                break;
            case 'grumpyCat':
                topText.value = "I Had Fun Once";
                bottomText.value = "It Was Awful";
                break;
            case 'badLuckBrian':
                topText.value = "Tries to Impress Crush";
                bottomText.value = "Falls Flat on Face";
                break;
            case 'yUNo':
                topText.value = "Y U NO";
                bottomText.value = "Do The Thing?!";
                break;
            case 'thisIsFine':
                topText.value = "Everything Is Fine";
                bottomText.value = "I'm Okay With The Events Happening";
                break;
            case 'womanYellingAtCat':
                topText.value = "Woman Yelling At Cat";
                bottomText.value = "Cat: I'm Just A Cat";
                break;
            case 'captainHolt':
                topText.value = "When the money drops";
                bottomText.value = "I'm Just A girl";
                break;
            case 'darkMaga':
                topText.value = "Look at me";
                bottomText.value = "I'm the dark maga";
                break;
            case 'darkMaga2':
                topText.value = "Dark Maga 2";
                bottomText.value = "Make America Great Again 2";
                break;
            case 'nakedOp':
                topText.value = "Naked OPPENEIMER";
                bottomText.value = "I'm the naked oppenheimer";
                break;
            case 'whiteHousePresser':
                topText.value = "WTH";
                bottomText.value = "Is that?";
                break;
            case 'adviceYourself':
                topText.value = "WTH Bro";
                bottomText.value = "Don't fumble it now";
                break;
            default:
                topText.value = "";
                bottomText.value = "";
        }
        redrawCanvas();
    } else {
        alert('Please select a meme template to auto-generate captions.');
    }
});


generateMeme.addEventListener('click', () => {
    if (uploadedImage) {
        redrawCanvas();
    } else {
        alert('Please upload an image or select a template first.');
    }
});

downloadMeme.addEventListener('click', () => {
    if (uploadedImage) {
        redrawCanvas();
        const link = downloadMeme;
        link.href = memeCanvas.toDataURL('image/png');  // Set the href of the anchor element to the canvas data URL
        link.download = 'meme.png';                     // Set the download attribute
    } else {
        alert('Please upload an image or select a template first.');
    }
});


cropButton.addEventListener('click', () => {
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
    rotationAngle = (rotationAngle + 90) % 360;
    redrawCanvas();
});

flipButton.addEventListener('click', () => {
    flipped = !flipped;
    redrawCanvas();
});

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

const addTextToMeme = () => {
    ctx.font = `bold ${fontSizeInput.value}px ${fontSelect.value}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = fontColorInput.value;
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';

    if (topText.value) {
        const topTextLines = topText.value.toUpperCase().split('\n');
        topTextLines.forEach((line, index) => {
            const yPosition = 30 + index * (parseInt(fontSizeInput.value) + 5);
            ctx.strokeText(line, memeCanvas.width / 2, yPosition);
            ctx.fillText(line, memeCanvas.width / 2, yPosition);
        });
    }

    if (bottomText.value) {
        const bottomTextLines = bottomText.value.toUpperCase().split('\n');
        bottomTextLines.forEach((line, index) => {
            const yPosition = memeCanvas.height - 20 - (bottomTextLines.length - index - 1) * (parseInt(fontSizeInput.value) + 5);
            ctx.strokeText(line, memeCanvas.width / 2, yPosition);
            ctx.fillText(line, memeCanvas.width / 2, yPosition);
        });
    }

    stickers.forEach(sticker => {
        ctx.font = '50px Arial';
        ctx.fillText(sticker.emoji, sticker.x, sticker.y);
    });
};

// Functions for saving, loading, and updating projects
function saveProject() {
    if (!uploadedImage) {
        alert('Please create a meme first before saving.');
        return;
    }

    if (!isDbReady()) return;

    const project = {
        name: prompt('Enter a name for your meme project:', 'Untitled'),
        imageSrc: uploadedImage.src,
        topText: topText.value,
        bottomText: bottomText.value,
        font: fontSelect.value,
        fontSize: fontSizeInput.value,
        fontColor: fontColorInput.value,
        stickers: stickers,
        rotationAngle: rotationAngle,
        flipped: flipped
    };

    const transaction = db.transaction(['memeProjects'], 'readwrite');
    const store = transaction.objectStore('memeProjects');
    store.add(project);

    transaction.oncomplete = function() {
        console.log('Project saved successfully');
        alert('Project saved successfully!');
        currentProjectId = project.id;
        loadProjects();
    };

    transaction.onerror = function(event) {
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
    uploadedImage.crossOrigin = 'anonymous'; // Make sure to set crossOrigin when loading saved images
    uploadedImage.src = project.imageSrc;

    uploadedImage.onload = () => {
        // Assign the saved properties to the current project
        topText.value = project.topText;
        bottomText.value = project.bottomText;
        fontSelect.value = project.font;
        fontSizeInput.value = project.fontSize;
        fontColorInput.value = project.fontColor;
        stickers = project.stickers;
        rotationAngle = project.rotationAngle;
        flipped = project.flipped;

        // Redraw canvas with loaded data
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

    const updatedProject = {
        id: currentProjectId,
        name: prompt('Enter a new name for your meme project:', 'Untitled') || 'Untitled',
        imageSrc: uploadedImage.src,
        topText: topText.value,
        bottomText: bottomText.value,
        font: fontSelect.value,
        fontSize: fontSizeInput.value,
        fontColor: fontColorInput.value,
        stickers: stickers,
        rotationAngle: rotationAngle,
        flipped: flipped
    };

    const transaction = db.transaction(['memeProjects'], 'readwrite');
    const store = transaction.objectStore('memeProjects');
    store.put(updatedProject);

    transaction.oncomplete = function() {
        console.log('Project updated successfully');
        alert('Project updated successfully!');
        loadProjects();
    };

    transaction.onerror = function(event) {
        console.error('Update failed:', event.target.error);
    };
}
