import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PrivacyPolicyModal } from '@modules/auth/components/PrivacyPolicyModal';

describe('PrivacyPolicyModal', () => {
  it('renders the close button when visible={true}', () => {
    const { getByTestId } = render(<PrivacyPolicyModal visible={true} onClose={jest.fn()} />);
    expect(getByTestId('close-button')).toBeTruthy();
  });

  it('renders nothing when visible={false}', () => {
    const { queryByTestId } = render(<PrivacyPolicyModal visible={false} onClose={jest.fn()} />);
    expect(queryByTestId('close-button')).toBeNull();
  });

  it('calls onClose exactly once when close button is pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<PrivacyPolicyModal visible={true} onClose={onClose} />);
    fireEvent.press(getByTestId('close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('contains the text "Política de Privacidade" when visible', () => {
    const { getByText } = render(<PrivacyPolicyModal visible={true} onClose={jest.fn()} />);
    expect(getByText('Política de Privacidade')).toBeTruthy();
  });

  it('contains the DPO contact email "manera@kbase.com.br" when visible', () => {
    const { getAllByText } = render(<PrivacyPolicyModal visible={true} onClose={jest.fn()} />);
    const matches = getAllByText(/manera@kbase\.com\.br/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('contains LGPD rights section with Art. 18 mention', () => {
    const { getByText } = render(<PrivacyPolicyModal visible={true} onClose={jest.fn()} />);
    expect(getByText(/Art\. 18/)).toBeTruthy();
  });

  it('contains the last updated date', () => {
    const { getByText } = render(<PrivacyPolicyModal visible={true} onClose={jest.fn()} />);
    expect(getByText(/10 de junho de 2026/)).toBeTruthy();
  });
});
