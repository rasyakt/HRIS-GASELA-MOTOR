import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiUrl } from '../services/api-client';
import { useTheme } from '../theme/ThemeProvider';

export interface PhotoModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  photoUrl: string | null;
}

export function PhotoModal({
  visible,
  onClose,
  title,
  photoUrl,
}: PhotoModalProps) {
  const { tokens } = useTheme();
  const [loading, setLoading] = React.useState(true);

  if (!photoUrl) return null;

  const fullUrl = photoUrl.startsWith('http')
    ? photoUrl
    : `${apiUrl}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: tokens.colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: tokens.colors.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="camera-outline" size={18} color={tokens.colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.title, { color: tokens.colors.textPrimary }]} numberOfLines={1}>
                {title}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={tokens.colors.textSecondary} />
            </Pressable>
          </View>

          {/* Photo Container */}
          <View style={styles.imageWrapper}>
            {loading && (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={tokens.colors.primary} />
              </View>
            )}
            <Image
              source={{ uri: fullUrl }}
              style={styles.image}
              resizeMode="cover"
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
