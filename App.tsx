import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { CatalogProvider } from './src/core/providers/CatalogProvider';
import { RootNavigator } from './src/core/navigation/RootNavigator';

export default function App() {
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
});
