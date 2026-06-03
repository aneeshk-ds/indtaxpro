import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';

import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import IncomeInputScreen from '../screens/us/IncomeInputScreen';
import RSUScreen from '../screens/us/RSUScreen';
import ScheduleFAScreen from '../screens/us/ScheduleFAScreen';
import DTAAScreen from '../screens/us/DTAAScreen';
import RiskReportScreen from '../screens/us/RiskReportScreen';
import ITRSelectorScreen from '../screens/standard/ITRSelectorScreen';
import RegimeComparatorScreen from '../screens/standard/RegimeComparatorScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600', fontSize: 17 },
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Onboarding" screenOptions={screenOptions}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />

        {/* US Income Flow */}
        <Stack.Screen name="IncomeInput" component={IncomeInputScreen} options={{ title: 'US Income Details' }} />
        <Stack.Screen name="RSU" component={RSUScreen} options={{ title: 'RSU / ESPP Calculator' }} />
        <Stack.Screen name="ScheduleFA" component={ScheduleFAScreen} options={{ title: 'Schedule FA Check' }} />
        <Stack.Screen name="DTAA" component={DTAAScreen} options={{ title: 'DTAA / Form 67 Check' }} />
        <Stack.Screen name="RiskReport" component={RiskReportScreen} options={{ title: 'Filing Risk Report' }} />

        {/* Standard Flow */}
        <Stack.Screen name="ITRSelector" component={ITRSelectorScreen} options={{ title: 'ITR Form Selector' }} />
        <Stack.Screen name="RegimeComparator" component={RegimeComparatorScreen} options={{ title: 'Tax Regime Comparison' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
