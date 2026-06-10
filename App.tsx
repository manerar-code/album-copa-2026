import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';

// Corrige cor de seleção de texto na web (padrão fica branco sobre fundo claro)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = [
    '::selection { background: rgba(43,209,126,0.35); color: inherit; }',
    '::-moz-selection { background: rgba(43,209,126,0.35); color: inherit; }',
  ].join('\n');
  document.head.appendChild(style);
}
import { Archivo_800ExtraBold, Archivo_700Bold, Archivo_500Medium } from '@expo-google-fonts/archivo';
import { Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CatalogProvider } from './src/core/providers/CatalogProvider';
import { RootNavigator } from './src/core/navigation/RootNavigator';

// Manter splash nativo visível até as fontes resolverem
// DEVE ser chamado em module scope (fora do componente) — ADR-002
SplashScreen.preventAutoHideAsync();

// Timeout máximo para esconder o splash (3s).
// Garante que o app nunca fique preso na splash screen mesmo se
// useFonts travar (ex: asset resolver lento em produção).
const SPLASH_TIMEOUT_MS = 3000;

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Archivo: Archivo_800ExtraBold,
    'Archivo-Bold': Archivo_700Bold,
    'Archivo-Medium': Archivo_500Medium,
    Manrope: Manrope_400Regular,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
    'Manrope-ExtraBold': Manrope_800ExtraBold,
    'JetBrains Mono': JetBrainsMono_500Medium,
    'JetBrains Mono Bold': JetBrainsMono_700Bold,
  });

  // `ready` desacopla "fontes prontas" de "splash pode esconder"
  const [ready, setReady] = useState(false);
  const splashHidden = useRef(false);

  const hideSplash = useCallback(() => {
    if (!splashHidden.current) {
      splashHidden.current = true;
      SplashScreen.hideAsync().catch(() => {});
      setReady(true);
    }
  }, []);

  // Esconder quando fontes resolverem (sucesso ou erro)
  useEffect(() => {
    if (fontsLoaded || fontError) {
      hideSplash();
    }
  }, [fontsLoaded, fontError, hideSplash]);

  // Fallback de segurança: esconder após SPLASH_TIMEOUT_MS mesmo sem fontes
  useEffect(() => {
    const timer = setTimeout(hideSplash, SPLASH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [hideSplash]);

  // Manter splash nativo visível enquanto aguarda
  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <CatalogProvider>
        <RootNavigator />
      </CatalogProvider>
    </GestureHandlerRootView>
  );
}
