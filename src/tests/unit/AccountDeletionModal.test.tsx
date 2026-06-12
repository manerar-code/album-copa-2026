import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AccountDeletionModal } from '@modules/auth/components/AccountDeletionModal';

describe('AccountDeletionModal', () => {
  it('renders confirm-input and confirm-deletion-btn when visible={true}', () => {
    const { getByTestId } = render(
      <AccountDeletionModal visible={true} onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );
    expect(getByTestId('confirm-input')).toBeTruthy();
    expect(getByTestId('confirm-deletion-btn')).toBeTruthy();
  });

  it('confirm-deletion-btn is disabled when input value is empty', () => {
    const { getByTestId } = render(
      <AccountDeletionModal visible={true} onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );
    expect(getByTestId('confirm-deletion-btn')).toBeDisabled();
  });

  it('confirm-deletion-btn is disabled when input value is "excluir" (lowercase)', () => {
    const { getByTestId } = render(
      <AccountDeletionModal visible={true} onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );
    const input = getByTestId('confirm-input');
    fireEvent.changeText(input, 'excluir');
    expect(getByTestId('confirm-deletion-btn')).toBeDisabled();
  });

  it('confirm-deletion-btn is enabled when input value is exactly "EXCLUIR"', () => {
    const { getByTestId } = render(
      <AccountDeletionModal visible={true} onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );
    const input = getByTestId('confirm-input');
    fireEvent.changeText(input, 'EXCLUIR');
    expect(getByTestId('confirm-deletion-btn')).toBeEnabled();
  });

  it('pressing confirm-deletion-btn with input "EXCLUIR" calls onConfirm', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <AccountDeletionModal visible={true} onConfirm={onConfirm} onCancel={jest.fn()} />,
    );
    const input = getByTestId('confirm-input');
    fireEvent.changeText(input, 'EXCLUIR');
    fireEvent.press(getByTestId('confirm-deletion-btn'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('pressing cancel-deletion-btn calls onCancel without calling onConfirm', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <AccountDeletionModal visible={true} onConfirm={onConfirm} onCancel={onCancel} />,
    );
    fireEvent.press(getByTestId('cancel-deletion-btn'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('renders nothing when visible={false}', () => {
    const { queryByTestId } = render(
      <AccountDeletionModal visible={false} onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );
    expect(queryByTestId('confirm-input')).toBeNull();
    expect(queryByTestId('confirm-deletion-btn')).toBeNull();
  });

  it('shows ActivityIndicator when loading is true', () => {
    const { queryByText } = render(
      <AccountDeletionModal
        visible={true}
        loading={true}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(queryByText('Confirmar exclusão')).toBeNull();
  });
});
