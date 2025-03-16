# Planning Poker

A real-time planning poker application for agile teams to estimate story points collaboratively.

## Features

- Create and join planning poker rooms
- Vote on stories using standard Fibonacci sequence (0, 1, 2, 3, 5, 8, 13, 21)
- Special voting options ("?" and "coffee")
- Spectator mode for observers
- Real-time updates using WebSockets
- Reveal/hide votes functionality
- Calculate average of numeric votes
- Easy room sharing with copy button
- Browse active rooms from the home screen

## Tech Stack

- **Frontend**: React, TypeScript, Chakra UI
- **Backend**: Node.js, Express, Socket.IO
- **State Management**: React Context API
- **Styling**: Chakra UI components

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/pointing-poker.git
   cd pointing-poker
   ```

2. Install dependencies for both client and server
   ```
   # Install client dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   ```

### Running the Application

1. Start the server
   ```
   cd server
   npm run dev
   ```

2. In a separate terminal, start the client
   ```
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Create a Room**:
   - Enter your name
   - Enter a room name
   - Click "Create Room"

2. **Join a Room**:
   - Enter your name
   - Select a room from the dropdown or enter a room ID
   - Optionally check "Join as Spectator"
   - Click "Join Room"

3. **In the Room**:
   - Set a story/task description
   - Vote on the story by selecting a card
   - Reveal votes when everyone has voted
   - Reset votes for the next story

## License

MIT

## Acknowledgments

- Fibonacci sequence for story point estimation
- Agile development methodologies
