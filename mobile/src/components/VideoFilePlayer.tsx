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
import { isDirectVideoUrl } from '../lib/eduService';
import { colors, fonts } from '../theme';

interface VideoFilePlayerProps {
  url: string;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

const escapeAttr = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Pemutar video berkas (MP4/WebM) hasil unggahan admin, memakai elemen <video> di dalam WebView. */
export function VideoFilePlayer({ url, title, style }: VideoFilePlayerProps) {
  const [loading, setLoading] = useState(true);
  const src = (url || '').trim();

  if (!isDirectVideoUrl(src)) return null;

  const videoSrc = src.includes('#') ? src : `${src}#t=0.001`;
  const html = `
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
            background: #07090e;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          video {
            width: 100%;
            height: 100%;
            background: #000;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <video src="${escapeAttr(videoSrc)}" controls playsinline webkit-playsinline preload="metadata"></video>
      </body>
    </html>
  `;

  return (
    <View style={[st.container, style]}>
      {title ? (
        <View style={st.headerRow}>
          <Ionicons name="play-circle-outline" size={16} color={colors.gold} />
          <Text style={st.videoTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
      ) : null}

      <View style={st.playerBox}>
        {Platform.OS === 'web' ? (
          // @ts-ignore Web video element
          <video src={src} controls playsInline preload="metadata" style={{ width: '100%', height: '100%', backgroundColor: '#000', objectFit: 'contain' }} />
        ) : (
          <>
            <WebView
              style={st.webview}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              originWhitelist={['*']}
              source={{ html, baseUrl: 'https://localhost' }}
              onLoadEnd={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
            {loading && (
              <View style={st.loaderOverlay} pointerEvents="none">
                <ActivityIndicator size="small" color={colors.gold} />
              </View>
            )}
          </>
        )}
      </View>

      <Pressable onPress={() => Linking.openURL(src).catch(() => {})} style={st.externalBtn} hitSlop={8}>
        <Text style={st.externalText}>Buka di Peramban</Text>
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
