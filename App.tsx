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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Header } from './src/components/Header';
import { TabBar, TabKey } from './src/components/TabBar';
import { MeetingCard } from './src/components/MeetingCard';
import { MemberCard } from './src/components/MemberCard';
import { RollCallScreen } from './src/components/RollCallScreen';
import { NewMeetingModal } from './src/components/NewMeetingModal';
import { NewMemberModal } from './src/components/NewMemberModal';
import { ShareModal } from './src/components/ShareModal';
import { AnalyticsView } from './src/components/AnalyticsView';

import {
  ClubMember,
  Meeting,
  AttendanceRecord,
} from './src/types';
import {
  initializeStorage,
  getMembers,
  getMeetings,
  getAllAttendance,
  addMember,
  deleteMember,
  addMeeting,
  deleteMeeting,
  calculateMembersOverallStats,
  MemberOverallStats,
} from './src/storage/storage';
import { generateMembersListCSV, downloadFile } from './src/utils/exportUtils';

export default function App() {
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
  const [shareModalData, setShareModalData] = useState<{
    meeting: Meeting;
    record: AttendanceRecord | null;
  } | null>(null);

  // Members Tab Filters
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');

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

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Export Full Members Roster as CSV
  const handleExportMembersCSV = async () => {
    if (members.length === 0) {
      if (Platform.OS === 'web') {
        alert('No members to export yet. Add club members first.');
      } else {
        Alert.alert('No Members', 'No members to export yet. Add club members first.');
      }
      return;
    }
    const csv = generateMembersListCSV(members);
    await downloadFile('club_members_roster.csv', csv, 'text/csv;charset=utf-8;');
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
  const domainFilters = ['All', 'Technical', 'Creatives', 'Corporate', 'Executive (No Domain)'];

  const filteredMembersList = useMemo(() => {
    return members.filter((m) => {
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
        (m.faName && m.faName.toLowerCase().includes(q)) ||
        (m.faEmail && m.faEmail.toLowerCase().includes(q)) ||
        (m.linkedin && m.linkedin.toLowerCase().includes(q)) ||
        (m.github && m.github.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (selectedDomain === 'All') return true;
      if (selectedDomain === 'Executive (No Domain)') {
        return m.domain === 'None' || !m.domain;
      }
      return m.domain === selectedDomain;
    });
  }, [members, memberSearchQuery, selectedDomain]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading Club Attendance...</Text>
      </View>
    );
  }

  // Active Roll Call screen (Taking attendance for a selected meeting)
  if (activeRollCallMeeting) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <Header
        title="HackerRank Campus Crew"
        subtitle="Attendance & Meeting Roll Call"
        onNewMeeting={() => setIsNewMeetingVisible(true)}
        onNewMember={() => setIsNewMemberVisible(true)}
        activeTab={activeTab}
      />

      {/* Navigation Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        meetingsCount={meetings.length}
        membersCount={members.length}
      />

      {/* Main Screen Content */}
      <View style={styles.mainContainer}>
        {/* 1. MEETINGS TAB */}
        {activeTab === 'meetings' && (
          <FlatList
            data={meetings}
            keyExtractor={(item) => item.id}
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
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.tabHeader}>
                <View>
                  <Text style={styles.tabSectionTitle}>Club Meetings & Roll Call</Text>
                  <Text style={styles.tabSectionSubtitle}>
                    Select any meeting session to check present/absent members
                  </Text>
                </View>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Meetings Scheduled</Text>
                <Text style={styles.emptySubtitle}>
                  Tap "+ New Meeting" above to create your first session.
                </Text>
              </View>
            }
          />
        )}

        {/* 2. MEMBERS TAB */}
        {activeTab === 'members' && (
          <View style={styles.membersTabWrapper}>
            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search name, Reg.No, SRM email, branch, dept, FA, domain..."
                value={memberSearchQuery}
                onChangeText={setMemberSearchQuery}
                placeholderTextColor="#94A3B8"
                clearButtonMode="while-editing"
              />
              {memberSearchQuery ? (
                <TouchableOpacity onPress={() => setMemberSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Domain Filter Chips & Export Button */}
            <View style={styles.domainRowHeader}>
              <View style={styles.domainFiltersScroll}>
                {domainFilters.map((dom) => (
                  <TouchableOpacity
                    key={dom}
                    style={[styles.domainChip, selectedDomain === dom && styles.domainChipActive]}
                    onPress={() => setSelectedDomain(dom)}
                  >
                    <Text
                      style={[
                        styles.domainChipText,
                        selectedDomain === dom && styles.domainChipTextActive,
                      ]}
                    >
                      {dom}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {members.length > 0 && (
                <TouchableOpacity
                  style={styles.exportRosterBtn}
                  onPress={handleExportMembersCSV}
                  activeOpacity={0.7}
                >
                  <Ionicons name="download-outline" size={15} color="#059669" />
                  <Text style={styles.exportRosterText}>Export CSV</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Members List */}
            <FlatList
              data={filteredMembersList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <MemberCard
                  member={item}
                  stats={memberStats[item.id]}
                  onDelete={handleDeleteMember}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No Members Found</Text>
                  <Text style={styles.emptySubtitle}>
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
      </View>

      {/* Modals */}
      <NewMeetingModal
        visible={isNewMeetingVisible}
        onClose={() => setIsNewMeetingVisible(false)}
        onSubmit={handleCreateMeeting}
      />

      <NewMemberModal
        visible={isNewMemberVisible}
        onClose={() => setIsNewMemberVisible(false)}
        onSubmit={handleAddMember}
      />

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    padding: 16,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 32,
  },
  tabHeader: {
    marginBottom: 14,
  },
  tabSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  tabSectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  membersTabWrapper: {
    flex: 1,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  domainRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  domainFiltersScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  exportRosterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  exportRosterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  domainChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  domainChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  domainChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  domainChipTextActive: {
    color: '#FFFFFF',
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
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
  },
});
