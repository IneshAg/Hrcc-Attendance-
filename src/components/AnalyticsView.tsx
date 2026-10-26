import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClubMember, Meeting, AttendanceRecord } from '../types';
import { MemberOverallStats } from '../storage/storage';

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
  const completedMeetings = meetings.filter((m) => attendanceRecords[m.id]);

  if (members.length === 0) {
    return (
      <View style={styles.emptyAnalytics}>
        <Ionicons name="bar-chart-outline" size={48} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>No Attendance Data Yet</Text>
        <Text style={styles.emptySubtitle}>
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Overview Cards Grid */}
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <View style={styles.statIconBadge}>
            <Ionicons name="people" size={20} color="#4F46E5" />
          </View>
          <Text style={styles.statNumber}>{members.length}</Text>
          <Text style={styles.statLabel}>Registered Members</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBadge, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="calendar" size={20} color="#059669" />
          </View>
          <Text style={[styles.statNumber, { color: '#059669' }]}>
            {completedMeetings.length}
          </Text>
          <Text style={styles.statLabel}>Completed Meetings</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBadge, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="trending-up" size={20} color="#4F46E5" />
          </View>
          <Text style={[styles.statNumber, { color: '#4F46E5' }]}>{overallTurnout}%</Text>
          <Text style={styles.statLabel}>Avg Club Turnout</Text>
        </View>
      </View>

      {/* Domain-wise Breakdown */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="layers-outline" size={18} color="#4F46E5" />
          <Text style={styles.sectionTitle}>Domain Attendance Breakdown</Text>
        </View>
        <Text style={styles.sectionSubtitle}>Turnout performance across college club domains</Text>

        <View style={styles.domainList}>
          {domainBreakdown.map((item) => (
            <View key={item.domain} style={styles.domainRow}>
              <View style={styles.domainInfo}>
                <Text style={styles.domainName}>{item.domain} Domain</Text>
                <Text style={styles.domainCount}>{item.count} members</Text>
              </View>

              <View style={styles.domainProgressWrapper}>
                <View style={styles.domainTrack}>
                  <View
                    style={[
                      styles.domainFill,
                      {
                        width: `${item.attendanceRate}%`,
                        backgroundColor: item.attendanceRate >= 80 ? '#10B981' : '#6366F1',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.domainRateText}>{item.attendanceRate}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Top Consistent Attendees */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="ribbon-outline" size={18} color="#059669" />
          <Text style={[styles.sectionTitle, { color: '#059669' }]}>
            High Consistency Members ({topAttendees.length})
          </Text>
        </View>
        <Text style={styles.sectionSubtitle}>Turnout ≥ 75% in club meetings</Text>

        <View style={styles.attendeesList}>
          {topAttendees.map((m) => {
            const stat = memberStats[m.id];
            return (
              <View key={m.id} style={styles.memberPill}>
                <View style={styles.memberLeft}>
                  <Text style={styles.memberPillName}>{m.name}</Text>
                  <Text style={styles.memberPillRa}>[{m.raNo}]</Text>
                  <Text style={styles.memberPillDomain}>• {m.domain}</Text>
                </View>
                <View style={styles.rateTagGreen}>
                  <Text style={styles.rateTagGreenText}>
                    {stat ? stat.attendanceRate : 0}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Follow-up needed: Low Attendance */}
      {lowAttendees.length > 0 && (
        <View style={[styles.sectionCard, { borderColor: '#FECACA' }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="warning-outline" size={18} color="#DC2626" />
            <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>
              Follow-up Needed (Low Attendance)
            </Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Members with attendance below 60% — coordinate with respective Faculty Advisors
          </Text>

          <View style={styles.attendeesList}>
            {lowAttendees.map((m) => {
              const stat = memberStats[m.id];
              return (
                <View key={m.id} style={[styles.memberPill, { backgroundColor: '#FEF2F2' }]}>
                  <View style={styles.memberLeft}>
                    <Text style={styles.memberPillName}>{m.name}</Text>
                    <Text style={styles.memberPillRa}>[{m.raNo}]</Text>
                    <Text style={styles.memberPillDomain}>• FA: {m.faName}</Text>
                  </View>
                  <View style={styles.rateTagRed}>
                    <Text style={styles.rateTagRedText}>{stat ? stat.attendanceRate : 0}%</Text>
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
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
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  domainList: {
    gap: 10,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  domainInfo: {
    width: 140,
  },
  domainName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  domainCount: {
    fontSize: 11,
    color: '#64748B',
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
    backgroundColor: '#F1F5F9',
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
    color: '#334155',
    minWidth: 36,
    textAlign: 'right',
  },
  attendeesList: {
    gap: 8,
  },
  memberPill: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  memberPillName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  memberPillRa: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  memberPillDomain: {
    fontSize: 11,
    color: '#64748B',
  },
  rateTagGreen: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  rateTagGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  rateTagRed: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rateTagRedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
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
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 18,
  },
});
