import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NetworkService } from '../lib/networkService';
import { fonts } from '../theme';

const native = Platform.OS !== 'web';

export function NetworkBanner() {
  const insets = useSafeAreaInsets();
  const [showReconnected, setShowReconnected] = useState(false);
  const [visible, setVisible] = useState(false);

  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const reconnectedTimeoutRef = useRef<any>(null);

  useEffect(() => {
    let wasOffline = false;

    const unsubscribe = NetworkService.subscribe((online) => {
      if (!online) {
        wasOffline = true;
        setShowReconnected(false);
        if (reconnectedTimeoutRef.current) {
          clearTimeout(reconnectedTimeoutRef.current);
          reconnectedTimeoutRef.current = null;
        }
        setVisible(true);
      } else if (wasOffline) {
        // Baru saja kembali online setelah sebelumnya offline
        wasOffline = false;
        setShowReconnected(true);
        setVisible(true);

        if (reconnectedTimeoutRef.current) {
          clearTimeout(reconnectedTimeoutRef.current);
        }

        // Tampilkan peringatan singkat bahwa koneksi pulih, lalu sembunyikan bar
        reconnectedTimeoutRef.current = setTimeout(() => {
          setVisible(false);
          setShowReconnected(false);
        }, 2200);
      } else {
        setVisible(false);
      }
    });

    return () => {
      unsubscribe();
      if (reconnectedTimeoutRef.current) {
        clearTimeout(reconnectedTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: native,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: native,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: native,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: native,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  const handlePress = () => {
    NetworkService.checkConnectivity();
  };

  const topOffset = Math.max(insets.top, 10) + 8;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        st.wrap,
        {
          top: topOffset,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable onPress={handlePress} style={st.bar}>
        <Text style={st.text} numberOfLines={2}>
          {showReconnected
            ? 'Koneksi internet terhubung kembali'
            : 'Tidak ada jaringan. Mohon hidupkan data seluler atau Wi-Fi'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.7,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 16,
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.1,
    lineHeight: 17,
  },
});
