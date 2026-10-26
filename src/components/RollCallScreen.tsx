import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClubMember, Meeting, AttendanceRecord, AttendanceStatus } from '../types';
import { calculateMeetingSummary, saveMeetingAttendance } from '../storage/storage';
import { getRoleBadgeConfig, sortMembersByHierarchy } from '../utils/roleUtils';
import { useTheme } from '../context/ThemeContext';

interface RollCallScreenProps {
  meeting: Meeting;
  members: ClubMember[];
  initialAttendance: AttendanceRecord | null;
  onBack: () => void;
  onOpenShare: (meeting: Meeting, record: AttendanceRecord) => void;
  onAttendanceUpdated: (updatedRecord: AttendanceRecord) => void;
}

type FilterOption = 'unmarked' | 'all' | 'present' | 'absent';

export const RollCallScreen: React.FC<RollCallScreenProps> = ({
  meeting,
  members,
  initialAttendance,
  onBack,
  onOpenShare,
  onAttendanceUpdated,
}) => {
  const { isDark, colors } = useTheme();

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
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>(() => {
    const initialMarkedCount = Object.keys(initialAttendance?.statuses || {}).length;
    if (members.length > 0 && initialMarkedCount >= members.length) {
      return 'all';
    }
    return 'unmarked';
  });

  // Sync state if attendance is updated remotely or in background
  useEffect(() => {
    if (initialAttendance) {
      setAttendance(initialAttendance);
    }
  }, [initialAttendance]);

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
    const doReset = () => {
      updateAndSave({}, {});
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Reset all roll call markings for this meeting?')) {
        doReset();
      }
    } else {
      doReset();
    }
  };

  // Note management
  const openNoteModal = (member: ClubMember) => {
    setEditingNoteMember(member);
    setNoteText(attendance.notes?.[member.id] || '');
  };

  const saveMemberNote = () => {
    if (!editingNoteMember) return;
    const newNotes = { ...attendance.notes };
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

  // Filter members
  const filteredMembers = useMemo(() => {
    const list = members.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.raNo && m.raNo.toLowerCase().includes(q)) ||
        (m.domain && m.domain.toLowerCase().includes(q)) ||
        (m.role && m.role.toLowerCase().includes(q)) ||
        (m.branch && m.branch.toLowerCase().includes(q)) ||
        (m.department && m.department.toLowerCase().includes(q)) ||
        (m.faName && m.faName.toLowerCase().includes(q)) ||
        (m.phone && m.phone.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const status = attendance.statuses[m.id];
      if (selectedFilter === 'unmarked') return !status;
      if (selectedFilter === 'present') return status === 'present';
      if (selectedFilter === 'absent') return status === 'absent';
      return true; // 'all'
    });

    if (selectedFilter === 'all') {
      return [...list].sort((a, b) => {
        const aMarked = Boolean(attendance.statuses[a.id]);
        const bMarked = Boolean(attendance.statuses[b.id]);
        if (aMarked !== bMarked) return aMarked ? 1 : -1;
        const rankA = getRoleBadgeConfig(a.role, a.domain).rank;
        const rankB = getRoleBadgeConfig(b.role, b.domain).rank;
        if (rankA !== rankB) return rankA - rankB;
        return (a.name || '').localeCompare(b.name || '');
      });
    }

    return sortMembersByHierarchy(list);
  }, [members, searchQuery, selectedFilter, attendance.statuses]);

  // Initials helper
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
    const roleConfig = getRoleBadgeConfig(item.role, item.domain);

    return (
      <View
        style={[
          styles.memberCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        {/* Top: Avatar, Name, Reg.No, Role & Note Trigger */}
        <View style={styles.memberTopRow}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: item.avatarColor || (isDark ? '#04B264' : '#049D57') },
            ]}
          >
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          </View>

          <View style={styles.memberInfo}>
            <View style={styles.nameLine}>
              <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              {item.raNo ? (
                <View
                  style={[
                    styles.raBadge,
                    {
                      backgroundColor: isDark ? 'rgba(5, 199, 112, 0.12)' : '#ECFDF5',
                      borderColor: isDark ? 'rgba(5, 199, 112, 0.3)' : '#A7F3D0',
                    },
                  ]}
                >
                  <Text style={[styles.raText, { color: isDark ? colors.brandGreen : '#047857' }]}>
                    {item.raNo}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Badges line: Role + Domain */}
            <View style={styles.metaLine}>
              <View
                style={[
                  styles.roleBadgeMini,
                  {
                    backgroundColor: isDark ? '#161E19' : roleConfig.badgeBg,
                    borderColor: isDark ? '#26362C' : roleConfig.badgeBorder,
                  },
                ]}
              >
                <Ionicons
                  name={roleConfig.icon as any}
                  size={11}
                  color={isDark && roleConfig.tier === 'member' ? colors.brandGreen : roleConfig.textColor}
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={[
                    styles.roleBadgeMiniText,
                    {
                      color:
                        isDark && roleConfig.tier === 'member'
                          ? colors.brandGreen
                          : roleConfig.textColor,
                    },
                  ]}
                >
                  {roleConfig.label}
                </Text>
              </View>

              {item.domain && item.domain !== 'None' ? (
                <View
                  style={[
                    styles.domainTag,
                    {
                      backgroundColor: isDark ? '#161E19' : '#F1F5F9',
                      borderColor: isDark ? '#26362C' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.domainTagText, { color: colors.textSecondary }]}>
                    {item.domain}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Note Icon Button */}
          <TouchableOpacity
            style={[
              styles.noteBtn,
              hasNote && {
                backgroundColor: isDark ? 'rgba(5, 199, 112, 0.15)' : '#ECFDF5',
                borderColor: colors.brandGreen,
              },
            ]}
            onPress={() => openNoteModal(item)}
            accessibilityLabel="Add Note"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={hasNote ? 'chatbubble-ellipses' : 'chatbubble-outline'}
              size={15}
              color={hasNote ? colors.brandGreen : colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {hasNote && (
          <View
            style={[
              styles.noteSnippetBox,
              {
                backgroundColor: isDark ? '#161E19' : '#F8FAFC',
                borderColor: isDark ? '#26362C' : '#E2E8F0',
              },
            ]}
          >
            <Text style={[styles.noteSnippetText, { color: colors.textSecondary }]} numberOfLines={2}>
              📝 {attendance.notes?.[item.id]}
            </Text>
          </View>
        )}

        {/* Bottom Action Row: Large Thumb-Friendly Buttons (Present / Absent) */}
        <View style={[styles.actionButtonsRow, { borderTopColor: isDark ? '#1F2E24' : '#E2E8F0' }]}>
          {/* Present Button */}
          <TouchableOpacity
            style={[
              styles.statusButton,
              status === 'present'
                ? {
                    backgroundColor: colors.brandGreen,
                    borderColor: '#04B264',
                  }
                : {
                    backgroundColor: isDark ? 'rgba(5, 199, 112, 0.08)' : '#ECFDF5',
                    borderColor: isDark ? 'rgba(5, 199, 112, 0.25)' : '#A7F3D0',
                  },
            ]}
            onPress={() => handleSetStatus(item.id, 'present')}
            activeOpacity={0.7}
            accessibilityLabel={`Mark ${item.name} Present`}
          >
            <Ionicons
              name={status === 'present' ? 'checkmark-circle' : 'checkmark'}
              size={17}
              color={status === 'present' ? (isDark ? '#070707' : '#FFFFFF') : (isDark ? colors.brandGreen : '#047857')}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.statusButtonText,
                {
                  color: status === 'present' ? (isDark ? '#070707' : '#FFFFFF') : (isDark ? colors.brandGreen : '#047857'),
                  fontWeight: status === 'present' ? '900' : '700',
                },
              ]}
            >
              Present
            </Text>
          </TouchableOpacity>

          {/* Absent Button */}
          <TouchableOpacity
            style={[
              styles.statusButton,
              status === 'absent'
                ? {
                    backgroundColor: colors.danger,
                    borderColor: '#E04840',
                  }
                : {
                    backgroundColor: isDark ? 'rgba(255, 95, 86, 0.08)' : '#FEF2F2',
                    borderColor: isDark ? 'rgba(255, 95, 86, 0.25)' : '#FECACA',
                  },
            ]}
            onPress={() => handleSetStatus(item.id, 'absent')}
            activeOpacity={0.7}
            accessibilityLabel={`Mark ${item.name} Absent`}
          >
            <Ionicons
              name={status === 'absent' ? 'close-circle' : 'close'}
              size={17}
              color={status === 'absent' ? '#FFFFFF' : (isDark ? colors.danger : '#DC2626')}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.statusButtonText,
                {
                  color: status === 'absent' ? '#FFFFFF' : (isDark ? colors.danger : '#DC2626'),
                  fontWeight: status === 'absent' ? '900' : '700',
                },
              ]}
            >
              Absent
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.cardBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>

        <View style={styles.topMeetingInfo}>
          <Text style={[styles.meetingHeaderTitle, { color: colors.text }]} numberOfLines={1}>
            {meeting.title}
          </Text>
          <Text style={[styles.meetingHeaderSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {meeting.date} • {meeting.location}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.shareHeaderBtn, { backgroundColor: colors.primary }]}
          onPress={() => onOpenShare(meeting, attendance)}
          activeOpacity={0.8}
        >
          <Ionicons name="share-social-outline" size={15} color={isDark ? '#070707' : '#FFFFFF'} />
          <Text style={[styles.shareHeaderText, { color: isDark ? '#070707' : '#FFFFFF' }]}>
            Share
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentWrapper}>
        {/* Live Metrics Header Card */}
        <View
          style={[
            styles.metricsCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>{summary.total}</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.cardBorder }]} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.brandGreen }]}>{summary.present}</Text>
              <Text style={[styles.metricLabel, { color: colors.brandGreen }]}>Present</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.cardBorder }]} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.danger }]}>{summary.absent}</Text>
              <Text style={[styles.metricLabel, { color: colors.danger }]}>Absent</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.cardBorder }]} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.textMuted }]}>
                {summary.unmarked}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Unmarked</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.cardBorder }]} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.brandGreen }]}>
                {summary.percentage}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.brandGreen }]}>Turnout</Text>
            </View>
          </View>

          {/* Turnout Progress Bar */}
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: isDark ? '#161E19' : '#F1F5F9' },
            ]}
          >
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(100, Math.max(0, summary.percentage))}%`,
                  backgroundColor: summary.percentage >= 75 ? colors.brandGreen : colors.warning,
                },
              ]}
            />
          </View>
        </View>

        {/* Quick Bulk Actions */}
        <View style={styles.bulkRow}>
          <TouchableOpacity
            style={[
              styles.bulkBtn,
              {
                backgroundColor: isDark ? 'rgba(5, 199, 112, 0.12)' : '#ECFDF5',
                borderColor: isDark ? 'rgba(5, 199, 112, 0.3)' : '#A7F3D0',
              },
            ]}
            onPress={handleMarkAllPresent}
            activeOpacity={0.7}
          >
            <Ionicons name="flash" size={13} color={isDark ? colors.brandGreen : '#047857'} />
            <Text style={[styles.bulkBtnText, { color: isDark ? colors.brandGreen : '#047857' }]}>
              All Present
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.bulkBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 95, 86, 0.12)' : '#FEF2F2',
                borderColor: isDark ? 'rgba(255, 95, 86, 0.3)' : '#FECACA',
              },
            ]}
            onPress={handleMarkAllAbsent}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={13} color={isDark ? colors.danger : '#B91C1C'} />
            <Text style={[styles.bulkBtnText, { color: isDark ? colors.danger : '#B91C1C' }]}>
              All Absent
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.bulkBtn,
              {
                backgroundColor: isDark ? '#161E19' : '#F8FAFC',
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={handleResetAll}
            activeOpacity={0.7}
          >
            <Ionicons name="reload-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.bulkBtnText, { color: colors.textSecondary }]}>
              Reset
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <Ionicons name="search-outline" size={17} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search name, Reg.No, branch..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textMuted}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={17} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips (Horizontal Scrollable) */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScrollView}
            contentContainerStyle={styles.filterPillsScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    selectedFilter === 'unmarked'
                      ? colors.brandGreen
                      : isDark
                      ? '#161E19'
                      : '#F1F5F9',
                  borderColor:
                    selectedFilter === 'unmarked' ? colors.brandGreen : colors.cardBorder,
                },
              ]}
              onPress={() => setSelectedFilter('unmarked')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  {
                    color:
                      selectedFilter === 'unmarked'
                        ? (isDark ? '#070707' : '#FFFFFF')
                        : colors.textSecondary,
                    fontWeight: selectedFilter === 'unmarked' ? '800' : '600',
                  },
                ]}
              >
                Unmarked ({summary.unmarked})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    selectedFilter === 'all'
                      ? colors.brandGreen
                      : isDark
                      ? '#161E19'
                      : '#F1F5F9',
                  borderColor:
                    selectedFilter === 'all' ? colors.brandGreen : colors.cardBorder,
                },
              ]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  {
                    color:
                      selectedFilter === 'all'
                        ? (isDark ? '#070707' : '#FFFFFF')
                        : colors.textSecondary,
                    fontWeight: selectedFilter === 'all' ? '800' : '600',
                  },
                ]}
              >
                All ({members.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    selectedFilter === 'present'
                      ? colors.brandGreen
                      : isDark
                      ? '#161E19'
                      : '#F1F5F9',
                  borderColor:
                    selectedFilter === 'present' ? colors.brandGreen : colors.cardBorder,
                },
              ]}
              onPress={() => setSelectedFilter('present')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  {
                    color:
                      selectedFilter === 'present'
                        ? (isDark ? '#070707' : '#FFFFFF')
                        : colors.textSecondary,
                    fontWeight: selectedFilter === 'present' ? '800' : '600',
                  },
                ]}
              >
                Present ({summary.present})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    selectedFilter === 'absent'
                      ? colors.danger
                      : isDark
                      ? '#161E19'
                      : '#F1F5F9',
                  borderColor:
                    selectedFilter === 'absent' ? colors.danger : colors.cardBorder,
                },
              ]}
              onPress={() => setSelectedFilter('absent')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  {
                    color:
                      selectedFilter === 'absent' ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: selectedFilter === 'absent' ? '800' : '600',
                  },
                ]}
              >
                Absent ({summary.absent})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Member Roll Call List */}
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          extraData={attendance}
          renderItem={renderMemberRow}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            selectedFilter === 'unmarked' && !searchQuery ? (
              <View
                style={[
                  styles.allDoneCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isDark ? 'rgba(5, 199, 112, 0.3)' : '#A7F3D0',
                  },
                ]}
              >
                <View
                  style={[
                    styles.allDoneIconCircle,
                    { backgroundColor: isDark ? 'rgba(5, 199, 112, 0.15)' : '#ECFDF5' },
                  ]}
                >
                  <Ionicons name="checkmark-done-circle" size={44} color={colors.brandGreen} />
                </View>
                <Text style={[styles.allDoneTitle, { color: colors.text }]}>All Members Marked!</Text>
                <Text style={[styles.allDoneSubtitle, { color: colors.textSecondary }]}>
                  Roll call complete: {summary.present} Present, {summary.absent} Absent ({summary.percentage}% Turnout).
                </Text>
                <View style={styles.allDoneActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.allDoneBtnReview,
                      {
                        backgroundColor: isDark ? '#161E19' : '#ECFDF5',
                        borderColor: isDark ? '#26362C' : '#A7F3D0',
                      },
                    ]}
                    onPress={() => setSelectedFilter('all')}
                  >
                    <Ionicons name="list" size={14} color={colors.brandGreen} />
                    <Text style={[styles.allDoneBtnTextReview, { color: isDark ? colors.brandGreen : colors.primary }]}>
                      Review All ({members.length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.allDoneBtnShare, { backgroundColor: colors.primary }]}
                    onPress={() => onOpenShare(meeting, attendance)}
                  >
                    <Ionicons name="share-social-outline" size={14} color={isDark ? '#070707' : '#FFFFFF'} />
                    <Text style={[styles.allDoneBtnTextShare, { color: isDark ? '#070707' : '#FFFFFF' }]}>
                      Share Report
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="person-remove-outline" size={36} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No members match this filter
                </Text>
              </View>
            )
          }
        />
      </View>

      {/* Note Modal */}
      <Modal
        visible={editingNoteMember !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditingNoteMember(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View
            style={[
              styles.noteModalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.noteModalHeader}>
              <Text style={[styles.noteModalTitle, { color: colors.text }]}>
                Note for {editingNoteMember?.name}
              </Text>
              <TouchableOpacity onPress={() => setEditingNoteMember(null)}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.noteTextInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              multiline
              numberOfLines={3}
              placeholder="e.g. Arrived late due to lab, prior notice given, etc."
              placeholderTextColor={colors.textMuted}
              value={noteText}
              onChangeText={setNoteText}
              autoFocus
            />

            <View style={styles.noteModalActions}>
              <TouchableOpacity
                style={[
                  styles.noteCancelBtn,
                  {
                    backgroundColor: isDark ? '#161E19' : '#F1F5F9',
                  },
                ]}
                onPress={() => setEditingNoteMember(null)}
              >
                <Text style={[styles.noteCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.noteSaveBtn, { backgroundColor: colors.primary }]}
                onPress={saveMemberNote}
              >
                <Text style={[styles.noteSaveText, { color: isDark ? '#070707' : '#FFFFFF' }]}>
                  Save Note
                </Text>
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
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
  },
  topMeetingInfo: {
    flex: 1,
    marginHorizontal: 8,
    minWidth: 0,
  },
  meetingHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  meetingHeaderSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  shareHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  shareHeaderText: {
    fontSize: 12,
    fontWeight: '800',
  },
  contentWrapper: {
    flex: 1,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  metricsCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    flexShrink: 0,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 22,
  },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2.5,
  },
  bulkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexShrink: 0,
  },
  bulkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  bulkBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    height: 38,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 6,
  },
  filterSection: {
    marginBottom: 10,
    flexShrink: 0,
  },
  filterScrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterPillsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillText: {
    fontSize: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 80,
  },
  memberCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  memberTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#070707',
    fontWeight: '900',
    fontSize: 13,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
  },
  raBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  raText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  roleBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  roleBadgeMiniText: {
    fontSize: 10,
    fontWeight: '700',
  },
  domainTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  domainTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  noteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  noteSnippetBox: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    borderWidth: 1,
  },
  noteSnippetText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusButtonText: {
    fontSize: 13,
  },
  allDoneCard: {
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    borderWidth: 1,
  },
  allDoneIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  allDoneTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  allDoneSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 280,
  },
  allDoneActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  allDoneBtnReview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  allDoneBtnTextReview: {
    fontSize: 12,
    fontWeight: '700',
  },
  allDoneBtnShare: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  allDoneBtnTextShare: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noteModalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  noteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteModalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  noteTextInput: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 13,
    marginBottom: 14,
  },
  noteModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  noteCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  noteCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noteSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  noteSaveText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
