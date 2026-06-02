import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { colors, fonts, layout } from '../lib/theme'
import { TabIcon } from '../components/Icon'

import HomeScreen from '../screens/HomeScreen'
import FeedScreen from '../screens/FeedScreen'
import ScanScreen from '../screens/ScanScreen'
import StatsScreen from '../screens/StatsScreen'
import ProfileScreen from '../screens/ProfileScreen'
import DogScreen from '../screens/DogScreen'
import AuthScreen from '../screens/AuthScreen'
import ReportScreen from '../screens/ReportScreen'
import SearchScreen from '../screens/SearchScreen'
import DogPassportScreen from '../screens/DogPassportScreen'
import PrivacyScreen from '../screens/PrivacyScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const TAB_MAP = { Home: 'home', Feed: 'search', Scan: 'camera', Stats: 'stats', Profile: 'profile' }

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={TAB_MAP[route.name]} focused={focused} size={22} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          height: layout.tabBarHeight,
          paddingBottom: 12,
          paddingTop: 6,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarLabel: 'Search' }} />
      <Tab.Screen name="Scan" component={ScanScreen} options={{ tabBarLabel: 'Scan' }} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Me' }} />
    </Tab.Navigator>
  )
}

const lightTheme = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.bgScreen,
    card: colors.white,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium:  { fontFamily: 'System', fontWeight: '500' },
    bold:    { fontFamily: 'System', fontWeight: '700' },
    heavy:   { fontFamily: 'System', fontWeight: '800' },
  },
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={lightTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={HomeTabs} />
        <Stack.Screen name="Dog" component={DogScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Report" component={ReportScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="DogPassport" component={DogPassportScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
