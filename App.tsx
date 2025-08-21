import React from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/screens/AppNavigator';

export default function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
