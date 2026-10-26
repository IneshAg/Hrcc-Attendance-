import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meeting, AttendanceRecord, AttendanceSummary } from '../types';
import { calculateMeetingSummary } from '../storage/storage';
import { useTheme } from '../context/ThemeContext';

interface MeetingCardProps {
  meeting: Meeting;
  attendanceRecord: AttendanceRecord | null;
  totalMembersCount: number;
  onOpenRollCall: (meeting: Meeting) => void;
  onShare: (meeting: Meeting) => void;
  onDelete: (meetingId: string) => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  attendanceRecord,
  totalMembersCount,
  onOpenRollCall,
  onShare,
  onDelete,
}) => {
  const { isDark, colors } = useTheme();
  const summary: AttendanceSummary = calculateMeetingSummary(attendanceRecord, totalMembersCount);
  const hasAttendance = attendanceRecord && Object.keys(attendanceRecord.statuses || {}).length > 0;

  // Format date display (e.g. "Mon, 26 Oct 2026")
  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 80) return '#10B981'; // Green
    if (pct >= 60) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      {/* Top Header: Title & Meta */}
      <View style={styles.cardHeader}>
        <View style={styles.titleArea}>
          <Text style={[styles.title, { color: colors.text }]}>{meeting.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatDate(meeting.date)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{meeting.time}</Text>
            </View>
          </View>
          <View style={styles.locationItem}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>{meeting.location}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            {
              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            },
          ]}
          onPress={() => onDelete(meeting.id)}
          accessibilityLabel="Delete Meeting"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {meeting.description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {meeting.description}
        </Text>
      ) : null}

      {/* Attendance Stats Progress */}
      <View style={styles.statsSection}>
        {hasAttendance ? (
          <>
            <View style={styles.statsHeaderRow}>
              <View style={styles.statsPillRow}>
                <View
                  style={[
                    styles.badgePill,
                    {
                      backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
                      borderColor: isDark ? '#047857' : '#A7F3D0',
                    },
                  ]}
                >
                  <Text style={[styles.badgePillText, { color: isDark ? '#34D399' : '#047857' }]}>
                    🟢 {summary.present} Present
                  </Text>
                </View>

                {summary.absent > 0 && (
                  <View
                    style={[
                      styles.badgePill,
                      {
                        backgroundColor: isDark ? '#450A0A' : '#FEF2F2',
                        borderColor: isDark ? '#991B1B' : '#FECACA',
                      },
                    ]}
                  >
                    <Text style={[styles.badgePillText, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>
                      🔴 {summary.absent} Absent
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.percentageContainer}>
                <Text
                  style={[
                    styles.percentageNumber,
                    { color: getPercentageColor(summary.percentage) },
                  ]}
                >
                  {summary.percentage}%
                </Text>
                <Text style={[styles.percentageLabel, { color: colors.textMuted }]}>Turnout</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View
              style={[
                styles.progressBarBackground,
                { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, Math.max(0, summary.percentage))}%`,
                    backgroundColor: getPercentageColor(summary.percentage),
                  },
                ]}
              />
            </View>
          </>
        ) : (
          <View
            style={[
              styles.unmarkedNotice,
              {
                backgroundColor: isDark ? '#231D12' : '#FFFBEB',
                borderColor: isDark ? '#78350F' : '#FDE68A',
              },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={15} color="#F59E0B" />
            <Text style={[styles.unmarkedText, { color: isDark ? '#FDE68A' : '#92400E' }]}>
              Attendance not taken • {totalMembersCount} members to roll call
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.rollCallButton, { backgroundColor: colors.primary }]}
          onPress={() => onOpenRollCall(meeting)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={hasAttendance ? 'create-outline' : 'checkmark-circle-outline'}
            size={17}
            color="#FFFFFF"
          />
          <Text style={styles.rollCallButtonText}>
            {hasAttendance ? 'Update Roll Call' : 'Take Attendance'}
          </Text>
        </TouchableOpacity>

        {hasAttendance && (
          <TouchableOpacity
            style={[
              styles.shareButton,
              {
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={() => onShare(meeting)}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={16} color={colors.primary} />
            <Text style={[styles.shareButtonText, { color: colors.primary }]}>Share</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleArea: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  statsSection: {
    marginVertical: 6,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  statsPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  percentageNumber: {
    fontSize: 15,
    fontWeight: '800',
  },
  percentageLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  unmarkedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  unmarkedText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  rollCallButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  rollCallButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1,
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
