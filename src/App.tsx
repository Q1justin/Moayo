import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

const App = (): JSX.Element => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
  };

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, {color: isDarkMode ? '#ffffff' : '#000000'}]}>
              Moayo (모아요)
            </Text>
            <Text style={[styles.subtitle, {color: isDarkMode ? '#cccccc' : '#666666'}]}>
              Collect your financial life, one transaction at a time
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: isDarkMode ? '#ffffff' : '#000000'}]}>
              📊 Expense Tracking
            </Text>
            <Text style={[styles.sectionText, {color: isDarkMode ? '#cccccc' : '#333333'}]}>
              Track your spending across multiple categories:
            </Text>
            <View style={styles.categoryList}>
              <Text style={[styles.categoryItem, {color: isDarkMode ? '#cccccc' : '#333333'}]}>
                🏠 Housing - Rent, mortgage, utilities
              </Text>
              <Text style={[styles.categoryItem, {color: isDarkMode ? '#cccccc' : '#333333'}]}>
                🍽️ Food - Groceries, dining out
              </Text>
              <Text style={[styles.categoryItem, {color: isDarkMode ? '#cccccc' : '#333333'}]}>
                🚗 Transportation - Gas, transit
              </Text>
              <Text style={[styles.categoryItem, {color: isDarkMode ? '#cccccc' : '#333333'}]}>
                🛍️ Miscellaneous - Shopping, entertainment
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: isDarkMode ? '#ffffff' : '#000000'}]}>
              💰 Income Management
            </Text>
            <Text style={[styles.sectionText, {color: isDarkMode ? '#cccccc' : '#333333'}]}>
              Record and categorize your earnings:
            </Text>
            <View style={styles.categoryList}>
              <Text style={[styles.categoryItem, {color: isDarkMode ? '#cccccc' : '#333333'}]}>
                💼 Income - Salary, wages, freelance
              </Text>
              <Text style={[styles.categoryItem, {color: isDarkMode ? '#cccccc' : '#333333'}]}>
                🎁 Bonus - Performance bonuses, gifts
              </Text>
              <Text style={[styles.categoryItem, {color: isDarkMode ? '#cccccc' : '#333333'}]}>
                📈 Other - Investments, side hustles
              </Text>
            </View>
          </View>

          <View style={styles.comingSoon}>
            <Text style={[styles.comingSoonText, {color: isDarkMode ? '#888888' : '#999999'}]}>
              Full functionality coming soon! 🚀
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 16,
    marginBottom: 10,
  },
  categoryList: {
    paddingLeft: 10,
  },
  categoryItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 5,
  },
  comingSoon: {
    alignItems: 'center',
    marginTop: 40,
    padding: 20,
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default App;
