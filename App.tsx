import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { CatalogProvider } from './src/app/providers/CatalogProvider';
import { RootNavigator } from './src/app/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      <CatalogProvider>
        <RootNavigator />
      </CatalogProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
