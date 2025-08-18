
# Moayo - Personal Finance Tracker

A React Native/Expo app for tracking personal finances with multi-currency support, recurring transactions, goals, and analytics.

## Features

- 💰 **Multi-currency support** - Track expenses in different currencies
- 📊 **Spending/Earning goals** - Set goals by categories and timeframes  
- 🏷️ **Custom categories** - Create your own spending categories
- 👤 **User accounts** - Secure authentication and data storage
- 📅 **Calendar view** - See daily spending at a glance
- ⏰ **Timeline filtering** - View data by day/week/month
- � **Analytics graphs** - Visualize spending and earning patterns
- � **Search functionality** - Find transactions by description
- � **Recurring transactions** - Automate regular income and expenses

## Tech Stack

- **Frontend**: React Native + Expo + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **UI**: Custom purple-themed design
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator or Android Emulator (or Expo Go app on your phone)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Moayo
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Get your project URL and anon key from Settings > API
   - Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up the database:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL script from `database/schema.sql` to create the tables

5. Start the development server:
```bash
npm start
```

6. Open the app:
   - Scan the QR code with Expo Go (iOS/Android)
   - Or press `i` for iOS simulator / `a` for Android emulator

## Database Schema

The app uses the following main tables:
- `user_profiles` - User account information
- `categories` - Spending/income categories with icons and colors
- `transactions` - Individual financial transactions
- `recurring_templates` - Templates for recurring transactions
- `goals` - Financial goals by category and timeframe

See `database/schema.sql` for the complete schema with relationships and security policies.

## Development Mode

If Supabase is not configured, the app will automatically use mock data for development. This allows you to see the UI and test functionality without setting up a database.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
