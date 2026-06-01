import React from 'react';
import { render } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { withRepeat } from 'react-native-reanimated';
import { SkeletonBox } from '@shared/components/SkeletonBox';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return {
    ...Reanimated,
    withRepeat: jest.fn((animation) => animation),
    withTiming: jest.fn((value) => value),
    cancelAnimation: jest.fn(),
  };
});

const mockIsReduceMotionEnabled = jest.spyOn(
  AccessibilityInfo,
  'isReduceMotionEnabled',
);

beforeEach(() => {
  mockIsReduceMotionEnabled.mockResolvedValue(false);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('SkeletonBox', () => {
  it('renders without crash with minimum props', () => {
    const { toJSON } = render(<SkeletonBox width={100} height={20} />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders without crash with all props provided', () => {
    const { toJSON } = render(
      <SkeletonBox
        width="80%"
        height={40}
        borderRadius={12}
        style={{ marginTop: 8 }}
        testID="skeleton-full"
      />,
    );
    expect(toJSON()).not.toBeNull();
  });

  it('propagates testID to the root element', () => {
    const { getByTestId } = render(
      <SkeletonBox width={100} height={20} testID="skeleton-test" />,
    );
    expect(getByTestId('skeleton-test')).toBeTruthy();
  });

  it('does not start animation when reduceMotion is enabled', async () => {
    mockIsReduceMotionEnabled.mockResolvedValue(true);

    render(<SkeletonBox width={100} height={20} testID="skeleton-reduced" />);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(withRepeat).not.toHaveBeenCalled();
  });

  it('starts animation when reduceMotion is disabled', async () => {
    render(<SkeletonBox width={100} height={20} testID="skeleton-anim" />);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(withRepeat).toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <SkeletonBox width={200} height={24} borderRadius={8} testID="skeleton-snap" />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
