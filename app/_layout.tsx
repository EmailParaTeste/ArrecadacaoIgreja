import { Stack } from 'expo-router';
import { COLORS } from '../src/constants/theme';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: COLORS.primary,
        },
        contentStyle: {
          backgroundColor: COLORS.background,
        }
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
