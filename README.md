# Sery's Infinite Library

A modern web application that combines creative tools, AI capabilities, and a character-based card game. This project showcases the integration of multiple cutting-edge technologies in a user-friendly interface.

## 🌟 Features

### 1. Interactive Drawing (TLDraw)
- Built-in drawing and diagramming tool
- Real-time collaborative features
- Modern canvas interface

### 2. AI Chatbot
- Integration with Grok for intelligent conversations
- Advanced image generation capabilities using Flux:
  - Quick generate with optimized defaults
  - Advanced controls for pose, style, mood, and background
  - Permanent image storage in Supabase
  - Up to 6 images per character with manual deletion
  - Seed tracking for reproducible results
- Interactive chat interface

### 3. CharaSphere Card Game
- Character-based exploration game system
- Grid-based movement with hidden tiles
- Character collection and switching mechanics
- Special abilities and gold collection
- Move management system with auto-refresh
- Progress saving and loading
- Character dialog events
- Sound effects and animations
- Touch and keyboard controls
- Multiplayer capabilities (coming soon)

## 🛠 Tech Stack

- **Frontend**: Next.js 13+ with App Router
- **UI**: TailwindCSS with custom animations
- **Database**: Supabase with Row Level Security
- **Storage**: Supabase Storage for permanent image hosting
- **Authentication**: Supabase Auth
- **Drawing**: TLDraw
- **AI Integration**: 
  - Grok API for chat
  - Flux API for high-quality image generation
  - Server-side image processing and storage

## 🏗 Project Structure

```
src/
├── app/
│   ├── chatbot/      # AI chat interface
│   ├── charasphere/  # Card game system
│   ├── tldraw/       # Drawing interface
│   └── components/   # Shared components
├── lib/
│   ├── supabase.ts   # Database client
│   └── queries.ts    # Database operations
└── types/           # TypeScript definitions
```

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## 📊 Database Integration

For comprehensive database documentation, including:
- Complete schema definitions
- All available operations (CRUD)
- Type-safe usage examples
- Real-time subscriptions
- Error handling

Please refer to [Database Documentation](src/app/db-manager/supabase.md).

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Public read access with authenticated write operations
- Secure environment variable management
- Protected API routes
- Server-side image processing and storage
- Secure storage bucket policies for public assets

For detailed security policies and database access patterns, see the [Database Documentation](src/app/db-manager/supabase.md).

## 🎨 UI/UX Features

- Responsive design for all screen sizes
- Modern gradient animations
- Interactive card layouts with image galleries
- Advanced image generation controls
- Star field background animation
- Smooth transitions and hover effects

## 🎮 Game Features

### Movement & Exploration
- 5x5 grid with hidden tiles
- Move using arrow keys or touch swipes
- Discover tiles with different rewards:
  - Low-value tiles (1 gold)
  - High-value tiles (3 gold)
  - Event tiles (random 1-6 gold + dialog)

### Character System
- Switch between collected characters
- Character-specific dialogs
- Special ability for bonus gold
- Image cycling for characters with multiple generations
- Character switching costs 10 moves

### Progress System
- 30 moves with auto-refresh (10 moves per minute)
- Gold collection and tracking
- Progress saving per character
- Grid state persistence
- Visual progress indicators

### Sound & Animation
- Sound effects for all actions
- Smooth card flip animations
- Character switch transitions
- Progress bar animations
- Touch feedback effects

## 🤝 Contributing

This is a hobbyist project open for learning and collaboration. Feel free to:
- Fork the repository
- Submit pull requests
- Use the code for training AI models
- Suggest improvements

Before making database-related changes, please review the [Database Documentation](src/app/db-manager/supabase.md) to understand the current schema and operations.

## 📧 Contact

For questions or suggestions, contact the developer:
- Email: qaidlex@gmail.com

## 📝 License

This project is open for AI training and educational purposes.
