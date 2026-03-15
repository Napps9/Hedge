# Hedge - AI Lifestyle Assistant

An AI-powered lifestyle app that recommends places to visit and book based on your calendar, email, and preferences. Built with React, Node.js, and Claude AI.

## Features

- 🔐 **Google OAuth Login** - Sign in securely with your Gmail account
- 📅 **Calendar Integration** - Access your Google Calendar events
- 📧 **Email Analysis** - AI learns your preferences from your emails
- 🤖 **AI Recommendations** - Claude-powered place recommendations
- 🗺️ **Google Places** - Integration with Google Places API
- 💬 **Natural Language Interface** - Ask questions in plain English
- 📍 **Smart Suggestions** - Get recommendations on available times if places are booked

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client

### Backend
- **Node.js + Express** - Server framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Anthropic Claude API** - AI recommendations
- **Google APIs** - Calendar, Gmail, Places integration

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Google Cloud Project with OAuth credentials
- Anthropic API key

### Environment Variables

Create `.env` files in both `server/` and `client/` directories:

**server/.env:**
```
DATABASE_URL=postgresql://user:password@localhost:5432/hedge
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/callback
CLAUDE_API_KEY=sk-your-key
JWT_SECRET=your_secret_key
NODE_ENV=development
CLIENT_URL=http://localhost:5173
PORT=3000
```

**client/.env:**
```
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_client_id
```

### Installation

1. Install dependencies:
```bash
cd server && npm install
cd ../client && npm install
```

2. Set up the database:
```bash
cd server
npm run db:migrate
```

3. Start the development servers:
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

Visit `http://localhost:5173` to see the app.

## Project Structure

```
hedge/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API integration
│   │   ├── types/      # TypeScript definitions
│   │   └── App.tsx     # Main app component
│   └── index.html      # HTML entry point
│
└── server/             # Node.js backend
    ├── src/
    │   ├── routes/     # API endpoints
    │   ├── services/   # Business logic
    │   ├── db/         # Database schema & migrations
    │   ├── middleware/ # Express middleware
    │   └── types/      # TypeScript definitions
    └── index.ts        # Server entry point
```

## API Endpoints

- `GET /health` - Health check
- `GET /auth/url` - Get Google OAuth URL
- `POST /auth/callback` - Handle OAuth callback
- `GET /auth/me` - Get current user
- `POST /api/recommendations` - Get place recommendations

## Development Phases

- **Phase 1** ✅ Project setup & infrastructure
- **Phase 2** - Google integrations (Calendar, Gmail, Places)
- **Phase 3** - Claude AI agent & recommendation engine
- **Phase 4** - Frontend conversation UI
- **Phase 5** - Integration & deployment

## Contributing

See CONTRIBUTING.md for guidelines.

## License

MIT
