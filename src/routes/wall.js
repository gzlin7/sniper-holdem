const express = require('express');
const router = express.Router();

let wallEntries = [];

// Route to display the wall
router.get('/', (req, res) => {
    res.json(wallEntries);
});

// Route to submit new text entry
router.post('/submit', (req, res) => {
    const newEntry = req.body.text;
    if (newEntry) {
        wallEntries.push(newEntry);
        res.status(201).json({ message: 'Entry added successfully!' });
    } else {
        res.status(400).json({ message: 'Entry cannot be empty!' });
    }
});

module.exports = router;