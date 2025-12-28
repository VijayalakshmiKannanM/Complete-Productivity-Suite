const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Data files
const NOTES_FILE = path.join(__dirname, 'notes.json');
const TODOS_FILE = path.join(__dirname, 'todos.json');
const FILES_FILE = path.join(__dirname, 'files.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// HELPER FUNCTIONS
// ============================================
function readJsonFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '[]');
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
}

function writeJsonFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ============================================
// NOTES API
// ============================================
app.get('/api/notes', (req, res) => {
    try {
        const notes = readJsonFile(NOTES_FILE);
        notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

app.post('/api/notes', (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const notes = readJsonFile(NOTES_FILE);
        const newNote = {
            id: Date.now(),
            title: title.trim(),
            content: content.trim(),
            createdAt: new Date().toISOString()
        };

        notes.push(newNote);
        writeJsonFile(NOTES_FILE, notes);
        res.status(201).json(newNote);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// ============================================
// TO-DO LIST API
// ============================================
app.get('/api/todos', (req, res) => {
    try {
        const todos = readJsonFile(TODOS_FILE);
        todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(todos);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch todos' });
    }
});

app.post('/api/todos', (req, res) => {
    try {
        const { id, text, completed, createdAt } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Task text is required' });
        }

        const todos = readJsonFile(TODOS_FILE);
        const newTodo = {
            id: id || Date.now(),
            text: text.trim(),
            completed: completed || false,
            createdAt: createdAt || new Date().toISOString()
        };

        todos.push(newTodo);
        writeJsonFile(TODOS_FILE, todos);
        res.status(201).json(newTodo);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create todo' });
    }
});

app.put('/api/todos/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { text, completed } = req.body;

        const todos = readJsonFile(TODOS_FILE);
        const todoIndex = todos.findIndex(t => t.id === id);

        if (todoIndex === -1) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        todos[todoIndex] = { ...todos[todoIndex], text, completed };
        writeJsonFile(TODOS_FILE, todos);
        res.json(todos[todoIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update todo' });
    }
});

app.delete('/api/todos/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        let todos = readJsonFile(TODOS_FILE);
        todos = todos.filter(t => t.id !== id);
        writeJsonFile(TODOS_FILE, todos);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete todo' });
    }
});

// ============================================
// WEATHER API (Mock Data)
// ============================================
const weatherData = {
    'london': { city: 'London', country: 'UK', temp: 12, weather: 'Clouds', description: 'Overcast clouds', humidity: 78, wind: 5.2 },
    'paris': { city: 'Paris', country: 'France', temp: 15, weather: 'Clear', description: 'Clear sky', humidity: 65, wind: 3.1 },
    'new york': { city: 'New York', country: 'USA', temp: 18, weather: 'Clear', description: 'Sunny', humidity: 55, wind: 4.5 },
    'tokyo': { city: 'Tokyo', country: 'Japan', temp: 22, weather: 'Clouds', description: 'Scattered clouds', humidity: 70, wind: 2.8 },
    'sydney': { city: 'Sydney', country: 'Australia', temp: 25, weather: 'Clear', description: 'Bright sunshine', humidity: 60, wind: 6.2 },
    'mumbai': { city: 'Mumbai', country: 'India', temp: 32, weather: 'Clouds', description: 'Partly cloudy', humidity: 75, wind: 4.0 },
    'chennai': { city: 'Chennai', country: 'India', temp: 34, weather: 'Clear', description: 'Hot and sunny', humidity: 70, wind: 3.5 },
    'bangalore': { city: 'Bangalore', country: 'India', temp: 28, weather: 'Clouds', description: 'Pleasant weather', humidity: 65, wind: 2.5 },
    'delhi': { city: 'Delhi', country: 'India', temp: 30, weather: 'Haze', description: 'Hazy conditions', humidity: 55, wind: 3.8 },
    'dubai': { city: 'Dubai', country: 'UAE', temp: 38, weather: 'Clear', description: 'Hot and dry', humidity: 40, wind: 5.0 },
    'singapore': { city: 'Singapore', country: 'Singapore', temp: 31, weather: 'Rain', description: 'Light rain', humidity: 85, wind: 2.2 },
    'berlin': { city: 'Berlin', country: 'Germany', temp: 10, weather: 'Clouds', description: 'Cloudy', humidity: 72, wind: 4.8 },
    'moscow': { city: 'Moscow', country: 'Russia', temp: -5, weather: 'Snow', description: 'Light snow', humidity: 88, wind: 3.0 },
    'cairo': { city: 'Cairo', country: 'Egypt', temp: 28, weather: 'Clear', description: 'Sunny and warm', humidity: 35, wind: 4.2 },
    'rome': { city: 'Rome', country: 'Italy', temp: 20, weather: 'Clear', description: 'Beautiful day', humidity: 58, wind: 2.9 }
};

app.get('/api/weather', (req, res) => {
    try {
        const city = req.query.city?.toLowerCase().trim();

        if (!city) {
            return res.status(400).json({ error: 'City name is required' });
        }

        // Check exact match first
        if (weatherData[city]) {
            return res.json(weatherData[city]);
        }

        // Check partial match
        const matchedCity = Object.keys(weatherData).find(c => c.includes(city) || city.includes(c));
        if (matchedCity) {
            return res.json(weatherData[matchedCity]);
        }

        // Generate random weather for unknown cities
        const randomWeather = ['Clear', 'Clouds', 'Rain', 'Mist'];
        const descriptions = ['Pleasant weather', 'Mild conditions', 'Typical weather', 'Seasonal conditions'];

        res.json({
            city: city.charAt(0).toUpperCase() + city.slice(1),
            country: 'Unknown',
            temp: Math.floor(Math.random() * 35) + 5,
            weather: randomWeather[Math.floor(Math.random() * randomWeather.length)],
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            humidity: Math.floor(Math.random() * 50) + 40,
            wind: Math.round((Math.random() * 8 + 1) * 10) / 10
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

// ============================================
// FILES API
// ============================================
app.get('/api/files', (req, res) => {
    try {
        const files = readJsonFile(FILES_FILE);
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

app.post('/api/files', (req, res) => {
    try {
        const fileData = req.body;
        const files = readJsonFile(FILES_FILE);
        files.push(fileData);
        writeJsonFile(FILES_FILE, files);
        res.status(201).json(fileData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save file info' });
    }
});

app.delete('/api/files/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        let files = readJsonFile(FILES_FILE);
        files = files.filter(f => f.id !== id);
        writeJsonFile(FILES_FILE, files);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// ============================================
// CHAT API (Simple Echo with Victorian flair)
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
    "How delightful to engage in such scholarly discourse!"
];

app.post('/api/chat', (req, res) => {
    try {
        const { message } = req.body;
        const response = chatResponses[Math.floor(Math.random() * chatResponses.length)];
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ✦  THE GILDED DESK  ✦                                ║
║                                                           ║
║     Your Elegant Productivity Suite                       ║
║                                                           ║
║     Server running at: http://localhost:${PORT}              ║
║                                                           ║
║     Features:                                             ║
║       • Notes      • To-Do List    • Calculator          ║
║       • Weather    • Chat          • File Cabinet        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});
