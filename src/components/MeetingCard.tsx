import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meeting, AttendanceRecord, AttendanceSummary } from '../types';
import { calculateMeetingSummary } from '../storage/storage';

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
    <View style={styles.card}>
      {/* Top Header: Title & Status */}
      <View style={styles.cardHeader}>
        <View style={styles.titleArea}>
          <Text style={styles.title}>{meeting.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{formatDate(meeting.date)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{meeting.time}</Text>
            </View>
          </View>
          <View style={styles.locationItem}>
            <Ionicons name="location-outline" size={14} color="#64748B" />
            <Text style={styles.locationText}>{meeting.location}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(meeting.id)}
          accessibilityLabel="Delete Meeting"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {meeting.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {meeting.description}
        </Text>
      ) : null}

      {/* Attendance Stats Progress */}
      <View style={styles.statsSection}>
        {hasAttendance ? (
          <>
            <View style={styles.statsHeaderRow}>
              <View style={styles.statsPillRow}>
                <View style={[styles.badgePill, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <Text style={[styles.badgePillText, { color: '#047857' }]}>
                    🟢 {summary.present} Present
                  </Text>
                </View>
                {summary.late > 0 && (
                  <View style={[styles.badgePill, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                    <Text style={[styles.badgePillText, { color: '#B45309' }]}>
                      🟡 {summary.late} Late
                    </Text>
                  </View>
                )}
                {summary.absent > 0 && (
                  <View style={[styles.badgePill, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                    <Text style={[styles.badgePillText, { color: '#B91C1C' }]}>
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
                <Text style={styles.percentageLabel}>Turnout</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarBackground}>
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
          <View style={styles.unmarkedNotice}>
            <Ionicons name="alert-circle-outline" size={16} color="#F59E0B" />
            <Text style={styles.unmarkedText}>
              Attendance not taken yet • {totalMembersCount} members to mark
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.rollCallButton}
          onPress={() => onOpenRollCall(meeting)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={hasAttendance ? 'create-outline' : 'checkmark-circle-outline'}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.rollCallButtonText}>
            {hasAttendance ? 'Update Roll Call' : 'Take Attendance'}
          </Text>
        </TouchableOpacity>

        {hasAttendance && (
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => onShare(meeting)}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={17} color="#4F46E5" />
            <Text style={styles.shareButtonText}>Share Report</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleArea: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 6,
  },
  description: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
  },
  statsSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  percentageContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  percentageNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  percentageLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  progressBarBackground: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  unmarkedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  unmarkedText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  rollCallButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  rollCallButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  shareButtonText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '700',
  },
});
