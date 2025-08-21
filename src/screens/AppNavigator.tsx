import React from 'react';
import { View, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import HomePage from './HomePage';
import LoginScreen from './LoginScreen';

export default function AppNavigator(): React.JSX.Element {
  const { user, loading } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';

  const colors = {
    primary: '#A78BFA',
    background: isDarkMode ? '#1a1a1a' : '#F8F6FF',
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show HomePage if user is authenticated, otherwise show LoginScreen
  return user ? <HomePage /> : <LoginScreen />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
