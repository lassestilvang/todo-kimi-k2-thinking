# Daily Planner

A modern, professional daily task planner built with Next.js 16, TypeScript, and SQLite. This application helps you organize your tasks efficiently with a clean, intuitive interface.

## Features

### Core Functionality

- **Lists**: Create custom lists with emojis and colors. Default "Inbox" list included.
- **Tasks**: Full-featured task management including:
  - Name, Description, Date, Deadline
  - Time estimates (HH:mm) and actual time tracking
  - Priority levels (High, Medium, Low, None)
  - Subtasks support
  - Recurring tasks (daily, weekly, monthly, yearly, custom)
  - Attachments
  - Multiple labels per task
  - Reminders
  - Complete activity log
- **Views**: 
  - Today: Tasks scheduled for today
  - Next 7 Days: Your week ahead
  - Upcoming: All future scheduled tasks
  - All: Complete task list
- **Labels**: Organize tasks with colored labels
- **Search**: Fast fuzzy search across all tasks
- **Natural Language Input**: Create tasks using natural language (e.g., "Lunch with Sarah tomorrow at 1pm")

### Technical Features

- **Dark/Light Theme**: System-aware theme switcher
- **Responsive Design**: Works on desktop and mobile
- **View Transitions**: Smooth animations powered by Framer Motion
- **Offline-First**: SQLite database stored locally
- **Type-Safe**: Strict TypeScript throughout
- **Tested**: Comprehensive test coverage with Bun Test

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: SQLite (better-sqlite3)
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Date Handling**: date-fns
- **Search**: Fuse.js (fuzzy search)
- **NLP**: Chrono-node (natural language date parsing)
- **Testing**: Bun Test
- **Runtime**: Bun

## Getting Started

### Prerequisites

- Bun 1.0+ installed

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd project

# Install dependencies
bun install

# Run the development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch
```

### Building for Production

```bash
# Create production build
bun run build

# Start production server
bun start
```

## Project Structure

```
├── app/
│   ├── api/          # API routes
│   ├── globals.css   # Global styles
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Main page
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── planner-app.tsx
│   ├── sidebar.tsx
│   ├── task-item.tsx
│   ├── task-list.tsx
│   └── task-dialog.tsx
├── lib/
│   ├── db/           # Database schema and client
│   ├── services/     # Data access layer
│   ├── stores/       # Zustand stores
│   ├── types/        # TypeScript types
│   └── utils.ts      # Utility functions
└── planner.db        # SQLite database (created on first run)
```

## Database Schema

The application uses SQLite with the following main tables:

- `lists`: Task lists with emoji and color
- `labels`: Task labels
- `tasks`: Main tasks table
- `task_labels`: Many-to-many relationship
- `reminders`: Task reminders
- `attachments`: File attachments
- `task_logs`: Activity logging

## Features to Explore

1. **Quick Add**: Use natural language to quickly create tasks
2. **Task Logs**: View complete history of changes to any task
3. **Priority Management**: Filter and organize by priority
4. **Overdue Tracking**: See badge count of overdue tasks
5. **Flexible Views**: Switch between different time horizons
6. **List Organization**: Group tasks into custom lists
7. **Label System**: Tag tasks with multiple labels
8. **Search**: Quickly find tasks across all lists

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint configured for Next.js
- Prettier for code formatting (via Tailwind CSS)

### Adding New Features

1. Define types in `lib/types/`
2. Create service functions in `lib/services/`
3. Add API routes in `app/api/`
4. Build UI components in `components/`
5. Write tests in `__tests__/` directories

## Performance

- Server-side rendering with Next.js
- Optimized bundle size
- Local SQLite for fast data access
- Efficient state management with Zustand
- Lazy loading of components

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
