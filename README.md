
# Moayo (모아요)

*Collect your financial life, one transaction at a time*

Moayo is a personal finance tracking application that helps you record and categorize your spendings and earnings. The name comes from the Korean word "모아" which means "to collect" or "to gather."

## Features

### 📊 **Expense Tracking**
Track your spending across multiple categories:
- 🏠 **Housing** - Rent, mortgage, utilities, maintenance
- 🍽️ **Food** - Groceries, dining out, meal delivery
- 🚗 **Transportation** - Gas, public transit, ride-sharing, car maintenance
- 🛍️ **Miscellaneous** - Shopping, entertainment, subscriptions, and other expenses

### 💰 **Income Management**
Record and categorize your earnings:
- 💼 **Income** - Salary, wages, freelance work
- 🎁 **Bonus** - Performance bonuses, gifts, unexpected income
- 📈 **Other** - Investment returns, side hustles, miscellaneous income

### 📈 **Financial Insights**
- View spending patterns by category
- Track income vs. expenses
- Monthly and yearly financial summaries
- Budget planning and monitoring

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- React Native development environment
- For iOS: Xcode (macOS only)
- For Android: Android Studio

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Q1justin/Moayo.git
cd Moayo
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. For iOS (macOS only):
```bash
cd ios && pod install && cd ..
```

4. Start the Metro bundler:
```bash
npm start
# or
yarn start
```

5. Run the app:
```bash
# For iOS
npm run ios
# or
yarn ios

# For Android
npm run android
# or
yarn android
```

## Usage

1. **Add Expenses**: Record your daily expenses and assign them to appropriate categories
2. **Log Income**: Track all sources of income including salary, bonuses, and side earnings
3. **Review Reports**: Analyze your spending patterns and financial health
4. **Set Budgets**: Create monthly budgets for different expense categories

## Technology Stack

- **Frontend**: React Native with TypeScript
- **Navigation**: React Navigation
- **State Management**: React Context API (with potential for Redux Toolkit)
- **Storage**: AsyncStorage for local data persistence
- **Icons**: React Native Vector Icons
- **Development**: Metro bundler, ESLint, Prettier

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

## Roadmap

- [ ] Basic expense and income tracking
- [ ] Category management
- [ ] Financial reporting and analytics
- [ ] Budget planning features
- [ ] Mobile app support
- [ ] Data export/import functionality
- [ ] Multi-currency support

---

*Start collecting your financial data with Moayo and take control of your money! 💪*
