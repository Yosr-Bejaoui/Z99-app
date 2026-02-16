import { NavigationContainer } from '@react-navigation/native';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      reset: mockReset,
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Screen Navigation', () => {
    it('should navigate to ImageGen screen', () => {
      mockNavigate('ImageGen');
      expect(mockNavigate).toHaveBeenCalledWith('ImageGen');
    });

    it('should navigate to TextToSpeech screen', () => {
      mockNavigate('TextToSpeech');
      expect(mockNavigate).toHaveBeenCalledWith('TextToSpeech');
    });

    it('should navigate to ImageToVideo screen', () => {
      mockNavigate('ImageToVideo');
      expect(mockNavigate).toHaveBeenCalledWith('ImageToVideo');
    });

    it('should navigate to VideoEffects screen', () => {
      mockNavigate('VideoEffects');
      expect(mockNavigate).toHaveBeenCalledWith('VideoEffects');
    });

    it('should navigate to ImageEditor screen', () => {
      mockNavigate('ImageEditor');
      expect(mockNavigate).toHaveBeenCalledWith('ImageEditor');
    });

    it('should navigate to ImageTo3D screen', () => {
      mockNavigate('ImageTo3D');
      expect(mockNavigate).toHaveBeenCalledWith('ImageTo3D');
    });

    it('should navigate to History screen', () => {
      mockNavigate('History');
      expect(mockNavigate).toHaveBeenCalledWith('History');
    });

    it('should navigate to Credits screen', () => {
      mockNavigate('Credits');
      expect(mockNavigate).toHaveBeenCalledWith('Credits');
    });

    it('should navigate to Profile screen', () => {
      mockNavigate('Profile');
      expect(mockNavigate).toHaveBeenCalledWith('Profile');
    });

    it('should navigate to AdRewards screen', () => {
      mockNavigate('AdRewards');
      expect(mockNavigate).toHaveBeenCalledWith('AdRewards');
    });
  });

  describe('Navigation with Parameters', () => {
    it('should navigate to Chat with model ID', () => {
      mockNavigate('Chat', { modelId: 123 });
      expect(mockNavigate).toHaveBeenCalledWith('Chat', { modelId: 123 });
    });

    it('should navigate to History with filter', () => {
      mockNavigate('History', { filter: 'image' });
      expect(mockNavigate).toHaveBeenCalledWith('History', { filter: 'image' });
    });
  });

  describe('Navigation Actions', () => {
    it('should go back', () => {
      mockGoBack();
      expect(mockGoBack).toHaveBeenCalled();
    });

    it('should reset navigation state', () => {
      mockReset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    });
  });
});
