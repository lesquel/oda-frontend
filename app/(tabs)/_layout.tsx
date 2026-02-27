import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { useThemedColors } from '@/hooks/use-themed-colors';

export default function TabLayout() {
  const C = useThemedColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.wax,
        tabBarInactiveTintColor: C.pencil,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border.light,
          borderTopWidth: 1,
        },
      }}>
      {/* Home — left */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Search — centre */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Profile — right */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

