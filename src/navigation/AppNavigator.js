import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';

import OnboardingScreen from '../screens/OnboardingScreen';
import LearnScreen from '../screens/LearnScreen';
import IncomeInputScreen from '../screens/us/IncomeInputScreen';
import RSUScreen from '../screens/us/RSUScreen';
import ScheduleFAScreen from '../screens/us/ScheduleFAScreen';
import DTAAScreen from '../screens/us/DTAAScreen';
import RiskReportScreen from '../screens/us/RiskReportScreen';
import ITRSelectorScreen from '../screens/standard/ITRSelectorScreen';
import RegimeComparatorScreen from '../screens/standard/RegimeComparatorScreen';

const screenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600', fontSize: 17 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

const USStack = createNativeStackNavigator();
function USFilingStack() {
  return (
    <USStack.Navigator screenOptions={screenOptions}>
      <USStack.Screen name="IncomeInput" component={IncomeInputScreen} options={{ title: 'US Income' }} />
      <USStack.Screen name="RSU" component={RSUScreen} options={{ title: 'RSU / ESPP' }} />
      <USStack.Screen name="ScheduleFA" component={ScheduleFAScreen} options={{ title: 'Schedule FA' }} />
      <USStack.Screen name="DTAA" component={DTAAScreen} options={{ title: 'DTAA / Form 67' }} />
      <USStack.Screen name="RiskReport" component={RiskReportScreen} options={{ title: 'Risk Report' }} />
    </USStack.Navigator>
  );
}

const StdStack = createNativeStackNavigator();
function IndianTaxStack() {
  return (
    <StdStack.Navigator screenOptions={screenOptions}>
      <StdStack.Screen name="ITRSelector" component={ITRSelectorScreen} options={{ title: 'ITR Form Selector' }} />
      <StdStack.Screen name="RegimeComparator" component={RegimeComparatorScreen} options={{ title: 'Regime Comparison' }} />
    </StdStack.Navigator>
  );
}

const LearnStack = createNativeStackNavigator();
function LearnStackNav() {
  return (
    <LearnStack.Navigator screenOptions={screenOptions}>
      <LearnStack.Screen name="LearnHome" component={LearnScreen} options={{ title: 'Learn' }} />
    </LearnStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

function tabIcon(glyph) {
  return function TabIcon({ color }) {
    return <Text style={{ color, fontSize: 17, fontWeight: '800' }}>{glyph}</Text>;
  };
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bgCard, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="USFiling" component={USFilingStack} options={{ title: 'US Filing', tabBarIcon: tabIcon('$') }} />
      <Tab.Screen name="IndianTax" component={IndianTaxStack} options={{ title: 'Indian Tax', tabBarIcon: tabIcon('₹') }} />
      <Tab.Screen name="Learn" component={LearnStackNav} options={{ title: 'Learn', tabBarIcon: tabIcon('?') }} />
    </Tab.Navigator>
  );
}

const Root = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={screenOptions}>
        <Root.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Root.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      </Root.Navigator>
    </NavigationContainer>
  );
}
