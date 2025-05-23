# Sniper Hold'em Poker (React + Socket.IO)

This project is a two-player poker game built with React for the frontend and Socket.IO/Express for the backend.  
Players connect to the same server and play against each other in real time.

## How to Run

### 1. Start the backend server

In the project root:

```bash
node src/server.js
```

This starts the Express/Socket.IO server on [http://localhost:3000](http://localhost:3000).

### 2. Start the React frontend

In a separate terminal, in the same directory:

```bash
npm install
npm start
```

This starts the React app on [http://localhost:3000](http://localhost:3000) (proxying API/socket requests to the backend).

### 3. Play the game

- Open [http://localhost:3000](http://localhost:3000) in two browser windows/tabs.
- Each window will be matched as a player (Player 1 or Player 2).
- Play poker in real time with the other client.

## Project Structure

- `src/server.js` — Express + Socket.IO backend for matchmaking and relaying game actions.
- `src/views/App.jsx` — Main React app (poker table, controls, game state).
- `src/views/` — React components and logic (e.g. `blindLogic.js`, `snipeLogic.js`, etc).

## How it works

- When a client opens the app, it connects to the server via Socket.IO and waits for an opponent.
- When two clients are connected, they are paired in a room and assigned roles.
- All game actions (raise, fold, check, snipe, etc.) are sent via Socket.IO and synchronized between both clients.
- The UI updates in real time for both players.

## Development Notes

- The React app uses functional components and hooks.
- Socket.IO is used for real-time communication.
- The backend does not store persistent state; all game state is synchronized between the two clients.

---

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
