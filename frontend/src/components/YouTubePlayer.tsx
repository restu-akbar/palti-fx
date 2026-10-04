import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { extractYouTubeId } from '../lib/eduService';
import { colors, fonts } from '../theme';

interface YouTubePlayerProps {
  url: string;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

export function YouTubePlayer({ url, title, style }: YouTubePlayerProps) {
  const videoId = extractYouTubeId(url);
  const [loading, setLoading] = useState(true);

  if (!videoId) return null;

  const openInYouTube = () => {
    Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`).catch(() => {});
  };

  const isWeb = Platform.OS === 'web';

  const embedHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <style>
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #07090e;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: 0;
          }
        </style>
      </head>
      <body>
        <iframe
          src="https://www.youtube.com/embed/${videoId}?playsinline=1&modestbranding=1&rel=0&autoplay=0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </body>
    </html>
  `;

  return (
    <View style={[st.container, style]}>
      {title ? (
        <View style={st.headerRow}>
          <Ionicons name="logo-youtube" size={16} color={colors.red} />
          <Text style={st.videoTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
      ) : null}

      <View style={st.playerBox}>
        {isWeb ? (
          // @ts-ignore Web iframe embed
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?playsinline=1&modestbranding=1&rel=0`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: 14,
              backgroundColor: '#07090e',
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <WebView
              style={st.webview}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
              originWhitelist={['*']}
              source={{ html: embedHtml }}
              onLoadEnd={() => setLoading(false)}
            />
            {loading && (
              <View style={st.loaderOverlay} pointerEvents="none">
                <ActivityIndicator size="small" color={colors.gold} />
              </View>
            )}
          </>
        )}
      </View>

      <Pressable onPress={openInYouTube} style={st.externalBtn} hitSlop={8}>
        <Text style={st.externalText}>Buka di Aplikasi YouTube</Text>
        <Ionicons name="open-outline" size={13} color={colors.gold} />
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  videoTitle: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.semi,
    fontSize: 13,
  },
  playerBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#07090E',
  },
  webview: {
    flex: 1,
    backgroundColor: '#07090e',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#07090e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  externalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 8,
    paddingRight: 4,
  },
  externalText: {
    color: colors.gold,
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
});
