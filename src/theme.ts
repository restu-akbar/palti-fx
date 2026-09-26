import { Platform } from 'react-native';

export const colors = {
  bg: '#060608',
  surface: '#0F0F13',
  card: '#141419',
  cardHi: '#1B1B22',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  borderGold: 'rgba(227,182,79,0.35)',
  gold: '#E3B64F',
  goldLight: '#F7DC8E',
  goldDark: '#A67C1E',
  ink: '#16110A', // teks di atas emas
  text: '#F5F2EA',
  textDim: '#B4AFA4',
  muted: '#7A766E',
  green: '#35C98A',
  red: '#F0625C',
  blue: '#6AA8FF',
  overlay: 'rgba(0,0,0,0.72)',
};

export const goldGradient = ['#F7DC8E', '#E3B64F', '#B8892A'] as const;
export const heroGradient = ['#F3D17C', '#D9A640', '#9E7118'] as const;
export const cardGradient = ['#17171D', '#111115'] as const;

export const fonts = {
  display: 'PlusJakartaSans_800ExtraBold',
  displaySemi: 'PlusJakartaSans_700Bold',
  body: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semi: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

export const radius = { sm: 12, md: 16, lg: 22, xl: 28 };

export const isWeb = Platform.OS === 'web';
