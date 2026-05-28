import { Tabs } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tab.active,
        tabBarInactiveTintColor: Colors.tab.inactive,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text.primary,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: '찜 목록',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
