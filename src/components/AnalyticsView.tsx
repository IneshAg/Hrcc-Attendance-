import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClubMember, Meeting, AttendanceRecord } from '../types';
import { MemberOverallStats } from '../storage/storage';
import { useTheme } from '../context/ThemeContext';

interface AnalyticsViewProps {
  members: ClubMember[];
  meetings: Meeting[];
  attendanceRecords: Record<string, AttendanceRecord>;
  memberStats: Record<string, MemberOverallStats>;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  members,
  meetings,
  attendanceRecords,
  memberStats,
}) => {
  const { isDark, colors } = useTheme();
  const completedMeetings = meetings.filter((m) => attendanceRecords[m.id]);

  if (members.length === 0) {
    return (
      <View style={[styles.emptyAnalytics, { backgroundColor: colors.background }]}>
        <Ionicons name="bar-chart-outline" size={48} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Attendance Data Yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Register club members and record meeting roll calls to view turnout analytics and domain performance.
        </Text>
      </View>
    );
  }

  // Overall club attendance percentage calculation
  let totalOpportunities = 0;
  let totalAttended = 0;

  Object.values(memberStats).forEach((stat) => {
    totalOpportunities += stat.totalMeetings;
    totalAttended += stat.attendedMeetings;
  });

  const overallTurnout =
    totalOpportunities > 0 ? Math.round((totalAttended / totalOpportunities) * 100) : 0;

  // Domain breakdown
  const domainList = ['Technical', 'Creatives', 'Corporate', 'Executive'];
  const domainBreakdown = domainList
    .map((dom) => {
      const domainMembers = members.filter((m) =>
        dom === 'Executive' ? m.domain === 'None' || !m.domain : m.domain === dom
      );
      if (domainMembers.length === 0) return null;
      let domOpportunities = 0;
      let domAttended = 0;

      domainMembers.forEach((m) => {
        const stat = memberStats[m.id];
        if (stat) {
          domOpportunities += stat.totalMeetings;
          domAttended += stat.attendedMeetings;
        }
      });

      const rate = domOpportunities > 0 ? Math.round((domAttended / domOpportunities) * 100) : 0;

      return {
        domain: dom,
        count: domainMembers.length,
        attendanceRate: rate,
      };
    })
    .filter(Boolean) as { domain: string; count: number; attendanceRate: number }[];

  // Top Attendees (sorted by rate descending)
  const sortedMembers = [...members].sort((a, b) => {
    const rateA = memberStats[a.id]?.attendanceRate || 0;
    const rateB = memberStats[b.id]?.attendanceRate || 0;
    return rateB - rateA;
  });

  const topAttendees = sortedMembers.filter((m) => (memberStats[m.id]?.attendanceRate || 0) >= 75);
  const lowAttendees = sortedMembers.filter(
    (m) =>
      (memberStats[m.id]?.totalMeetings || 0) > 0 &&
      (memberStats[m.id]?.attendanceRate || 0) < 60
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Overview Cards Grid */}
      <View style={styles.grid}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View
            style={[
              styles.statIconBadge,
              { backgroundColor: isDark ? '#232946' : '#EEF2FF' },
            ]}
          >
            <Ionicons name="people" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{members.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Registered Members</Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View
            style={[
              styles.statIconBadge,
              { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' },
            ]}
          >
            <Ionicons name="calendar" size={20} color={colors.success} />
          </View>
          <Text style={[styles.statNumber, { color: colors.success }]}>
            {completedMeetings.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed Sessions</Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View
            style={[
              styles.statIconBadge,
              { backgroundColor: isDark ? '#232946' : '#EEF2FF' },
            ]}
          >
            <Ionicons name="trending-up" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{overallTurnout}%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Club Turnout</Text>
        </View>
      </View>

      {/* Domain-wise Breakdown */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="layers-outline" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Domain Attendance Breakdown</Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Turnout performance across crew domains
        </Text>

        <View style={styles.domainList}>
          {domainBreakdown.map((item) => (
            <View key={item.domain} style={styles.domainRow}>
              <View style={styles.domainInfo}>
                <Text style={[styles.domainName, { color: colors.text }]}>{item.domain} Domain</Text>
                <Text style={[styles.domainCount, { color: colors.textMuted }]}>{item.count} members</Text>
              </View>

              <View style={styles.domainProgressWrapper}>
                <View
                  style={[
                    styles.domainTrack,
                    { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                  ]}
                >
                  <View
                    style={[
                      styles.domainFill,
                      {
                        width: `${item.attendanceRate}%`,
                        backgroundColor: item.attendanceRate >= 80 ? '#10B981' : colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.domainRateText, { color: colors.text }]}>{item.attendanceRate}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Top Consistent Attendees */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="ribbon-outline" size={18} color={colors.success} />
          <Text style={[styles.sectionTitle, { color: colors.success }]}>
            High Consistency Members ({topAttendees.length})
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Turnout ≥ 75% in club sessions
        </Text>

        <View style={styles.attendeesList}>
          {topAttendees.map((m) => {
            const stat = memberStats[m.id];
            return (
              <View
                key={m.id}
                style={[
                  styles.memberPill,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: isDark ? '#253347' : '#F1F5F9',
                  },
                ]}
              >
                <View style={styles.memberLeft}>
                  <Text style={[styles.memberPillName, { color: colors.text }]}>{m.name}</Text>
                  {m.raNo ? <Text style={styles.memberPillRa}>[{m.raNo}]</Text> : null}
                  <Text style={[styles.memberPillDomain, { color: colors.textMuted }]}>
                    • {m.domain && m.domain !== 'None' ? m.domain : m.role || 'Member'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.rateTagGreen,
                    {
                      backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
                      borderColor: isDark ? '#047857' : '#A7F3D0',
                    },
                  ]}
                >
                  <Text style={[styles.rateTagGreenText, { color: isDark ? '#34D399' : '#047857' }]}>
                    {stat ? stat.attendanceRate : 0}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Follow-up needed: Low Attendance (Simplified without FA context) */}
      {lowAttendees.length > 0 && (
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? '#450A0A' : '#FECACA',
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="warning-outline" size={18} color={colors.danger} />
            <Text style={[styles.sectionTitle, { color: colors.danger }]}>
              Low Attendance Members ({lowAttendees.length})
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Attendance below 60% — follow up with them directly
          </Text>

          <View style={styles.attendeesList}>
            {lowAttendees.map((m) => {
              const stat = memberStats[m.id];
              return (
                <View
                  key={m.id}
                  style={[
                    styles.memberPill,
                    {
                      backgroundColor: isDark ? '#201217' : '#FEF2F2',
                      borderColor: isDark ? '#450A0A' : '#FEE2E2',
                    },
                  ]}
                >
                  <View style={styles.memberLeft}>
                    <Text style={[styles.memberPillName, { color: colors.text }]}>{m.name}</Text>
                    {m.raNo ? <Text style={styles.memberPillRa}>[{m.raNo}]</Text> : null}
                    <Text style={[styles.memberPillDomain, { color: colors.textMuted }]}>
                      • {m.domain && m.domain !== 'None' ? m.domain : m.role || 'Member'}
                    </Text>
                    {m.phone ? (
                      <Text style={[styles.memberPhoneTag, { color: colors.textSecondary }]}>
                        📞 {m.phone}
                      </Text>
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.rateTagRed,
                      {
                        backgroundColor: isDark ? '#450A0A' : '#FEE2E2',
                        borderColor: isDark ? '#991B1B' : '#FECACA',
                      },
                    ]}
                  >
                    <Text style={[styles.rateTagRedText, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>
                      {stat ? stat.attendanceRate : 0}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  domainList: {
    gap: 12,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  domainInfo: {
    width: 120,
  },
  domainName: {
    fontSize: 13,
    fontWeight: '700',
  },
  domainCount: {
    fontSize: 11,
    marginTop: 1,
  },
  domainProgressWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  domainTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  domainFill: {
    height: '100%',
    borderRadius: 4,
  },
  domainRateText: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  attendeesList: {
    gap: 8,
  },
  memberPill: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
    marginRight: 8,
  },
  memberPillName: {
    fontSize: 13,
    fontWeight: '700',
  },
  memberPillRa: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
  },
  memberPillDomain: {
    fontSize: 11,
  },
  memberPhoneTag: {
    fontSize: 11,
    fontWeight: '500',
  },
  rateTagGreen: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  rateTagGreenText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rateTagRed: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  rateTagRedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyAnalytics: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 18,
  },
});
