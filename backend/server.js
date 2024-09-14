const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 8080;

// Define the path for the data file in the same directory as the server script
const dataFilePath = path.join(__dirname, 'data.json');

let question = [];

// Apply CORS middleware to the express application
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
}));
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    }
});

// Function to save data to a file
const saveDataToFile = (data) => {
    fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error('Error writing to file:', err);
        } else {
            console.log('Data saved to file successfully.');
        }
    });
};

// Function to read data from a file
const readDataFromFile = (callback) => {
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading from file:', err);
            callback(null);
        } else {
            callback(JSON.parse(data));
        }
    });
};

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

app.post('/api/createQuestion', (req, res) => {
    const { questionOption } = req.body;

    question = questionOption;

    // Save the question data to a file
    saveDataToFile(question);

    // Emit an event to notify clients
    io.emit('update', 'newQuestionArrive');

    res.status(200).json({ message: 'Question created successfully', question: questionOption });
});

app.post('/api/saveAnswer', (req, res) => {
    const { questionOption } = req.body;

    question = questionOption;

    // Save the answer data to a file
    saveDataToFile(question);

    // Emit an event to notify clients
    io.emit('update', 'answerSaved');

    res.status(200).json({ message: 'Result saved successfully', question: questionOption });
});

app.get('/api/pollResult', (req, res) => {
    readDataFromFile((data) => {
        res.status(200).json({ message: 'Result fetched successfully', question: data });
    });
});

app.get('/api/question', (req, res) => {
    readDataFromFile((data) => {
        res.status(200).json({ message: 'Question fetched successfully', question: data });
    });
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
