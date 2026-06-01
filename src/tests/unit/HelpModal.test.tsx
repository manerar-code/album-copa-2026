import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HelpModal } from '@shared/components/HelpModal';

describe('HelpModal', () => {
  it('renders without crashing', () => {
    const { getByText } = render(
      <HelpModal visible={true} onClose={jest.fn()} />
    );
    expect(getByText('❓ Como funciona')).toBeTruthy();
  });

  it('renders "Ver tutorial" button when onRestartTutorial is provided', () => {
    const { getByText } = render(
      <HelpModal visible={true} onClose={jest.fn()} onRestartTutorial={jest.fn()} />
    );
    expect(getByText('📖 Ver tutorial')).toBeTruthy();
  });

  it('does not render "Ver tutorial" when onRestartTutorial is not provided', () => {
    const { queryByText } = render(
      <HelpModal visible={true} onClose={jest.fn()} />
    );
    expect(queryByText('📖 Ver tutorial')).toBeNull();
  });

  it('calls onRestartTutorial when "Ver tutorial" is pressed', () => {
    const onRestart = jest.fn();
    const { getByText } = render(
      <HelpModal visible={true} onClose={jest.fn()} onRestartTutorial={onRestart} />
    );
    fireEvent.press(getByText('📖 Ver tutorial'));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when "Entendi!" is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <HelpModal visible={true} onClose={onClose} />
    );
    fireEvent.press(getByText('Entendi!'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
