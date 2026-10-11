import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme';
import { tap } from './motion';

export function extractYtId(url: string): string | null {
  if (!url) return null;
  const match = url.trim().match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
  );
  return match && match[1] ? match[1] : null;
}

/* =====================================================================
   1. MODAL OPSI PEMUTAR YOUTUBE (Nonton di Aplikasi vs Buka di YouTube)
   ===================================================================== */
export function YouTubeOptionModal({
  visible,
  videoUrl,
  onClose,
  onPlayInApp,
}: {
  visible: boolean;
  videoUrl: string;
  onClose: () => void;
  onPlayInApp: () => void;
}) {
  const insets = useSafeAreaInsets();
  const ytid = extractYtId(videoUrl);
  const thumbUrl = ytid ? `https://img.youtube.com/vi/${ytid}/hqdefault.jpg` : null;

  const handleOpenExternal = () => {
    tap('light');
    onClose();
    const targetUrl = videoUrl.startsWith('http') ? videoUrl : `https://${videoUrl}`;
    Linking.openURL(targetUrl);
  };

  const handlePlayInApp = () => {
    tap('success');
    onClose();
    onPlayInApp();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={st.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[st.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          {/* Header Strip */}
          <View style={st.sheetBar} />

          {/* Judul & Thumbnail */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,0,0,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Ionicons name="logo-youtube" size={20} color="#FF4D4D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.sheetTitle}>Pilihan Pemutar Video</Text>
              <Text style={st.sheetSub}>Pilih cara menonton video materi edukasi</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={st.closeIconBtn} hitSlop={10}>
              <Ionicons name="close" size={20} color={colors.textDim} />
            </TouchableOpacity>
          </View>

          {/* Mini Preview Card */}
          {thumbUrl ? (
            <View style={st.miniThumbCard}>
              <Image source={{ uri: thumbUrl }} style={{ width: '100%', height: 110 }} resizeMode="cover" />
              <View style={st.miniThumbBadge}>
                <Ionicons name="play" size={12} color="#16110A" />
                <Text style={st.miniThumbBadgeText}>YouTube Video</Text>
              </View>
            </View>
          ) : null}

          {/* Opsi 1: Tonton di Aplikasi */}
          <TouchableOpacity activeOpacity={0.85} onPress={handlePlayInApp} style={st.optionCard}>
            <View style={[st.optionIconWrap, { backgroundColor: 'rgba(227,182,79,0.16)', borderColor: 'rgba(227,182,79,0.3)' }]}>
              <Ionicons name="tv-outline" size={22} color={colors.gold} />
            </View>
            <View style={{ flex: 1, marginRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={st.optionTitle}>Nonton di Aplikasi</Text>
                <View style={st.goldPill}>
                  <Text style={st.goldPillText}>Preview Cepat</Text>
                </View>
              </View>
              <Text style={st.optionDesc}>Putar langsung tanpa keluar dari aplikasi PALTI FX</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.gold} />
          </TouchableOpacity>

          {/* Opsi 2: Buka di Aplikasi YouTube */}
          <TouchableOpacity activeOpacity={0.85} onPress={handleOpenExternal} style={st.optionCard}>
            <View style={[st.optionIconWrap, { backgroundColor: 'rgba(255, 68, 68, 0.14)', borderColor: 'rgba(255, 68, 68, 0.28)' }]}>
              <Ionicons name="logo-youtube" size={22} color="#FF4D4D" />
            </View>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={st.optionTitle}>Buka di YouTube</Text>
              <Text style={st.optionDesc}>Buka langsung di aplikasi resmi YouTube atau browser</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textDim} />
          </TouchableOpacity>

          {/* Tombol Batal */}
          <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={st.cancelBtn}>
            <Text style={st.cancelBtnText}>Batal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* =====================================================================
   2. MODAL PEMUTAR YOUTUBE IN-APP (Embedded Player)
   ===================================================================== */
export function YouTubePlayerModal({
  visible,
  videoUrl,
  onClose,
}: {
  visible: boolean;
  videoUrl: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const ytid = extractYtId(videoUrl);

  const handleOpenExternal = () => {
    tap('light');
    const targetUrl = videoUrl.startsWith('http') ? videoUrl : `https://${videoUrl}`;
    Linking.openURL(targetUrl);
  };

  if (!visible || !ytid) return null;

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={[st.playerContainer, { paddingTop: Math.max(insets.top, 14) }]}>
        {/* Top Navbar */}
        <View style={st.playerHeader}>
          <TouchableOpacity onPress={onClose} style={st.backCircleBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={st.playerHeaderTitle} numberOfLines={1}>
              Pemutar Video Pembelajaran
            </Text>
            <Text style={st.playerHeaderSub}>PALTI FX Educational Hub</Text>
          </View>
          <TouchableOpacity onPress={handleOpenExternal} style={st.ytExternalBtn} activeOpacity={0.8}>
            <Ionicons name="logo-youtube" size={16} color="#FF4D4D" />
            <Text style={st.ytExternalBtnText}>Buka YT</Text>
          </TouchableOpacity>
        </View>

        {/* Video Box (16:9 Aspect Ratio) */}
        <View style={st.videoWrapper}>
          {Platform.OS === 'web' ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytid}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#000' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            // Native Android / iOS WebView Player
            <NativeWebViewPlayer ytid={ytid} />
          )}
        </View>

        {/* Info & Action Section */}
        <View style={{ padding: 18, gap: 14 }}>
          <View style={st.infoBox}>
            <Ionicons name="bulb-outline" size={20} color={colors.gold} style={{ marginTop: 2, marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 13, fontFamily: fonts.semi, marginBottom: 2 }}>
                Kiat Menonton
              </Text>
              <Text style={{ color: colors.textDim, fontSize: 12, lineHeight: 18, fontFamily: fonts.body }}>
                Putar smartphone ke posisi horizontal (landscape) jika ingin melihat chart dan detail candlestick dalam ukuran layar penuh.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleOpenExternal}
            style={st.openYtBigBtn}
          >
            <Ionicons name="logo-youtube" size={20} color="#FF4D4D" style={{ marginRight: 8 }} />
            <Text style={st.openYtBigBtnText}>Buka di Aplikasi YouTube Resmi</Text>
            <Ionicons name="open-outline" size={16} color={colors.textDim} style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={st.closePlayerBtn}
          >
            <Text style={st.closePlayerBtnText}>Kembali ke Materi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function NativeWebViewPlayer({ ytid }: { ytid: string }) {
  try {
    const { WebView } = require('react-native-webview');
    return (
      <WebView
        source={{
          uri: `https://www.youtube.com/embed/${ytid}?autoplay=1&playsinline=1&modestbranding=1`,
        }}
        allowsFullscreenVideo={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        style={{ flex: 1, backgroundColor: '#000' }}
      />
    );
  } catch {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 }}>
        <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 12 }}>
          WebView native tidak tersedia. Silakan buka langsung di aplikasi YouTube.
        </Text>
      </View>
    );
  }
}

/* =====================================================================
   3. MODAL ZOOM FOTO / GAMBAR (Pinch to Zoom, Pan, Zoom In/Out Buttons)
   ===================================================================== */
export function ImageZoomModal({
  visible,
  imageUri,
  caption,
  onClose,
}: {
  visible: boolean;
  imageUri: string;
  caption?: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const scaleRef = useRef(1);
  scaleRef.current = scale;
  const panRef = useRef({ x: 0, y: 0 });
  panRef.current = pan;

  const initialDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);
  const lastTapRef = useRef<number>(0);
  const startTouchRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset scale saat modal dibuka atau gambar berganti
  useEffect(() => {
    if (visible) {
      setScale(1);
      setPan({ x: 0, y: 0 });
    }
  }, [visible, imageUri]);

  const zoomIn = () => {
    tap('light');
    setScale((prev) => Math.min(Number((prev + 0.5).toFixed(1)), 4.0));
  };

  const zoomOut = () => {
    tap('light');
    setScale((prev) => {
      const next = Math.max(Number((prev - 0.5).toFixed(1)), 1.0);
      if (next === 1.0) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const resetZoom = () => {
    tap('select');
    setScale(1.0);
    setPan({ x: 0, y: 0 });
  };

  // PanResponder untuk Pinch-to-Zoom dan Pan saat di-zoom
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          initialDistanceRef.current = Math.hypot(dx, dy);
          initialScaleRef.current = scaleRef.current;
        } else if (touches.length === 1) {
          startTouchRef.current = {
            x: touches[0].pageX - panRef.current.x,
            y: touches[0].pageY - panRef.current.y,
          };
          // Cek Double Tap
          const now = Date.now();
          if (now - lastTapRef.current < 300) {
            tap('select');
            if (scaleRef.current > 1.2) {
              setScale(1.0);
              setPan({ x: 0, y: 0 });
            } else {
              setScale(2.2);
            }
          }
          lastTapRef.current = now;
        }
      },
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2 && initialDistanceRef.current) {
          // Pinch to Zoom
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const currentDistance = Math.hypot(dx, dy);
          const factor = currentDistance / initialDistanceRef.current;
          const newScale = Math.min(Math.max(initialScaleRef.current * factor, 1.0), 4.0);
          setScale(Number(newScale.toFixed(2)));
        } else if (touches.length === 1 && scaleRef.current > 1.05) {
          // Pan gambar ketika sedang di-zoom
          const newX = touches[0].pageX - startTouchRef.current.x;
          const newY = touches[0].pageY - startTouchRef.current.y;
          // Batasi jangkauan pan berdasarkan level zoom
          const maxPan = (scaleRef.current - 1) * 180;
          setPan({
            x: Math.min(Math.max(newX, -maxPan), maxPan),
            y: Math.min(Math.max(newY, -maxPan), maxPan),
          });
        }
      },
      onPanResponderRelease: () => {
        initialDistanceRef.current = null;
        if (scaleRef.current <= 1.05) {
          setPan({ x: 0, y: 0 });
        }
      },
    }),
  ).current;

  if (!visible || !imageUri) return null;

  const pct = Math.round(scale * 100);

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={st.imageViewerBg}>
        {/* Top Header */}
        <View style={[st.imageViewerHeader, { paddingTop: Math.max(insets.top, 14) }]}>
          <TouchableOpacity onPress={onClose} style={st.backCircleBtn}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={st.imageViewerTitle} numberOfLines={1}>
              {caption ? caption : 'Pratinjau Foto Materi'}
            </Text>
            <Text style={st.imageViewerSub}>PALTI FX Interactive Viewer</Text>
          </View>
          <View style={st.zoomBadge}>
            <Text style={st.zoomBadgeText}>{pct}%</Text>
          </View>
        </View>

        {/* Image Canvas Container */}
        <View style={st.imageCanvas} {...panResponder.panHandlers}>
          <Image
            source={{ uri: imageUri }}
            style={{
              width: Dimensions.get('window').width,
              height: Dimensions.get('window').height * 0.7,
              transform: [{ scale }, { translateX: pan.x / scale }, { translateY: pan.y / scale }],
            }}
            resizeMode="contain"
          />
        </View>

        {/* Caption jika ada */}
        {caption ? (
          <View style={st.captionBottom}>
            <Text style={st.captionBottomText}>📸 {caption}</Text>
          </View>
        ) : null}

        {/* Bottom Floating Zoom Controls */}
        <View style={[st.zoomControlBar, { paddingBottom: Math.max(insets.bottom, 14) + 6 }]}>
          <View style={st.zoomControlPill}>
            {/* Zoom Out Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={zoomOut}
              disabled={scale <= 1.0}
              style={[st.zoomBtn, scale <= 1.0 && { opacity: 0.4 }]}
            >
              <Ionicons name="remove" size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={st.zoomDivider} />

            {/* Reset Zoom Button */}
            <TouchableOpacity activeOpacity={0.7} onPress={resetZoom} style={st.zoomResetBtn}>
              <Ionicons name="scan-outline" size={16} color={colors.gold} style={{ marginRight: 4 }} />
              <Text style={st.zoomResetText}>{pct}%</Text>
            </TouchableOpacity>

            <View style={st.zoomDivider} />

            {/* Zoom In Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={zoomIn}
              disabled={scale >= 4.0}
              style={[st.zoomBtn, scale >= 4.0 && { opacity: 0.4 }]}
            >
              <Ionicons name="add" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={st.zoomHintText}>Cubit layar (pinch) atau ketuk dua kali untuk zoom</Text>
        </View>
      </View>
    </Modal>
  );
}

/* =====================================================================
   STYLES
   ===================================================================== */
const st = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F1118',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetBar: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  sheetSub: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniThumbCard: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
    position: 'relative',
  },
  miniThumbBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniThumbBadgeText: {
    color: '#16110A',
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.semi,
  },
  optionDesc: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 2,
  },
  goldPill: {
    backgroundColor: 'rgba(227,182,79,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  goldPillText: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  cancelBtn: {
    marginTop: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  cancelBtnText: {
    color: colors.textDim,
    fontSize: 14,
    fontFamily: fonts.semi,
  },

  /* Player styles */
  playerContainer: {
    flex: 1,
    backgroundColor: '#05070B',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerHeaderTitle: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  playerHeaderSub: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  ytExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,77,77,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  ytExternalBtnText: {
    color: '#FF7070',
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(227,182,79,0.2)',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(227,182,79,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(227,182,79,0.2)',
    borderRadius: 14,
    padding: 14,
  },
  openYtBigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 14,
  },
  openYtBigBtnText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.semi,
  },
  closePlayerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  closePlayerBtnText: {
    color: colors.muted,
    fontSize: 14,
    fontFamily: fonts.medium,
  },

  /* Image Viewer styles */
  imageViewerBg: {
    flex: 1,
    backgroundColor: '#05070B',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    zIndex: 10,
  },
  imageViewerTitle: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  imageViewerSub: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  zoomBadge: {
    backgroundColor: 'rgba(227,182,79,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(227,182,79,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  zoomBadgeText: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  imageCanvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  captionBottom: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
  },
  captionBottomText: {
    color: colors.textDim,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  zoomControlBar: {
    alignItems: 'center',
    paddingTop: 8,
  },
  zoomControlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginBottom: 6,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  zoomResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
  },
  zoomResetText: {
    color: colors.gold,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  zoomHintText: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
});
