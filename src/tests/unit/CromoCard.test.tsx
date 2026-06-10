import React from 'react';
import { render } from '@testing-library/react-native';
import { CromoCard } from '@shared/components/CromoCard';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: React.PropsWithChildren<object>) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

describe('CromoCard state rendering', () => {
  it('renders a View (testID cromo-owned) when state="owned"', () => {
    const { getByTestId } = render(<CromoCard numero="001" state="owned" />);
    expect(getByTestId('cromo-owned')).toBeTruthy();
  });

  it('does NOT render a check icon element when state="owned"', () => {
    const { queryByText } = render(<CromoCard numero="001" state="owned" />);
    expect(queryByText('✓')).toBeNull();
  });

  it('includes borderColor with green value when state="owned"', () => {
    const { getByTestId } = render(<CromoCard numero="001" state="owned" />);
    const ownedView = getByTestId('cromo-owned');
    expect(ownedView.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          borderColor: '#2BD17E',
          borderWidth: 2.5,
        }),
      ]),
    );
  });

  it('renders LinearGradient (testID cromo-duplicate) when state="duplicate"', () => {
    const { getByTestId } = render(<CromoCard numero="001" state="duplicate" />);
    expect(getByTestId('cromo-duplicate')).toBeTruthy();
  });

  it('renders missing state unchanged (testID cromo-missing) when state="missing"', () => {
    const { getByTestId } = render(<CromoCard numero="001" state="missing" />);
    expect(getByTestId('cromo-missing')).toBeTruthy();
  });

  it('renders ×2 badge when state="duplicate" and dupCount=2', () => {
    const { getByText } = render(<CromoCard numero="001" state="duplicate" dupCount={2} />);
    expect(getByText('×2')).toBeTruthy();
  });

  it('does NOT render × badge when state="duplicate" and dupCount=1', () => {
    const { queryByText } = render(<CromoCard numero="001" state="duplicate" dupCount={1} />);
    expect(queryByText(/×/)).toBeNull();
  });

  it('does NOT render × badge when state="owned" even with dupCount=2', () => {
    const { queryByText } = render(<CromoCard numero="001" state="owned" dupCount={2} />);
    expect(queryByText(/×/)).toBeNull();
  });
});
