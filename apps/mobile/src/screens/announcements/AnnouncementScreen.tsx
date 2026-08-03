import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AnnouncementDto, AnnouncementListDto, UnreadCountDto } from '@gasela/shared-types';
import { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card, CardTitle, ErrorBanner } from '../../components/ui';
import { fmtDate, fmtDateTime } from '../../lib/format';
import { useAuthApi } from '../../services/auth-api';

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low:    { label: 'Rendah',  color: '#71717a' },
  normal: { label: 'Normal',  color: '#0284c7' },
  high:   { label: 'Penting', color: '#d97706' },
  urgent: { label: 'Mendesak',color: '#dc2626' },
};

function PriorityBadge({ priority }: { priority: string }) {
  const { label, color } = PRIORITY_MAP[priority] ?? { label: priority, color: '#71717a' };
  return (
    <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function AnnouncementScreen() {
  const authApi = useAuthApi();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<AnnouncementDto | null>(null);

  const list = useQuery({
    queryKey: ['announcements-my'],
    queryFn: () =>
      authApi<AnnouncementListDto>('/api/announcements/my?page=1&limit=30'),
  });

  const unread = useQuery({
    queryKey: ['announcements-unread'],
    queryFn: () => authApi<UnreadCountDto>('/api/announcements/unread-count'),
  });

  useFocusEffect(
    useCallback(() => {
      list.refetch();
      unread.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const markRead = useMutation({
    mutationFn: (announcementId: number) =>
      authApi('/api/announcements/read', {
        method: 'POST',
        body: JSON.stringify({ announcementId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements-my'] });
      queryClient.invalidateQueries({ queryKey: ['announcements-unread'] });
    },
  });

  function openDetail(item: AnnouncementDto) {
    setSelected(item);
    if (!item.isRead) {
      markRead.mutate(item.id);
    }
  }

  const items = list.data?.items ?? [];
  const unreadCount = unread.data?.count ?? 0;

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={list.isLoading}
            onRefresh={() => {
              list.refetch();
              unread.refetch();
            }}
            tintColor="#18181b"
          />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.header}>Pengumuman</Text>
            <Text style={styles.subheader}>
              {unreadCount > 0
                ? `${unreadCount} belum dibaca`
                : 'Semua sudah dibaca'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {list.isError && (
          <ErrorBanner message="Gagal memuat pengumuman. Tarik untuk muat ulang." />
        )}

        {items.length === 0 && !list.isLoading && !list.isError && (
          <Card>
            <Text style={styles.emptyText}>Tidak ada pengumuman untuk Anda saat ini.</Text>
          </Card>
        )}

        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => openDetail(item)}
            style={({ pressed }) => [
              styles.card,
              !item.isRead && styles.cardUnread,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.cardTop}>
              <PriorityBadge priority={item.priority} />
              <Text style={styles.dateText}>{fmtDate(item.publishDate)}</Text>
            </View>

            <View style={styles.titleRow}>
              {!item.isRead && <View style={styles.unreadDot} />}
              <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]} numberOfLines={2}>
                {item.title}
              </Text>
            </View>

            <Text style={styles.cardPreview} numberOfLines={2}>
              {item.content}
            </Text>

            {item.createdByName && (
              <Text style={styles.authorText}>Oleh: {item.createdByName}</Text>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={selected !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            {selected && (
              <>
                <View style={styles.modalHeader}>
                  <PriorityBadge priority={selected.priority} />
                  <Pressable onPress={() => setSelected(null)} hitSlop={10}>
                    <Text style={styles.closeBtn}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>{selected.title}</Text>

                  <View style={styles.modalMeta}>
                    <Text style={styles.modalMetaText}>
                      {fmtDateTime(selected.publishDate)}
                    </Text>
                    {selected.createdByName && (
                      <Text style={styles.modalMetaText}>
                        · {selected.createdByName}
                      </Text>
                    )}
                    {selected.expiryDate && (
                      <Text style={styles.modalMetaText}>
                        · Berakhir: {fmtDate(selected.expiryDate)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.modalContent}>{selected.content}</Text>

                  <View style={styles.closeRow}>
                    <Button
                      title="Tutup"
                      variant="outline"
                      onPress={() => setSelected(null)}
                    />
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fafafa' },
  container: { padding: 16, paddingBottom: 32 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  header: { fontSize: 20, fontWeight: '700', color: '#18181b' },
  subheader: { fontSize: 13, color: '#71717a', marginTop: 2 },
  unreadBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 999,
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: { color: '#fff', fontSize: 13, fontWeight: '700' },

  emptyText: {
    color: '#71717a',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },

  // Announcement card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    padding: 14,
    marginBottom: 10,
  },
  cardUnread: {
    borderColor: '#0284c7',
    borderWidth: 1.5,
  },
  cardPressed: { opacity: 0.85, backgroundColor: '#f4f4f5' },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284c7',
    marginTop: 5,
    flexShrink: 0,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#3f3f46', flex: 1 },
  cardTitleUnread: { color: '#18181b', fontWeight: '700' },
  cardPreview: { fontSize: 13, color: '#71717a', lineHeight: 19 },
  dateText: { fontSize: 12, color: '#a1a1aa' },
  authorText: { fontSize: 12, color: '#a1a1aa', marginTop: 6 },

  // Badge
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  badgeText: { fontSize: 12, fontWeight: '600' },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181b',
    marginBottom: 8,
    lineHeight: 26,
  },
  modalMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  modalMetaText: { fontSize: 12, color: '#71717a' },
  divider: { height: 1, backgroundColor: '#f4f4f5', marginVertical: 14 },
  modalContent: { fontSize: 15, color: '#3f3f46', lineHeight: 24 },
  closeBtn: { fontSize: 18, color: '#71717a', paddingHorizontal: 4 },
  closeRow: { marginTop: 20, marginBottom: 8 },
});