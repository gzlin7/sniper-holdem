# sniper-holdem
A simple web application that allows users to enter text onto a wall.

## Project Structure
```
sniper-holdem
├── src
│   ├── server.js          # Entry point of the application
│   ├── routes
│   │   └── wall.js        # Handles routes related to the text wall
│   └── views
│       └── index.html     # HTML structure for the web application
├── package.json           # Configuration file for npm
└── README.md              # Documentation for the project
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd sniper-holdem
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage
To start the server, run:
```
node src/server.js
```
Then, open your browser and go to `http://localhost:3000` to access the application.

## Features
- Users can submit text entries.
- Submitted text is displayed on the wall.