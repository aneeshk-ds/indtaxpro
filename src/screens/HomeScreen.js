// HomeScreen is bypassed for now - OnboardingScreen serves as the entry point.
// This is a placeholder for a future dashboard after auth/user profile is added.
import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../theme';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Text style={{ color: colors.text }}>Home</Text>
    </View>
  );
}
