# GAMITAR

🕹️ Multiplayer Unicode Grid Game

A real-time multiplayer web application where players can select and update blocks in a 10×10 shared grid with Unicode characters.
Once a player submits a character, they cannot modify any other block unless the timed restriction expires.

🚀 Features

Shared Multiplayer Grid: All players interact on the same 10×10 grid.

Real-time Updates: Changes are instantly visible to all connected players using WebSockets.

One Attempt Rule: Once a player submits a character, they cannot edit any block again (configurable for timed restriction).

Player Count Display: Shows how many players are currently online.

Optional Feature: 1-minute cooldown period before a player can edit again.

Optional Feature: Historical updates tracking (grid state history).


🧠 Tech Stack

Frontend: React.js, TypeScript, TailwindCSS

Backend: Node.js, Express.js, WebSocket (Socket.IO)

State Management: React Context / Redux

Hosting (Optional): Render / Vercel / Netlify


2️⃣ Install Dependencies
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

3️⃣ Run the Application
# Run backend (in /server)
npm run dev

# Run frontend (in /client)
npm start


🧪 Testing Multiplayer Functionality

To test the real-time multiplayer feature:

Start the backend and frontend.

Open https://gamitarunicode.netlify.app/
 in one browser tab (Player 1).

Open the same URL in another tab or browser window (Player 2).

When Player 1 updates a block, Player 2 will see it update instantly.

Both players can see the number of connected players at the top.


📜 AI Tools Disclosure

This project was partially developed using Claude (Anthropic AI) for:

Structuring the README file

Generating basic boilerplate for the backend WebSocket setup

Code review and documentation assistance

All code logic, architecture, and testing were reviewed and finalized manually.
