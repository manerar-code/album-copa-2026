import { Alert, Platform } from 'react-native';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

/**
 * Cross-platform alert helper.
 * On web: uses window.confirm for two-button dialogs, window.alert for single-button.
 * On native (iOS/Android): delegates to React Native Alert.
 */
export function crossPlatformAlert(
  title: string,
  message: string,
  buttons: AlertButton[] = [{ text: 'OK' }],
): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const cancelBtn = buttons.find(b => b.style === 'cancel');
    const confirmBtn = buttons.find(b => b.style !== 'cancel');

    if (cancelBtn && confirmBtn) {
      // eslint-disable-next-line no-undef
      const confirmed = (window as Window).confirm(`${title}\n\n${message}`);
      if (confirmed) confirmBtn.onPress?.();
      else cancelBtn.onPress?.();
    } else {
      // eslint-disable-next-line no-undef
      (window as Window).alert(`${title}\n\n${message}`);
      confirmBtn?.onPress?.();
    }
    return;
  }

  Alert.alert(title, message, buttons);
}
