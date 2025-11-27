import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Bem-vindo' }} />
      <Stack.Screen name="grid" options={{ title: 'Escolha um Número' }} />
      <Stack.Screen name="confirm" options={{ title: 'Confirmar Doação' }} />
      <Stack.Screen name="login" options={{ title: 'Login Admin' }} />
      <Stack.Screen name="admin" options={{ title: 'Administração' }} />
    </Stack>
  );
}
