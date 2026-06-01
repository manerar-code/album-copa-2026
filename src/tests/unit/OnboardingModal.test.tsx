import React, { act } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import { OnboardingModal } from '@modules/onboarding/components/OnboardingModal';

let backHandlerCallback: (() => boolean) | null = null;

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.BackHandler.addEventListener = jest.fn((_event: string, handler: () => boolean) => {
    backHandlerCallback = handler;
    return { remove: jest.fn() };
  });
  RN.BackHandler.removeEventListener = jest.fn();
  return RN;
});

describe('OnboardingModal', () => {
  beforeEach(() => {
    backHandlerCallback = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when visible is false', () => {
    const onComplete = jest.fn();
    const { queryByTestId } = render(
      <OnboardingModal visible={false} onComplete={onComplete} />,
    );
    expect(queryByTestId('skip-button')).toBeNull();
  });

  it('shows Slide 1 by default when visible is true', () => {
    const onComplete = jest.fn();
    const { getByText } = render(
      <OnboardingModal visible={true} onComplete={onComplete} />,
    );
    expect(getByText('Como marcar figurinhas')).toBeTruthy();
  });

  it('navigates to Slide 2 when Próximo is pressed on Slide 1', () => {
    const onComplete = jest.fn();
    const { getByText, getByTestId } = render(
      <OnboardingModal visible={true} onComplete={onComplete} />,
    );
    fireEvent.press(getByTestId('next-button'));
    expect(getByText('Crie sua conta')).toBeTruthy();
  });

  it('navigates to Slide 3 when Próximo is pressed on Slide 2', () => {
    const onComplete = jest.fn();
    const { getByText, getByTestId } = render(
      <OnboardingModal visible={true} onComplete={onComplete} />,
    );
    fireEvent.press(getByTestId('next-button'));
    fireEvent.press(getByTestId('next-button'));
    expect(getByText('Conheça o App')).toBeTruthy();
  });

  it('calls onComplete when Concluir is pressed on Slide 3', () => {
    const onComplete = jest.fn();
    const { getByTestId } = render(
      <OnboardingModal visible={true} onComplete={onComplete} />,
    );
    fireEvent.press(getByTestId('next-button'));
    fireEvent.press(getByTestId('next-button'));
    fireEvent.press(getByTestId('complete-button'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when Pular is pressed on any slide', () => {
    const onComplete = jest.fn();
    const { getByTestId } = render(
      <OnboardingModal visible={true} onComplete={onComplete} />,
    );
    fireEvent.press(getByTestId('skip-button'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when Pular is pressed on Slide 2', () => {
    const onComplete = jest.fn();
    const { getByTestId } = render(
      <OnboardingModal visible={true} onComplete={onComplete} />,
    );
    fireEvent.press(getByTestId('next-button'));
    fireEvent.press(getByTestId('skip-button'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when Pular is pressed on Slide 3', () => {
    const onComplete = jest.fn();
    const { getByTestId } = render(
      <OnboardingModal visible={true} onComplete={onComplete} />,
    );
    fireEvent.press(getByTestId('next-button'));
    fireEvent.press(getByTestId('next-button'));
    fireEvent.press(getByTestId('skip-button'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('tapping DemoStickerCard cycles through states', () => {
    const onComplete = jest.fn();
    const { getByTestId } = render(
      <OnboardingModal visible={true} onComplete={onComplete} />,
    );
    const demoCard = getByTestId('demo-sticker-card');
    expect(demoCard).toBeTruthy();
    fireEvent.press(demoCard);
    fireEvent.press(demoCard);
    fireEvent.press(demoCard);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('Android BackHandler on Slide 2 returns to Slide 1', async () => {
    const onComplete = jest.fn();
    const { getByText, getByTestId } = render(
      <OnboardingModal visible={true} onComplete={onComplete} />,
    );
    fireEvent.press(getByTestId('next-button'));
    expect(getByText('Crie sua conta')).toBeTruthy();
    expect(backHandlerCallback).not.toBeNull();
    let result = false;
    await act(async () => {
      result = backHandlerCallback!();
    });
    expect(result).toBe(true);
    expect(getByText('Como marcar figurinhas')).toBeTruthy();
  });

  it('Android BackHandler on Slide 1 does not navigate back', async () => {
    const onComplete = jest.fn();
    const { getByText } = render(
      <OnboardingModal visible={true} onComplete={onComplete} />,
    );
    expect(getByText('Como marcar figurinhas')).toBeTruthy();
    expect(backHandlerCallback).not.toBeNull();
    await act(async () => {
      backHandlerCallback!();
    });
    expect(getByText('Como marcar figurinhas')).toBeTruthy();
  });

  it('completes full flow: Slide 1 -> 2 -> 3 -> Concluir', () => {
    const onComplete = jest.fn();
    const { getByText, getByTestId } = render(
      <OnboardingModal visible={true} onComplete={onComplete} />,
    );
    expect(getByText('Como marcar figurinhas')).toBeTruthy();
    fireEvent.press(getByTestId('next-button'));
    expect(getByText('Crie sua conta')).toBeTruthy();
    fireEvent.press(getByTestId('next-button'));
    expect(getByText('Conheça o App')).toBeTruthy();
    fireEvent.press(getByTestId('complete-button'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not call onComplete when navigating between slides', () => {
    const onComplete = jest.fn();
    const { getByTestId } = render(
      <OnboardingModal visible={true} onComplete={onComplete} />,
    );
    fireEvent.press(getByTestId('next-button'));
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.press(getByTestId('next-button'));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('resets to Slide 1 when modal visibility changes from false to true', () => {
    const onComplete = jest.fn();
    const { getByText, getByTestId, rerender } = render(
      <OnboardingModal visible={true} onComplete={onComplete} />,
    );
    fireEvent.press(getByTestId('next-button'));
    expect(getByText('Crie sua conta')).toBeTruthy();
    rerender(<OnboardingModal visible={false} onComplete={onComplete} />);
    rerender(<OnboardingModal visible={true} onComplete={onComplete} />);
    expect(getByText('Como marcar figurinhas')).toBeTruthy();
  });
});
