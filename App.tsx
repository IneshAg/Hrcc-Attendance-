import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  AppState,
  AppStateStatus,
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { Header } from './src/components/Header';
import { TabBar, TabKey } from './src/components/TabBar';
import { MeetingCard } from './src/components/MeetingCard';
import { MemberCard } from './src/components/MemberCard';
import { RollCallScreen } from './src/components/RollCallScreen';
import { NewMeetingModal } from './src/components/NewMeetingModal';
import { NewMemberModal } from './src/components/NewMemberModal';
import { BulkImportModal } from './src/components/BulkImportModal';
import { ShareModal } from './src/components/ShareModal';
import { ExportMembersModal } from './src/components/ExportMembersModal';
import { AnalyticsView } from './src/components/AnalyticsView';
import { supabase } from './src/services/supabase';

import {
  ClubMember,
  Meeting,
  AttendanceRecord,
} from './src/types';
import { sortMembersByHierarchy } from './src/utils/roleUtils';
import {
  initializeStorage,
  getMembers,
  getMeetings,
  getAllAttendance,
  addMember,
  updateMember,
  deleteMember,
  addMeeting,
  deleteMeeting,
  calculateMembersOverallStats,
  bulkUpsertMembers,
  MemberOverallStats,
} from './src/storage/storage';

function AppContent() {
  const { isDark, colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isNarrow = windowWidth < 520;
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('meetings');

  // Core Data
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [memberStats, setMemberStats] = useState<Record<string, MemberOverallStats>>({});

  // Active Screen / Modals State
  const [activeRollCallMeeting, setActiveRollCallMeeting] = useState<Meeting | null>(null);
  const [isNewMeetingVisible, setIsNewMeetingVisible] = useState(false);
  const [isNewMemberVisible, setIsNewMemberVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<ClubMember | null>(null);
  const [isBulkImportVisible, setIsBulkImportVisible] = useState(false);
  const [isExportMembersVisible, setIsExportMembersVisible] = useState(false);
  const [shareModalData, setShareModalData] = useState<{
    meeting: Meeting;
    record: AttendanceRecord | null;
  } | null>(null);

  // Members Tab Filters
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      await initializeStorage();
      const loadedMembers = await getMembers();
      const loadedMeetings = await getMeetings();
      const loadedAttendance = await getAllAttendance();
      const calculatedStats = await calculateMembersOverallStats(loadedMembers);

      setMembers(loadedMembers);
      setMeetings(loadedMeetings);
      setAttendanceRecords(loadedAttendance);
      setMemberStats(calculatedStats);
    } catch (error) {
      console.error('Failed to load app data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadData();

    // 1. Mobile Foreground Re-sync (when user switches back to the app / unlocks phone)
    const appStateSub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        loadData();
      }
    });

    // 2. Web Window Focus & Visibility Re-sync (when user switches back to browser tab)
    let handleFocus: (() => void) | null = null;
    let handleVisibility: (() => void) | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      handleFocus = () => loadData();
      handleVisibility = () => {
        if (typeof document !== 'undefined' && !document.hidden) {
          loadData();
        }
      };
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleVisibility);
    }

    // 3. Gentle Heartbeat Polling (every 20s) to guarantee data freshness even if WebSockets sleep
    const intervalId = setInterval(() => {
      loadData();
    }, 20000);

    // 4. Supabase Real-time Synchronization across concurrent devices
    const channel = supabase
      .channel('hrcc_attendance_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'club_members' },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings' },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_attendance' },
        () => {
          loadData();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          loadData();
        }
      });

    return () => {
      appStateSub.remove();
      clearInterval(intervalId);
      if (handleFocus && typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
      if (handleVisibility && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Bulk Import / Update Members from Text / Excel / CSV
  const handleBulkImport = async (rows: any[]) => {
    await bulkUpsertMembers(rows);
    await loadData();
  };

  // Add Meeting
  const handleCreateMeeting = async (newMeetingData: Omit<Meeting, 'id' | 'createdAt'>) => {
    const created = await addMeeting(newMeetingData);
    setMeetings((prev) => [created, ...prev]);
  };

  // Delete Meeting
  const handleDeleteMeeting = async (meetingId: string) => {
    const doDelete = async () => {
      await deleteMeeting(meetingId);
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      setAttendanceRecords((prev) => {
        const copy = { ...prev };
        delete copy[meetingId];
        return copy;
      });
      // Refresh stats
      const updatedStats = await calculateMembersOverallStats(members);
      setMemberStats(updatedStats);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this meeting and its attendance record?')) {
        doDelete();
      }
    } else {
      Alert.alert('Delete Meeting', 'Are you sure you want to delete this meeting?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  // Add Member
  const handleAddMember = async (newMemberData: Omit<ClubMember, 'id'>) => {
    const created = await addMember(newMemberData);
    const updatedMembers = [created, ...members];
    setMembers(updatedMembers);
    const updatedStats = await calculateMembersOverallStats(updatedMembers);
    setMemberStats(updatedStats);
  };

  // Update Member
  const handleUpdateMember = async (id: string, updatedData: Partial<ClubMember>) => {
    const updated = await updateMember(id, updatedData);
    const updatedMembers = members.map((m) => (m.id === id ? { ...m, ...updated } : m));
    setMembers(updatedMembers);
    const updatedStats = await calculateMembersOverallStats(updatedMembers);
    setMemberStats(updatedStats);
    setEditingMember(null);
  };

  // Delete Member
  const handleDeleteMember = async (memberId: string) => {
    const doDelete = async () => {
      await deleteMember(memberId);
      const updatedMembers = members.filter((m) => m.id !== memberId);
      setMembers(updatedMembers);
      const updatedStats = await calculateMembersOverallStats(updatedMembers);
      setMemberStats(updatedStats);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Remove this member from the club roster?')) {
        doDelete();
      }
    } else {
      Alert.alert('Remove Member', 'Are you sure you want to remove this member?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  // Callback when roll call is saved inside RollCallScreen
  const handleAttendanceUpdated = async (updatedRecord: AttendanceRecord) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [updatedRecord.meetingId]: updatedRecord,
    }));
    const updatedStats = await calculateMembersOverallStats(members);
    setMemberStats(updatedStats);
  };

  // Open Share modal
  const handleOpenShare = (meeting: Meeting, record?: AttendanceRecord) => {
    const rec = record || attendanceRecords[meeting.id] || null;
    setShareModalData({
      meeting,
      record: rec,
    });
  };

  // Filtered members for Members Directory tab
  const domainFilters = [
    'All',
    'Executives',
    'Heads',
    'Leads',
    'Technical',
    'Creatives',
    'Corporate',
  ];

  const filteredMembersList = useMemo(() => {
    const list = members.filter((m) => {
      const q = memberSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.raNo && m.raNo.toLowerCase().includes(q)) ||
        (m.domain && m.domain.toLowerCase().includes(q)) ||
        (m.role && m.role.toLowerCase().includes(q)) ||
        (m.branch && m.branch.toLowerCase().includes(q)) ||
        (m.department && m.department.toLowerCase().includes(q)) ||
        (m.srmEmail && m.srmEmail.toLowerCase().includes(q)) ||
        (m.personalEmail && m.personalEmail.toLowerCase().includes(q)) ||
        (m.section && m.section.toLowerCase().includes(q)) ||
        (m.phone && m.phone.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (selectedDomain === 'All') return true;
      if (selectedDomain === 'Executives') {
        const lower = (m.role || '').toLowerCase();
        return (
          lower.includes('president') ||
          lower.includes('secretary') ||
          m.domain === 'None' ||
          !m.domain
        );
      }
      if (selectedDomain === 'Heads') {
        return (m.role || '').toLowerCase().includes('head');
      }
      if (selectedDomain === 'Leads') {
        return (m.role || '').toLowerCase().includes('lead');
      }
      return m.domain === selectedDomain;
    });

    return sortMembersByHierarchy(list);
  }, [members, memberSearchQuery, selectedDomain]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Image
          source={require('./assets/hrcc-logo.png')}
          style={{ width: 68, height: 68, marginBottom: 18 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 14 }]}>
          Loading HRCC Attendance...
        </Text>
      </View>
    );
  }

  // Active Roll Call screen (Taking attendance for a selected meeting)
  if (activeRollCallMeeting) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RollCallScreen
          meeting={activeRollCallMeeting}
          members={members}
          initialAttendance={attendanceRecords[activeRollCallMeeting.id] || null}
          onBack={() => setActiveRollCallMeeting(null)}
          onOpenShare={(mtg, rec) => handleOpenShare(mtg, rec)}
          onAttendanceUpdated={handleAttendanceUpdated}
        />
        {/* Share Modal */}
        <ShareModal
          visible={shareModalData !== null}
          meeting={shareModalData?.meeting || null}
          attendance={shareModalData?.record || null}
          members={members}
          onClose={() => setShareModalData(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Header */}
      <Header
        title="HackerRank Campus Crew"
        subtitle="Attendance & Roll Call"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Navigation Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          loadData();
        }}
        meetingsCount={meetings.length}
        membersCount={members.length}
      />

      {/* Main Screen Content */}
      <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
        {/* 1. MEETINGS TAB */}
        {activeTab === 'meetings' && (
          <FlatList
            data={meetings}
            keyExtractor={(item) => item.id}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            renderItem={({ item }) => (
              <MeetingCard
                meeting={item}
                attendanceRecord={attendanceRecords[item.id] || null}
                totalMembersCount={members.length}
                onOpenRollCall={(m) => setActiveRollCallMeeting(m)}
                onShare={(m) => handleOpenShare(m)}
                onDelete={handleDeleteMeeting}
              />
            )}
            contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.tabHeader}>
                <Text style={[styles.tabSectionTitle, { color: colors.text }]}>
                  Club Meetings & Roll Call
                </Text>
                <Text style={[styles.tabSectionSubtitle, { color: colors.textSecondary }]}>
                  Tap any session below to mark present and absent members
                </Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={44} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Meetings Scheduled</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Tap "+ New Meeting" to schedule your first club session.
                </Text>
              </View>
            }
          />
        )}

        {/* 2. MEMBERS TAB */}
        {activeTab === 'members' && (
          <View style={styles.membersTabWrapper}>
            {/* Search Input */}
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <Ionicons name="search-outline" size={17} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search name, Reg.No, branch, domain, role..."
                value={memberSearchQuery}
                onChangeText={setMemberSearchQuery}
                placeholderTextColor={colors.textMuted}
                clearButtonMode="while-editing"
              />
              {memberSearchQuery ? (
                <TouchableOpacity onPress={() => setMemberSearchQuery('')}>
                  <Ionicons name="close-circle" size={17} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Domain Filter Chips (Horizontal Swipeable Row) */}
            <View style={styles.domainSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.domainChipsScroll}
              >
                {domainFilters.map((dom) => {
                  const isSelected = selectedDomain === dom;
                  return (
                    <TouchableOpacity
                      key={dom}
                      style={[
                        styles.domainChip,
                        isSelected
                          ? {
                              backgroundColor: colors.primary,
                              borderColor: colors.primary,
                            }
                          : {
                              backgroundColor: colors.surface,
                              borderColor: colors.cardBorder,
                            },
                      ]}
                      onPress={() => setSelectedDomain(dom)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.domainChipText,
                          {
                            color: isSelected
                              ? (isDark ? '#070707' : '#FFFFFF')
                              : colors.textSecondary,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {dom}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Utility Sub-Bar: Filtered Count + Import & Export Actions */}
            <View style={styles.utilityBar}>
              <View style={styles.countBadge}>
                <Text style={[styles.countBadgeText, { color: colors.textMuted }]}>
                  {filteredMembersList.length} {filteredMembersList.length === 1 ? 'member' : 'members'}
                  {selectedDomain !== 'All' ? ` • ${selectedDomain}` : ''}
                </Text>
              </View>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.utilityActionBtn,
                    {
                      backgroundColor: isDark ? 'rgba(5, 199, 112, 0.12)' : '#ECFDF5',
                      borderColor: isDark ? 'rgba(5, 199, 112, 0.3)' : '#A7F3D0',
                    },
                  ]}
                  onPress={() => setIsBulkImportVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="flash-outline" size={13} color={colors.brandGreen} />
                  <Text style={[styles.utilityActionText, { color: isDark ? colors.brandGreen : colors.primary }]}>
                    Import / Update
                  </Text>
                </TouchableOpacity>

                {members.length > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.utilityActionBtn,
                      {
                        backgroundColor: isDark ? 'rgba(5, 199, 112, 0.12)' : '#ECFDF5',
                        borderColor: isDark ? 'rgba(5, 199, 112, 0.3)' : '#A7F3D0',
                      },
                    ]}
                    onPress={() => setIsExportMembersVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-outline" size={13} color={colors.brandGreen} />
                    <Text style={[styles.utilityActionText, { color: isDark ? colors.brandGreen : colors.primary }]}>
                      Extract / Export
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Members List */}
            <FlatList
              data={filteredMembersList}
              keyExtractor={(item) => item.id}
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              renderItem={({ item }) => (
                <MemberCard
                  member={item}
                  stats={memberStats[item.id]}
                  onEdit={(m) => setEditingMember(m)}
                  onDelete={handleDeleteMember}
                />
              )}
              contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={44} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Members Found</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    Try adjusting your search query or domain filter.
                  </Text>
                </View>
              }
            />
          </View>
        )}

        {/* 3. ANALYTICS & REPORTS TAB */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            members={members}
            meetings={meetings}
            attendanceRecords={attendanceRecords}
            memberStats={memberStats}
          />
        )}

        {/* Floating Action Button (FAB) */}
        {(activeTab === 'meetings' || activeTab === 'members') && (
          <TouchableOpacity
            style={[
              styles.floatingActionButton,
              { backgroundColor: colors.primary },
              isNarrow && styles.floatingActionButtonMobile,
            ]}
            onPress={() => {
              if (activeTab === 'meetings') setIsNewMeetingVisible(true);
              else if (activeTab === 'members') setIsNewMemberVisible(true);
            }}
            activeOpacity={0.85}
            accessibilityLabel={activeTab === 'meetings' ? 'Create New Meeting' : 'Add New Member'}
          >
            <Ionicons
              name={activeTab === 'meetings' ? 'add' : 'person-add'}
              size={isNarrow ? 22 : 19}
              color={isDark ? '#070707' : '#FFFFFF'}
            />
            {!isNarrow && (
              <Text style={[styles.fabText, { color: isDark ? '#070707' : '#FFFFFF' }]}>
                {activeTab === 'meetings' ? 'New Meeting' : 'Add Member'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Modals */}
      <NewMeetingModal
        visible={isNewMeetingVisible}
        onClose={() => setIsNewMeetingVisible(false)}
        onSubmit={handleCreateMeeting}
      />

      <NewMemberModal
        visible={isNewMemberVisible || editingMember !== null}
        initialMember={editingMember}
        onClose={() => {
          setIsNewMemberVisible(false);
          setEditingMember(null);
        }}
        onSubmit={handleAddMember}
        onUpdate={handleUpdateMember}
      />

      <BulkImportModal
        visible={isBulkImportVisible}
        existingMembers={members}
        onClose={() => setIsBulkImportVisible(false)}
        onConfirmImport={handleBulkImport}
      />

      <ShareModal
        visible={shareModalData !== null}
        meeting={shareModalData?.meeting || null}
        attendance={shareModalData?.record || null}
        members={members}
        onClose={() => setShareModalData(null)}
      />

      <ExportMembersModal
        visible={isExportMembersVisible}
        members={members}
        onClose={() => setIsExportMembersVisible(false)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mainContainer: {
    flex: 1,
  },
  listContent: {
    padding: 14,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  tabHeader: {
    marginBottom: 12,
  },
  tabSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tabSectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  membersTabWrapper: {
    flex: 1,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  domainSection: {
    marginBottom: 8,
  },
  domainChipsScroll: {
    paddingHorizontal: 14,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  domainChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  domainChipText: {
    fontSize: 11.5,
  },
  utilityBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 8,
    gap: 8,
  },
  countBadge: {
    flex: 1,
  },
  countBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  utilityActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  utilityActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 17,
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 28,
    shadowColor: '#05C770',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  floatingActionButtonMobile: {
    width: 50,
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 22,
    right: 18,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
