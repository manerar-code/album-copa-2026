import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { Archivo_800ExtraBold, Archivo_700Bold, Archivo_500Medium } from '@expo-google-fonts/archivo';
import { Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { CatalogProvider } from './src/core/providers/CatalogProvider';
import { RootNavigator } from './src/core/navigation/RootNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
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

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#E7B43C" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CatalogProvider>
        <RootNavigator />
      </CatalogProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, backgroundColor: '#0A0F1C', alignItems: 'center', justifyContent: 'center' },
});
