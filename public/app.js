// ============================================
// THE GILDED DESK - Main Application
// ============================================

// API URLs
const API = {
    notes: '/api/notes',
    todos: '/api/todos',
    files: '/api/files',
    chat: '/api/chat',
    weather: '/api/weather'
};

// ============================================
// NAVIGATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNotes();
    initTodos();
    initCalculator();
    initWeather();
    initChat();
    initFileUpload();
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.dataset.section;

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId) {
                    section.classList.add('active');
                }
            });
        });
    });
}

// ============================================
// NOTES MODULE
// ============================================
function initNotes() {
    const noteForm = document.getElementById('noteForm');
    noteForm.addEventListener('submit', handleNoteSubmit);
    fetchNotes();
}

async function fetchNotes() {
    try {
        const response = await fetch(API.notes);
        const notes = await response.json();
        renderNotes(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
    }
}

async function handleNoteSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();

    if (!title || !content) return;

    try {
        await fetch(API.notes, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });
        document.getElementById('noteForm').reset();
        fetchNotes();
    } catch (error) {
        console.error('Error creating note:', error);
    }
}

function renderNotes(notes) {
    const container = document.getElementById('notesContainer');
    if (notes.length === 0) {
        container.innerHTML = '<p class="empty-message"><i class="fas fa-feather"></i> No notes yet. Start composing!</p>';
        return;
    }

    container.innerHTML = notes.map(note => `
        <div class="note-card">
            <h4><i class="fas fa-bookmark"></i> ${escapeHtml(note.title)}</h4>
            <p>${escapeHtml(note.content)}</p>
            <div class="note-date"><i class="fas fa-clock"></i> ${formatDate(note.createdAt)}</div>
        </div>
    `).join('');
}

// ============================================
// TO-DO LIST MODULE
// ============================================
let todos = [];
let todoFilter = 'all';

function initTodos() {
    const todoForm = document.getElementById('todoForm');
    todoForm.addEventListener('submit', handleTodoSubmit);

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            todoFilter = btn.dataset.filter;
            renderTodos();
        });
    });

    document.getElementById('clearCompleted').addEventListener('click', clearCompletedTodos);
    fetchTodos();
}

async function fetchTodos() {
    try {
        const response = await fetch(API.todos);
        todos = await response.json();
        renderTodos();
    } catch (error) {
        console.error('Error fetching todos:', error);
        todos = JSON.parse(localStorage.getItem('todos') || '[]');
        renderTodos();
    }
}

async function handleTodoSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('todoInput');
    const text = input.value.trim();

    if (!text) return;

    const newTodo = {
        id: Date.now(),
        text,
        completed: false,
        createdAt: new Date().toISOString()
    };

    try {
        await fetch(API.todos, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTodo)
        });
    } catch (error) {
        console.error('Error saving todo:', error);
    }

    todos.unshift(newTodo);
    saveTodosLocal();
    input.value = '';
    renderTodos();
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodosLocal();
        updateTodoOnServer(todo);
        renderTodos();
    }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodosLocal();
    deleteTodoOnServer(id);
    renderTodos();
}

function clearCompletedTodos() {
    todos = todos.filter(t => !t.completed);
    saveTodosLocal();
    renderTodos();
}

async function updateTodoOnServer(todo) {
    try {
        await fetch(`${API.todos}/${todo.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(todo)
        });
    } catch (error) {
        console.error('Error updating todo:', error);
    }
}

async function deleteTodoOnServer(id) {
    try {
        await fetch(`${API.todos}/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error('Error deleting todo:', error);
    }
}

function saveTodosLocal() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function renderTodos() {
    const container = document.getElementById('todosContainer');
    let filteredTodos = todos;

    if (todoFilter === 'active') {
        filteredTodos = todos.filter(t => !t.completed);
    } else if (todoFilter === 'completed') {
        filteredTodos = todos.filter(t => t.completed);
    }

    if (filteredTodos.length === 0) {
        container.innerHTML = '<p class="empty-message"><i class="fas fa-check-circle"></i> No tasks here!</p>';
    } else {
        container.innerHTML = filteredTodos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="toggleTodo(${todo.id})">
                    ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <button class="todo-delete" onclick="deleteTodo(${todo.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    const remaining = todos.filter(t => !t.completed).length;
    document.getElementById('todoCount').textContent = `${remaining} task${remaining !== 1 ? 's' : ''} remaining`;
}

// ============================================
// CALCULATOR MODULE
// ============================================
let calcDisplay = '0';
let calcHistory = '';
let calcOperator = null;
let calcPrevValue = null;
let calcNewNumber = true;

function initCalculator() {
    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => handleCalcButton(btn.dataset.action));
    });

    document.addEventListener('keydown', handleCalcKeyboard);
}

function handleCalcButton(action) {
    if (action >= '0' && action <= '9') {
        inputNumber(action);
    } else if (action === '.') {
        inputDecimal();
    } else if (['+', '-', '*', '/'].includes(action)) {
        inputOperator(action);
    } else if (action === '=') {
        calculate();
    } else if (action === 'clear') {
        clearCalc();
    } else if (action === 'backspace') {
        backspace();
    } else if (action === 'percent') {
        percent();
    }
    updateCalcDisplay();
}

function handleCalcKeyboard(e) {
    if (!document.getElementById('calculator').classList.contains('active')) return;

    const key = e.key;
    if (key >= '0' && key <= '9') handleCalcButton(key);
    else if (key === '.') handleCalcButton('.');
    else if (key === '+') handleCalcButton('+');
    else if (key === '-') handleCalcButton('-');
    else if (key === '*') handleCalcButton('*');
    else if (key === '/') handleCalcButton('/');
    else if (key === 'Enter' || key === '=') handleCalcButton('=');
    else if (key === 'Escape') handleCalcButton('clear');
    else if (key === 'Backspace') handleCalcButton('backspace');
    else if (key === '%') handleCalcButton('percent');
}

function inputNumber(num) {
    if (calcNewNumber) {
        calcDisplay = num;
        calcNewNumber = false;
    } else {
        calcDisplay = calcDisplay === '0' ? num : calcDisplay + num;
    }
}

function inputDecimal() {
    if (calcNewNumber) {
        calcDisplay = '0.';
        calcNewNumber = false;
    } else if (!calcDisplay.includes('.')) {
        calcDisplay += '.';
    }
}

function inputOperator(op) {
    if (calcOperator && !calcNewNumber) {
        calculate();
    }
    calcPrevValue = parseFloat(calcDisplay);
    calcOperator = op;
    calcHistory = `${calcDisplay} ${getOperatorSymbol(op)}`;
    calcNewNumber = true;
}

function calculate() {
    if (calcOperator === null || calcPrevValue === null) return;

    const current = parseFloat(calcDisplay);
    let result;

    switch (calcOperator) {
        case '+': result = calcPrevValue + current; break;
        case '-': result = calcPrevValue - current; break;
        case '*': result = calcPrevValue * current; break;
        case '/': result = current !== 0 ? calcPrevValue / current : 'Error'; break;
    }

    calcHistory = `${calcPrevValue} ${getOperatorSymbol(calcOperator)} ${current} =`;
    calcDisplay = typeof result === 'number' ? String(Math.round(result * 100000000) / 100000000) : result;
    calcOperator = null;
    calcPrevValue = null;
    calcNewNumber = true;
}

function clearCalc() {
    calcDisplay = '0';
    calcHistory = '';
    calcOperator = null;
    calcPrevValue = null;
    calcNewNumber = true;
}

function backspace() {
    if (calcDisplay.length > 1) {
        calcDisplay = calcDisplay.slice(0, -1);
    } else {
        calcDisplay = '0';
        calcNewNumber = true;
    }
}

function percent() {
    calcDisplay = String(parseFloat(calcDisplay) / 100);
}

function getOperatorSymbol(op) {
    const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    return symbols[op] || op;
}

function updateCalcDisplay() {
    document.getElementById('calcDisplay').textContent = calcDisplay;
    document.getElementById('calcHistory').textContent = calcHistory;
}

// ============================================
// WEATHER MODULE
// ============================================
function initWeather() {
    const weatherForm = document.getElementById('weatherForm');
    weatherForm.addEventListener('submit', handleWeatherSearch);
}

async function handleWeatherSearch(e) {
    e.preventDefault();
    const city = document.getElementById('cityInput').value.trim();
    if (!city) return;

    const display = document.getElementById('weatherDisplay');
    display.innerHTML = '<div class="weather-placeholder"><i class="fas fa-spinner fa-spin"></i><p>Fetching weather...</p></div>';

    try {
        const response = await fetch(`${API.weather}?city=${encodeURIComponent(city)}`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        renderWeather(data);
    } catch (error) {
        display.innerHTML = `<div class="weather-placeholder"><i class="fas fa-exclamation-triangle"></i><p>${error.message || 'City not found. Please try again.'}</p></div>`;
    }
}

function renderWeather(data) {
    const display = document.getElementById('weatherDisplay');
    const iconMap = {
        'Clear': 'fa-sun',
        'Clouds': 'fa-cloud',
        'Rain': 'fa-cloud-rain',
        'Drizzle': 'fa-cloud-rain',
        'Thunderstorm': 'fa-bolt',
        'Snow': 'fa-snowflake',
        'Mist': 'fa-smog',
        'Fog': 'fa-smog',
        'Haze': 'fa-smog'
    };

    const icon = iconMap[data.weather] || 'fa-cloud-sun';

    display.innerHTML = `
        <div class="weather-info">
            <i class="fas ${icon} weather-icon"></i>
            <div class="weather-temp">${Math.round(data.temp)}°C</div>
            <div class="weather-city">${data.city}, ${data.country}</div>
            <div class="weather-desc">${data.description}</div>
            <div class="weather-details">
                <div class="weather-detail">
                    <i class="fas fa-tint"></i> Humidity: ${data.humidity}%
                </div>
                <div class="weather-detail">
                    <i class="fas fa-wind"></i> Wind: ${data.wind} m/s
                </div>
            </div>
        </div>
    `;
}

// ============================================
// CHAT MODULE
// ============================================
const chatResponses = [
    "Indeed, that is a most intriguing thought!",
    "Pray tell, would you like me to elaborate on that matter?",
    "A splendid observation, if I may say so myself.",
    "How fascinating! The pursuit of knowledge is truly noble.",
    "I find your inquiry most stimulating, dear friend.",
    "Capital! That reminds me of an old proverb...",
    "Your words carry wisdom beyond measure.",
    "Allow me to ponder upon this matter with great care.",
    "Excellent question! The answer lies in careful contemplation.",
    "How delightful to engage in such scholarly discourse!",
    "The mysteries of the world are indeed profound.",
    "Your eloquence is most admirable, I must say.",
    "A gentleman/lady of fine taste and intellect, I see!",
    "The Victorian era would have appreciated such discourse.",
    "Most astute! You have a keen mind for such matters."
];

function initChat() {
    const chatForm = document.getElementById('chatForm');
    chatForm.addEventListener('submit', handleChatSubmit);
}

function handleChatSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    addChatMessage(message, 'user');
    input.value = '';

    // Simulate typing delay
    setTimeout(() => {
        const response = chatResponses[Math.floor(Math.random() * chatResponses.length)];
        addChatMessage(response, 'bot');
    }, 800 + Math.random() * 1000);
}

function addChatMessage(text, sender) {
    const container = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;

    const icon = sender === 'user' ? 'fa-user' : 'fa-robot';

    messageDiv.innerHTML = `
        <div class="message-avatar"><i class="fas ${icon}"></i></div>
        <div class="message-content"><p>${escapeHtml(text)}</p></div>
    `;

    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// ============================================
// FILE UPLOAD MODULE
// ============================================
let uploadedFiles = [];

function initFileUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');

    browseBtn.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('click', (e) => {
        if (e.target !== browseBtn && !browseBtn.contains(e.target)) {
            fileInput.click();
        }
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    loadFilesFromStorage();
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        simulateUpload(file);
    });
}

function simulateUpload(file) {
    const progressContainer = document.getElementById('uploadProgress');
    const progressId = Date.now();

    const progressHtml = `
        <div class="progress-item" id="progress-${progressId}">
            <i class="fas fa-file"></i>
            <span>${escapeHtml(file.name)}</span>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
        </div>
    `;

    progressContainer.insertAdjacentHTML('beforeend', progressHtml);

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);

            setTimeout(() => {
                document.getElementById(`progress-${progressId}`).remove();
                addUploadedFile(file);
            }, 300);
        }

        document.querySelector(`#progress-${progressId} .progress-fill`).style.width = `${progress}%`;
    }, 200);
}

function addUploadedFile(file) {
    const fileData = {
        id: Date.now(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
    };

    uploadedFiles.push(fileData);
    saveFilesToStorage();
    renderFiles();
}

function deleteFile(id) {
    uploadedFiles = uploadedFiles.filter(f => f.id !== id);
    saveFilesToStorage();
    renderFiles();
}

function saveFilesToStorage() {
    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
}

function loadFilesFromStorage() {
    uploadedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
    renderFiles();
}

function renderFiles() {
    const container = document.getElementById('filesContainer');

    if (uploadedFiles.length === 0) {
        container.innerHTML = '<p class="empty-message"><i class="fas fa-folder-open"></i> No files uploaded yet</p>';
        return;
    }

    container.innerHTML = uploadedFiles.map(file => {
        const icon = getFileIcon(file.type);
        return `
            <div class="file-card">
                <i class="fas ${icon}"></i>
                <div class="file-name">${escapeHtml(file.name)}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
                <div class="file-actions">
                    <button onclick="deleteFile(${file.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getFileIcon(type) {
    if (type.startsWith('image/')) return 'fa-file-image';
    if (type.startsWith('video/')) return 'fa-file-video';
    if (type.startsWith('audio/')) return 'fa-file-audio';
    if (type.includes('pdf')) return 'fa-file-pdf';
    if (type.includes('word') || type.includes('document')) return 'fa-file-word';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'fa-file-excel';
    if (type.includes('zip') || type.includes('rar')) return 'fa-file-archive';
    return 'fa-file';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
