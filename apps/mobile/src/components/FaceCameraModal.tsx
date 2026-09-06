import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { tokenStore } from '../services/storage';
import { apiUrl } from '../services/api-client';
import { detectFaceFromBase64 } from '../lib/face-detector';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Ensure width is a multiple of 3 so height is an exact integer matching 4:3 ratio with zero distortion
const VIEWFINDER_WIDTH = Math.floor(Math.min(SCREEN_WIDTH * 0.76, 276) / 3) * 3;
const VIEWFINDER_HEIGHT = Math.round((VIEWFINDER_WIDTH * 4) / 3);

export interface FaceCameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (photoUrl: string) => void;
  title?: string;
  actionKind?: 'in' | 'out';
}

export function FaceCameraModal({
  visible,
  onClose,
  onCapture,
  title = 'Verifikasi Wajah',
  actionKind = 'in',
}: FaceCameraModalProps) {
  const { tokens } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);
  const [faceState, setFaceState] = useState<'idle' | 'detected' | 'not_detected'>('idle');
  const [faceErrorMsg, setFaceErrorMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isModalReady, setIsModalReady] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);

  // Synchronize camera initialization with stable modal layout to prevent aspect-ratio stretching ("gepeng")
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setIsModalReady(true), 120);
      return () => clearTimeout(timer);
    } else {
      setIsModalReady(false);
      setLayoutReady(false);
    }
  }, [visible]);

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (!result.granted) {
      setCameraError('Izin kamera ditolak. Mohon berikan akses kamera pada aplikasi.');
    }
  };

  // ── Single-Shot Fast Capture & Hybrid Face Verification (<1s) ───────────────
  // Flow: 1x Jepret (0.60) → Verifikasi Server V8 JIT (~150ms) / fallback lokal → Preview
  // Menghilangkan shutter ganda yang membuat kamera lag 3-5 detik.
  const handleSnap = async () => {
    if (isEvaluating || isUploading) return;
    setIsEvaluating(true);
    setFaceErrorMsg(null);
    setCameraError(null);
    setFaceState('idle');

    try {
      // ── Step 1: Ambil SATU foto presensi (kualitas optimal 0.50, jernih & sangat ringan) ──
      let snapUri: string | null = null;
      let snapB64: string | null = null;

      if (cameraRef.current) {
        try {
          const snap = await cameraRef.current.takePictureAsync({
            quality: 0.50, // Kualitas tajam, ukuran file ringan (~100-160KB), upload kilat
            base64: true,
            shutterSound: false,
          });
          if (snap?.uri && snap?.base64) {
            snapUri = snap.uri;
            snapB64 = snap.base64;
          }
        } catch (err: any) {
          console.warn('Camera takePictureAsync error, trying picker fallback:', err);
        }
      }

      // Fallback ImagePicker jika kamera hardware error
      if (!snapUri || !snapB64) {
        const result = await ImagePicker.launchCameraAsync({
          cameraType: ImagePicker.CameraType.front,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.60,
          base64: true,
        });
        if (!result.canceled && result.assets?.[0]) {
          snapUri = result.assets[0].uri;
          snapB64 = result.assets[0].base64 ?? null;
        }
      }

      if (!snapUri || !snapB64) {
        setIsEvaluating(false);
        return;
      }

      // ── Step 2: Validasi wajah instan via server (/api/uploads/verify-face) ──
      // Server Node.js (V8 JIT) memproses hanya dalam ~20ms, tanpa membekukan UI HP
      let isValidFace = false;
      let rejectionReason: string | null = null;

      try {
        const token = tokenStore.getAccessToken();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

        const response = await fetch(`${apiUrl}/api/uploads/verify-face`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            imageBase64: snapB64,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const resJson = await response.json();
          isValidFace = !!resJson?.success || !!resJson?.data?.hasFace;
          if (!isValidFace) {
            rejectionReason =
              resJson?.message || resJson?.data?.reason || 'Wajah tidak terdeteksi pada foto presensi.';
          }
        } else {
          // Fallback lokal jika server merespons non-200
          const localCheck = detectFaceFromBase64(snapB64);
          isValidFace = localCheck.hasFace;
          rejectionReason = localCheck.reason ?? null;
        }
      } catch {
        // Fallback lokal jika offline atau network timeout
        const localCheck = detectFaceFromBase64(snapB64);
        isValidFace = localCheck.hasFace;
        rejectionReason = localCheck.reason ?? null;
      }

      // ── Step 3: Evaluasi hasil validasi wajah ──
      if (!isValidFace) {
        setFaceState('not_detected');
        setFaceErrorMsg(
          rejectionReason || 'Wajah tidak terdeteksi. Posisikan wajah Anda tepat di dalam lingkaran panduan.',
        );
        setTimeout(() => {
          setFaceState((s) => (s === 'not_detected' ? 'idle' : s));
          setFaceErrorMsg(null);
        }, 3500);
        setIsEvaluating(false);
        return; // Gagal → jangan tampilkan preview, biarkan kamera aktif untuk ambil ulang
      }

      // ── Step 4: Validasi SUKSES → Tampilkan preview foto seketika ──
      setCapturedPhoto(snapUri);
      setCapturedBase64(snapB64);
      setFaceState('detected');
      setIsMirrored(false);
    } catch (err: any) {
      setCameraError('Gagal memproses foto: ' + (err.message || 'Error tidak diketahui'));
    } finally {
      setIsEvaluating(false);
    }
  };


  const startAutoCaptureCountdown = () => {
    if (isEvaluating || isUploading) return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleSnap();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setCapturedBase64(null);
    setCountdown(null);
    setCameraError(null);
    setFaceState('idle');
    setFaceErrorMsg(null);
    setIsEvaluating(false);
    setIsMirrored(false);
  };

  const handleConfirmAndUpload = async () => {
    if (!capturedPhoto || !capturedBase64) return;
    setIsUploading(true);

    try {
      // Langsung unggah foto presensi yang telah diverifikasi wajahnya tanpa pop-up biometrik ganda
      const token = tokenStore.getAccessToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const response = await fetch(`${apiUrl}/api/uploads/base64`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          imageBase64: capturedBase64,
          category: 'attendance',
          flipHorizontal: !isMirrored, // Menyesuaikan preferensi mirror / non-mirror
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const resData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(resData?.message || 'Gagal mengunggah foto presensi ke server.');
      }

      const photoUrl = resData?.data?.url;
      if (!photoUrl) {
        throw new Error('URL foto presensi tidak diterima dari server.');
      }

      onCapture(photoUrl);
      onClose();
    } catch (err: any) {
      let message = err.message || 'Terjadi kesalahan sistem.';
      if (err.name === 'AbortError') {
        message = 'Waktu unggah foto habis. Pastikan koneksi WiFi/jaringan stabil.';
      } else if (message.includes('Connection reset') || message.includes('fetch failed')) {
        message = 'Gagal terhubung ke server backend. Pastikan server aktif dan HP terhubung ke jaringan yang sama.';
      }
      Alert.alert('Gagal Presensi', message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onShow={() => setIsModalReady(true)}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="rgba(0,0,0,0.6)" />
      
      {/* Backdrop */}
      <View style={styles.backdrop}>
        {/* Modal Card (Matching Web Structure) */}
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.userIconBox}>
                <Ionicons name="person-outline" size={16} color="#d4d4d8" />
              </View>
              <View>
                <Text style={styles.modalTitle}>{title}</Text>
                <Text style={styles.modalSubtitle}>
                  {actionKind === 'in' ? 'Presensi Masuk' : 'Presensi Keluar'}
                </Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              {!capturedPhoto ? (
                <TouchableOpacity
                  style={styles.switchCameraBtn}
                  onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
                  disabled={countdown !== null || isEvaluating}
                >
                  <Ionicons name="camera-reverse-outline" size={18} color="#a1a1aa" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.flipPreviewBtn}
                  onPress={() => setIsMirrored((prev) => !prev)}
                >
                  <Ionicons name="swap-horizontal" size={16} color="#34d399" style={{ marginRight: 4 }} />
                  <Text style={styles.flipPreviewText}>{isMirrored ? 'Cermin' : 'Asli'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                disabled={isUploading || isEvaluating}
              >
                <Ionicons name="close" size={18} color="#a1a1aa" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Viewfinder Content */}
          <View style={styles.cardBody}>
            {cameraError ? (
              <View style={styles.errorBox}>
                <Ionicons name="camera-outline" size={40} color="#71717a" />
                <Text style={styles.errorBoxText}>{cameraError}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={handleRetake}>
                  <Ionicons name="refresh" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.retryBtnText}>Coba Lagi</Text>
                </TouchableOpacity>
              </View>
            ) : !permission?.granted ? (
              <View style={styles.permissionBox}>
                <Ionicons name="camera-outline" size={44} color="#71717a" />
                <Text style={styles.permissionTitle}>Akses Kamera Diperlukan</Text>
                <Text style={styles.permissionDesc}>
                  Mohon izinkan akses kamera untuk verifikasi wajah presensi Anda.
                </Text>
                <TouchableOpacity
                  style={[styles.allowBtn, { backgroundColor: tokens.colors.primary }]}
                  onPress={handleRequestPermission}
                >
                  <Text style={styles.allowBtnText}>Izinkan Kamera</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.viewfinderWrapper}>
                {/* 3:4 Viewfinder Box (Matching natural front camera sensor) */}
                <View style={styles.viewfinder} onLayout={() => setLayoutReady(true)}>
                  {!capturedPhoto ? (
                    <>
                      {isModalReady && layoutReady ? (
                        <CameraView
                          key={`camera-${facing}`}
                          ref={cameraRef}
                          style={StyleSheet.absoluteFill}
                          facing={facing}
                          ratio="4:3"
                          mirror={false}
                        />
                      ) : (
                        <View style={[StyleSheet.absoluteFill, styles.cameraLoadingContainer]}>
                          <ActivityIndicator size="small" color="#38bdf8" />
                          <Text style={styles.cameraLoadingText}>Menyiapkan kamera...</Text>
                        </View>
                      )}

                      {/* Face Guide Oval */}
                      <View style={styles.ovalCenterContainer} pointerEvents="none">
                        <View
                          style={[
                            styles.guideOval,
                            faceState === 'not_detected'
                              ? styles.guideOvalNotDetected
                              : styles.guideOvalNormal,
                          ]}
                        >
                          {countdown !== null && (
                            <View style={styles.countdownBadge}>
                              <Text style={styles.countdownText}>{countdown}</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View style={styles.badgeContainer} pointerEvents="none">
                        {isEvaluating ? (
                          <View style={styles.badgeEvaluating}>
                            <ActivityIndicator size="small" color="#38bdf8" />
                            <Text style={styles.badgeEvaluatingText}>Memvalidasi Wajah...</Text>
                          </View>
                        ) : faceState === 'not_detected' ? (
                          <View style={styles.badgeNotDetected}>
                            <Ionicons name="alert-circle" size={13} color="#f87171" />
                            <Text style={styles.badgeNotDetectedText}>Wajah Tidak Terdeteksi</Text>
                          </View>
                        ) : (
                          <View style={styles.badgeNormal}>
                            <Ionicons name="scan-outline" size={12} color="#34d399" />
                            <Text style={styles.badgeNormalText}>Posisikan Wajah di Oval</Text>
                          </View>
                        )}
                      </View>
                    </>
                  ) : (
                    <View style={StyleSheet.absoluteFill}>
                      {/* Non-mirror flipped image preview (True realistic perspective) */}
                      <Image
                        source={{ uri: capturedPhoto }}
                        style={[
                          StyleSheet.absoluteFill,
                          !isMirrored && { transform: [{ scaleX: -1 }] },
                        ]}
                        resizeMode="cover"
                      />
                      <View style={styles.ovalCenterContainer} pointerEvents="none">
                        <View style={[styles.guideOval, styles.guideOvalDetected]} />
                      </View>
                      <View style={styles.badgeContainer}>
                        <View style={styles.badgeReady}>
                          <Ionicons name="checkmark-circle" size={13} color="#34d399" />
                          <Text style={styles.badgeReadyText}>Foto Siap Digunakan</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>

                {/* Guidance text + error message */}
                <Text style={[
                  styles.guidanceText,
                  faceState === 'not_detected' && { color: '#fca5a5' },
                ]}>
                  {!capturedPhoto
                    ? faceState === 'not_detected' && faceErrorMsg
                      ? faceErrorMsg
                      : faceState === 'not_detected'
                      ? 'Wajah tidak terdeteksi. Posisikan wajah Anda tepat di dalam lingkaran'
                      : 'Arahkan wajah Anda tepat ke dalam lingkaran panduan'
                    : !isMirrored
                    ? 'Arah asli non-mirror (tekan tombol di kanan atas untuk ganti)'
                    : 'Arah cermin mirror (tekan tombol di kanan atas untuk ganti)'}
                </Text>
              </View>
            )}
          </View>

          {/* Footer Actions (Matching Web Button Layout) */}
          <View style={styles.cardFooter}>
            {!capturedPhoto ? (
              <View style={styles.footerRow}>
                {/* Timer 3s Button */}
                <TouchableOpacity
                  style={[
                    styles.btnOutline,
                    (isEvaluating || countdown !== null) && styles.btnDisabled,
                  ]}
                  onPress={startAutoCaptureCountdown}
                  disabled={isEvaluating || countdown !== null}
                >
                  <Ionicons name="timer-outline" size={15} color="#d4d4d8" style={{ marginRight: 5 }} />
                  <Text style={styles.btnOutlineText}>Timer 3s</Text>
                </TouchableOpacity>

                {/* Ambil Foto Button */}
                <TouchableOpacity
                  style={[
                    styles.btnCapture,
                    isEvaluating ? styles.btnCaptureDisabled : styles.btnCaptureActive,
                  ]}
                  onPress={handleSnap}
                  disabled={isEvaluating}
                >
                  {isEvaluating ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.btnCaptureText}>Memindai...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="camera" size={15} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.btnCaptureText}>Ambil Foto</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.footerRow}>
                {/* Ulangi Button */}
                <TouchableOpacity
                  style={styles.btnOutline}
                  onPress={handleRetake}
                  disabled={isUploading}
                >
                  <Ionicons name="refresh" size={14} color="#d4d4d8" style={{ marginRight: 5 }} />
                  <Text style={styles.btnOutlineText}>Ulangi</Text>
                </TouchableOpacity>

                {/* Gunakan Foto Button */}
                <TouchableOpacity
                  style={[styles.btnSubmit, { backgroundColor: '#059669' }]}
                  onPress={handleConfirmAndUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.btnSubmitText}>Memproses…</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.btnSubmitText}>Gunakan Foto</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#18181b', // dark:bg-zinc-900
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a', // dark:border-zinc-800
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#f4f4f5',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 16,
  },
  modalSubtitle: {
    color: '#a1a1aa',
    fontSize: 11.5,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchCameraBtn: {
    padding: 6,
    borderRadius: 8,
  },
  flipPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 78, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  flipPreviewText: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  cardBody: {
    padding: 18,
    alignItems: 'center',
  },
  viewfinderWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  viewfinder: {
    width: VIEWFINDER_WIDTH,
    height: VIEWFINDER_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    position: 'relative',
  },
  cameraLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b',
    gap: 10,
  },
  cameraLoadingText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '500',
  },
  ovalCenterContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideOval: {
    width: '74%',
    height: '68%',
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideOvalNormal: {
    borderWidth: 2,
    borderColor: 'rgba(52, 211, 153, 0.75)',
    shadowColor: '#10b981',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  guideOvalDetected: {
    borderWidth: 2.5,
    borderColor: '#34d399',
    shadowColor: '#10b981',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
  },
  guideOvalNotDetected: {
    borderWidth: 1.5,
    borderColor: '#f87171',
    borderStyle: 'dashed',
  },
  guideOvalScanning: {
    // Ungu abu-abu: belum ada wajah, polling aktif berjalan
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.55)',
    borderStyle: 'dashed',
  },
  countdownBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  badgeNormal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
  },
  badgeNormalText: {
    color: '#c4b5fd',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeDetected: {
    // Hijau: wajah terdeteksi, siap ambil foto
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(6, 78, 59, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.55)',
  },
  badgeDetectedText: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeScanning: {
    // Ungu: sedang polling / mendeteksi
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(46, 16, 101, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.45)',
  },
  badgeScanningText: {
    color: '#c4b5fd',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeEvaluating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
  badgeEvaluatingText: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeNotDetected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(127, 29, 29, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  badgeNotDetectedText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeReady: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(6, 78, 59, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  badgeReadyText: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: '600',
  },
  guidanceText: {
    color: '#a1a1aa',
    fontSize: 11.5,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    backgroundColor: 'rgba(24, 24, 27, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  btnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3f3f46',
    backgroundColor: '#27272a',
  },
  btnOutlineText: {
    color: '#f4f4f5',
    fontSize: 12.5,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnCapture: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
  },
  btnCaptureActive: {
    backgroundColor: '#059669', // bg-emerald-600
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  btnCaptureDisabled: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    opacity: 0.6,
  },
  btnCaptureText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '600',
  },
  btnSubmit: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
  },
  btnSubmitText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '600',
  },
  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 10,
  },
  errorBoxText: {
    color: '#f87171',
    fontSize: 12,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  retryBtnText: {
    color: '#f4f4f5',
    fontSize: 12,
    fontWeight: '600',
  },
  permissionBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  permissionTitle: {
    color: '#f4f4f5',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  permissionDesc: {
    color: '#a1a1aa',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  allowBtn: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  allowBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
