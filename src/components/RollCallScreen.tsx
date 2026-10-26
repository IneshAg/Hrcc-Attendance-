import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClubMember, Meeting, AttendanceRecord, AttendanceStatus } from '../types';
import { calculateMeetingSummary, saveMeetingAttendance } from '../storage/storage';

interface RollCallScreenProps {
  meeting: Meeting;
  members: ClubMember[];
  initialAttendance: AttendanceRecord | null;
  onBack: () => void;
  onOpenShare: (meeting: Meeting, record: AttendanceRecord) => void;
  onAttendanceUpdated: (updatedRecord: AttendanceRecord) => void;
}

type FilterOption = 'all' | 'unmarked' | 'present' | 'absent' | 'late' | 'excused';

export const RollCallScreen: React.FC<RollCallScreenProps> = ({
  meeting,
  members,
  initialAttendance,
  onBack,
  onOpenShare,
  onAttendanceUpdated,
}) => {
  // Current attendance record state
  const [attendance, setAttendance] = useState<AttendanceRecord>(() => {
    return (
      initialAttendance || {
        meetingId: meeting.id,
        statuses: {},
        notes: {},
        updatedAt: new Date().toISOString(),
      }
    );
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');

  // Member note modal state
  const [editingNoteMember, setEditingNoteMember] = useState<ClubMember | null>(null);
  const [noteText, setNoteText] = useState('');

  // Save changes helper
  const updateAndSave = (
    newStatuses: Record<string, AttendanceStatus>,
    newNotes?: Record<string, string>
  ) => {
    const updated: AttendanceRecord = {
      meetingId: meeting.id,
      statuses: newStatuses,
      notes: newNotes !== undefined ? newNotes : attendance.notes || {},
      updatedAt: new Date().toISOString(),
    };
    setAttendance(updated);
    saveMeetingAttendance(updated);
    onAttendanceUpdated(updated);
  };

  // Toggle or set status for a member
  const handleSetStatus = (memberId: string, status: AttendanceStatus) => {
    const current = attendance.statuses[memberId];
    const newStatuses = { ...attendance.statuses };

    // If already has that status, tapping again un-marks it
    if (current === status) {
      delete newStatuses[memberId];
    } else {
      newStatuses[memberId] = status;
    }

    updateAndSave(newStatuses);
  };

  // Bulk actions
  const handleMarkAllPresent = () => {
    const newStatuses: Record<string, AttendanceStatus> = { ...attendance.statuses };
    members.forEach((m) => {
      newStatuses[m.id] = 'present';
    });
    updateAndSave(newStatuses);
  };

  const handleMarkAllAbsent = () => {
    const newStatuses: Record<string, AttendanceStatus> = { ...attendance.statuses };
    members.forEach((m) => {
      newStatuses[m.id] = 'absent';
    });
    updateAndSave(newStatuses);
  };

  const handleResetAll = () => {
    updateAndSave({}, {});
  };

  // Note management
  const openNoteModal = (member: ClubMember) => {
    setEditingNoteMember(member);
    setNoteText(attendance.notes?.[member.id] || '');
  };

  const saveMemberNote = () => {
    if (!editingNoteMember) return;
    const newNotes = { ...(attendance.notes || {}) };
    if (noteText.trim()) {
      newNotes[editingNoteMember.id] = noteText.trim();
    } else {
      delete newNotes[editingNoteMember.id];
    }
    updateAndSave(attendance.statuses, newNotes);
    setEditingNoteMember(null);
  };

  // Calculate live summary
  const summary = useMemo(() => {
    return calculateMeetingSummary(attendance, members.length);
  }, [attendance, members.length]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        member.name.toLowerCase().includes(q) ||
        (member.raNo && member.raNo.toLowerCase().includes(q)) ||
        (member.domain && member.domain.toLowerCase().includes(q)) ||
        (member.role && member.role.toLowerCase().includes(q)) ||
        (member.branch && member.branch.toLowerCase().includes(q)) ||
        (member.department && member.department.toLowerCase().includes(q)) ||
        (member.srmEmail && member.srmEmail.toLowerCase().includes(q)) ||
        (member.personalEmail && member.personalEmail.toLowerCase().includes(q)) ||
        (member.section && member.section.toLowerCase().includes(q)) ||
        (member.faName && member.faName.toLowerCase().includes(q)) ||
        (member.faEmail && member.faEmail.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Filter match
      const status = attendance.statuses[member.id];
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'unmarked') return !status;
      return status === selectedFilter;
    });
  }, [members, searchQuery, selectedFilter, attendance.statuses]);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const renderMemberRow = ({ item }: { item: ClubMember }) => {
    const status = attendance.statuses[item.id];
    const hasNote = Boolean(attendance.notes?.[item.id]);

    return (
      <View style={styles.memberCard}>
        {/* Left: Avatar & Info */}
        <View style={styles.memberLeft}>
          <View style={[styles.avatar, { backgroundColor: item.avatarColor || '#4F46E5' }]}>
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          </View>
          <View style={styles.memberInfo}>
            <View style={styles.memberNameRow}>
              <Text style={styles.memberName}>{item.name}</Text>
              <View style={styles.raBadge}>
                <Text style={styles.raText}>{item.raNo}</Text>
              </View>
              {hasNote && (
                <TouchableOpacity onPress={() => openNoteModal(item)}>
                  <Ionicons name="chatbubble-ellipses" size={15} color="#6366F1" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.memberMetaRow}>
              {item.domain && item.domain !== 'None' ? (
                <View style={styles.domainTag}>
                  <Text style={styles.domainTagText}>{item.domain}</Text>
                </View>
              ) : (
                <View style={[styles.domainTag, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                  <Text style={[styles.domainTagText, { color: '#4F46E5' }]}>{item.role}</Text>
                </View>
              )}
              <Text style={styles.collegeDetailText}>
                {item.branch || item.department} {item.section ? `• Sec ${item.section}` : ''}
              </Text>
            </View>

            <Text style={styles.faText}>
              FA: {item.faName} {item.faEmail ? `(${item.faEmail})` : ''}
            </Text>

            {hasNote && (
              <Text style={styles.noteSnippet} numberOfLines={1}>
                Note: {attendance.notes?.[item.id]}
              </Text>
            )}
          </View>
        </View>

        {/* Right: 4-way Status Selector */}
        <View style={styles.statusButtonsContainer}>
          {/* Present (P) */}
          <TouchableOpacity
            style={[
              styles.statusBtn,
              styles.presentBtn,
              status === 'present' && styles.presentBtnActive,
            ]}
            onPress={() => handleSetStatus(item.id, 'present')}
            activeOpacity={0.7}
            accessibilityLabel={`Mark ${item.name} Present`}
          >
            {status === 'present' && (
              <Ionicons name="checkmark" size={12} color="#FFFFFF" style={{ marginRight: 2 }} />
            )}
            <Text
              style={[
                styles.statusBtnText,
                styles.presentBtnText,
                status === 'present' && styles.statusBtnTextActive,
              ]}
            >
              P
            </Text>
          </TouchableOpacity>

          {/* Absent (A) */}
          <TouchableOpacity
            style={[
              styles.statusBtn,
              styles.absentBtn,
              status === 'absent' && styles.absentBtnActive,
            ]}
            onPress={() => handleSetStatus(item.id, 'absent')}
            activeOpacity={0.7}
            accessibilityLabel={`Mark ${item.name} Absent`}
          >
            {status === 'absent' && (
              <Ionicons name="close" size={12} color="#FFFFFF" style={{ marginRight: 2 }} />
            )}
            <Text
              style={[
                styles.statusBtnText,
                styles.absentBtnText,
                status === 'absent' && styles.statusBtnTextActive,
              ]}
            >
              A
            </Text>
          </TouchableOpacity>

          {/* Late (L) */}
          <TouchableOpacity
            style={[
              styles.statusBtn,
              styles.lateBtn,
              status === 'late' && styles.lateBtnActive,
            ]}
            onPress={() => handleSetStatus(item.id, 'late')}
            activeOpacity={0.7}
            accessibilityLabel={`Mark ${item.name} Late`}
          >
            <Text
              style={[
                styles.statusBtnText,
                styles.lateBtnText,
                status === 'late' && styles.statusBtnTextActive,
              ]}
            >
              L
            </Text>
          </TouchableOpacity>

          {/* Excused (E) */}
          <TouchableOpacity
            style={[
              styles.statusBtn,
              styles.excusedBtn,
              status === 'excused' && styles.excusedBtnActive,
            ]}
            onPress={() => handleSetStatus(item.id, 'excused')}
            activeOpacity={0.7}
            accessibilityLabel={`Mark ${item.name} Excused`}
          >
            <Text
              style={[
                styles.statusBtnText,
                styles.excusedBtnText,
                status === 'excused' && styles.statusBtnTextActive,
              ]}
            >
              E
            </Text>
          </TouchableOpacity>

          {/* Add Note Button */}
          <TouchableOpacity
            style={[styles.noteIconBtn, hasNote && styles.noteIconBtnActive]}
            onPress={() => openNoteModal(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={hasNote ? 'document-text' : 'document-text-outline'}
              size={16}
              color={hasNote ? '#4F46E5' : '#94A3B8'}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
          <Text style={styles.backButtonText}>Meetings</Text>
        </TouchableOpacity>

        <View style={styles.topMeetingInfo}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {meeting.title}
          </Text>
          <Text style={styles.topMeta}>
            {meeting.date} • {meeting.time}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => onOpenShare(meeting, attendance)}
          activeOpacity={0.7}
        >
          <Ionicons name="share-social-outline" size={18} color="#4F46E5" />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.innerContent}>
        {/* Live Metrics Header */}
        <View style={styles.metricsCard}>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{summary.total}</Text>
              <Text style={styles.metricLabel}>Total</Text>
            </View>
            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: '#059669' }]}>{summary.present}</Text>
              <Text style={[styles.metricLabel, { color: '#059669' }]}>Present</Text>
            </View>
            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: '#DC2626' }]}>{summary.absent}</Text>
              <Text style={[styles.metricLabel, { color: '#DC2626' }]}>Absent</Text>
            </View>
            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: '#D97706' }]}>{summary.late}</Text>
              <Text style={[styles.metricLabel, { color: '#D97706' }]}>Late</Text>
            </View>
            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: '#4F46E5' }]}>{summary.percentage}%</Text>
              <Text style={[styles.metricLabel, { color: '#4F46E5' }]}>Turnout</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(100, Math.max(0, summary.percentage))}%`,
                  backgroundColor: summary.percentage >= 75 ? '#10B981' : '#F59E0B',
                },
              ]}
            />
          </View>
        </View>

        {/* Quick Bulk Actions */}
        <View style={styles.bulkActionsRow}>
          <TouchableOpacity
            style={styles.bulkBtnPresent}
            onPress={handleMarkAllPresent}
            activeOpacity={0.7}
          >
            <Ionicons name="flash" size={14} color="#047857" />
            <Text style={styles.bulkBtnTextPresent}>All Present</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bulkBtnAbsent}
            onPress={handleMarkAllAbsent}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={14} color="#B91C1C" />
            <Text style={styles.bulkBtnTextAbsent}>All Absent</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bulkBtnReset}
            onPress={handleResetAll}
            activeOpacity={0.7}
          >
            <Ionicons name="reload-outline" size={14} color="#475569" />
            <Text style={styles.bulkBtnTextReset}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, RA No, domain, dept, or FA..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'all' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterPillText, selectedFilter === 'all' && styles.filterPillTextActive]}>
              All ({members.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'unmarked' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('unmarked')}
          >
            <Text style={[styles.filterPillText, selectedFilter === 'unmarked' && styles.filterPillTextActive]}>
              Unmarked ({summary.unmarked})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'present' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('present')}
          >
            <Text style={[styles.filterPillText, selectedFilter === 'present' && styles.filterPillTextActive]}>
              Present ({summary.present})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'absent' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('absent')}
          >
            <Text style={[styles.filterPillText, selectedFilter === 'absent' && styles.filterPillTextActive]}>
              Absent ({summary.absent})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'late' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('late')}
          >
            <Text style={[styles.filterPillText, selectedFilter === 'late' && styles.filterPillTextActive]}>
              Late ({summary.late})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Member Roll Call List */}
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          renderItem={renderMemberRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="person-remove-outline" size={36} color="#CBD5E1" />
              <Text style={styles.emptyText}>No members match your filter</Text>
            </View>
          }
        />
      </View>

      {/* Note Edit Modal */}
      <Modal
        visible={editingNoteMember !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditingNoteMember(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.noteModalContent}>
            <View style={styles.noteModalHeader}>
              <Text style={styles.noteModalTitle}>
                Note for {editingNoteMember?.name}
              </Text>
              <TouchableOpacity onPress={() => setEditingNoteMember(null)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.noteTextInput}
              multiline
              numberOfLines={3}
              placeholder="e.g. Arrived late due to lab, prior notice given, etc."
              value={noteText}
              onChangeText={setNoteText}
              autoFocus
            />

            <View style={styles.noteModalActions}>
              <TouchableOpacity
                style={styles.noteCancelBtn}
                onPress={() => setEditingNoteMember(null)}
              >
                <Text style={styles.noteCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.noteSaveBtn} onPress={saveMemberNote}>
                <Text style={styles.noteSaveText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  topMeetingInfo: {
    flex: 1,
    marginHorizontal: 4,
  },
  topTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  topMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  innerContent: {
    flex: 1,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  bulkActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  bulkBtnPresent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bulkBtnTextPresent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  bulkBtnAbsent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  bulkBtnTextAbsent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  bulkBtnReset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bulkBtnTextReset: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 24,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  raBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  raText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 0.2,
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 3,
  },
  domainTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  domainTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  collegeDetailText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  faText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  noteSnippet: {
    fontSize: 11,
    color: '#6366F1',
    marginTop: 3,
    fontStyle: 'italic',
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1.5,
  },
  statusBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusBtnTextActive: {
    color: '#FFFFFF',
  },
  // Present Button
  presentBtn: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  presentBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  presentBtnText: {
    color: '#059669',
  },
  // Absent Button
  absentBtn: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  absentBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  absentBtnText: {
    color: '#DC2626',
  },
  // Late Button
  lateBtn: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  lateBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  lateBtnText: {
    color: '#D97706',
  },
  // Excused Button
  excusedBtn: {
    borderColor: '#94A3B8',
    backgroundColor: '#F8FAFC',
  },
  excusedBtnActive: {
    backgroundColor: '#64748B',
    borderColor: '#475569',
  },
  excusedBtnText: {
    color: '#64748B',
  },
  noteIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  noteIconBtnActive: {
    backgroundColor: '#EEF2FF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noteModalContent: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  noteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  noteTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  noteModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  noteCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  noteCancelText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  noteSaveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
  },
  noteSaveText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
