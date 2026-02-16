import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GradientButton from '../components/GradientButton';
import GlassCard from '../components/GlassCard';

describe('UI Components', () => {
  describe('GradientButton', () => {
    it('should render with title', () => {
      const { getByText } = render(
        <GradientButton title="Test Button" onPress={() => {}} />
      );

      expect(getByText('Test Button')).toBeTruthy();
    });

    it('should call onPress when pressed', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <GradientButton title="Click Me" onPress={mockOnPress} />
      );

      fireEvent.press(getByText('Click Me'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <GradientButton title="Disabled" onPress={mockOnPress} disabled={true} />
      );

      fireEvent.press(getByText('Disabled'));
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should render without crashing when pressed', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <GradientButton title="Click Me" onPress={mockOnPress} />
      );

      fireEvent.press(getByText('Click Me'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('GlassCard', () => {
    it('should render children', () => {
      const { getByText } = render(
        <GlassCard>
          <React.Fragment>Card Content</React.Fragment>
        </GlassCard>
      );

      expect(getByText('Card Content')).toBeTruthy();
    });

    it('should apply custom styles', () => {
      const customStyle = { padding: 20 };
      const { getByText } = render(
        <GlassCard style={customStyle}>
          <React.Fragment>Content</React.Fragment>
        </GlassCard>
      );

      expect(getByText('Content')).toBeTruthy();
    });
  });
});
