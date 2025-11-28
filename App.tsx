import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
  usePushNotifications();

  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a1a',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#121212',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'I.M.I.F',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="grid" 
          options={{ 
            title: 'Escolha um Número',
            headerBackTitle: 'Voltar'
          }} 
        />
        <Stack.Screen 
          name="confirm" 
          options={{ 
            title: 'Confirmar Reserva',
            headerBackTitle: 'Voltar'
          }} 
        />
        <Stack.Screen 
          name="login" 
          options={{ 
            title: 'Admin Login',
            headerBackTitle: 'Voltar'
          }} 
        />
        <Stack.Screen 
          name="admin" 
          options={{ 
            title: 'Painel Admin',
            headerBackVisible: false,
            gestureEnabled: false
          }} 
        />
      </Stack>
    </ErrorBoundary>
  );
}
