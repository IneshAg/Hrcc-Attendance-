import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClubMember } from '../types';
import { MemberOverallStats } from '../storage/storage';
import { getRoleBadgeConfig } from '../utils/roleUtils';
import { useTheme } from '../context/ThemeContext';

interface MemberCardProps {
  member: ClubMember;
  stats?: MemberOverallStats;
  onEdit?: (member: ClubMember) => void;
  onDelete: (memberId: string) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, stats, onEdit, onDelete }) => {
  const { isDark, colors } = useTheme();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const roleConfig = getRoleBadgeConfig(member.role, member.domain);
  const attendanceRate = stats ? stats.attendanceRate : 0;
  const totalMeetings = stats ? stats.totalMeetings : 0;
  const attendedMeetings = stats ? stats.attendedMeetings : 0;

  const getRateColor = (rate: number) => {
    if (rate >= 80) return '#10B981';
    if (rate >= 60) return '#F59E0B';
    return '#EF4444';
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
      {/* Top Header: Avatar, Name, Reg.No, Actions */}
      <View style={styles.headerRow}>
        <View style={[styles.avatar, { backgroundColor: member.avatarColor || colors.primary }]}>
          <Text style={styles.avatarText}>{getInitials(member.name)}</Text>
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {member.name}
            </Text>
            {member.raNo ? (
              <View
                style={[
                  styles.raBadge,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <Text style={[styles.raText, { color: colors.primary }]}>{member.raNo}</Text>
              </View>
            ) : null}
          </View>

          {/* Role & Domain Tags */}
          <View style={styles.domainRow}>
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor: isDark ? '#1E293B' : roleConfig.badgeBg,
                  borderColor: isDark ? '#334155' : roleConfig.badgeBorder,
                },
              ]}
            >
              <Ionicons
                name={roleConfig.icon as any}
                size={12}
                color={roleConfig.textColor}
                style={{ marginRight: 3 }}
              />
              <Text style={[styles.roleBadgeText, { color: roleConfig.textColor }]}>
                {roleConfig.label}
              </Text>
            </View>

            {member.domain && member.domain !== 'None' ? (
              <View
                style={[
                  styles.domainTag,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <Text style={[styles.domainText, { color: colors.textSecondary }]}>
                  {member.domain}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Top-Right Action Buttons */}
        <View style={styles.cardActions}>
          {onEdit && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' },
              ]}
              onPress={() => onEdit(member)}
              accessibilityLabel="Edit Member Details"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={15} color={colors.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' },
            ]}
            onPress={() => onDelete(member.id)}
            accessibilityLabel="Remove Member"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={15} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Academic Details (Responsive Flow) */}
      {(member.branch || member.department || member.year || member.section) ? (
        <View
          style={[
            styles.academicBox,
            {
              backgroundColor: isDark ? '#111827' : '#F8FAFC',
              borderColor: isDark ? '#1F2937' : '#F1F5F9',
            },
          ]}
        >
          <View style={styles.academicRow}>
            {member.branch || member.department ? (
              <View style={styles.academicItem}>
                <Text style={[styles.academicLabel, { color: colors.textMuted }]}>Branch / Dept</Text>
                <Text style={[styles.academicValue, { color: colors.text }]} numberOfLines={1}>
                  {member.branch || member.department}
                </Text>
              </View>
            ) : null}

            {member.year || member.section ? (
              <View style={styles.academicItem}>
                <Text style={[styles.academicLabel, { color: colors.textMuted }]}>Class</Text>
                <Text style={[styles.academicValue, { color: colors.text }]}>
                  {member.year || '-'} {member.section ? `• Sec ${member.section}` : ''}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Contact & Social Links */}
      <View style={styles.contactRow}>
        {member.phone ? (
          <View
            style={[
              styles.contactItem,
              { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <Ionicons name="call-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>{member.phone}</Text>
          </View>
        ) : null}

        {member.srmEmail ? (
          <View
            style={[
              styles.contactItem,
              { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <Ionicons name="school-outline" size={12} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.textSecondary }]} numberOfLines={1}>
              {member.srmEmail}
            </Text>
          </View>
        ) : null}

        {member.linkedin ? (
          <View
            style={[
              styles.contactItem,
              { backgroundColor: isDark ? '#0A2540' : '#EFF6FF' },
            ]}
          >
            <Ionicons name="logo-linkedin" size={12} color="#0A66C2" />
            <Text style={[styles.contactText, { color: '#0A66C2', fontWeight: '600' }]}>
              {member.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '@')}
            </Text>
          </View>
        ) : null}

        {member.github ? (
          <View
            style={[
              styles.contactItem,
              { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <Ionicons name="logo-github" size={12} color={colors.text} />
            <Text style={[styles.contactText, { color: colors.text, fontWeight: '600' }]}>
              {member.github.replace(/^https?:\/\/(www\.)?github\.com\//i, '@')}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Attendance Stats Bar */}
      {totalMeetings > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statsLabelRow}>
            <Text style={[styles.statsTitle, { color: colors.textMuted }]}>Attendance Turnout</Text>
            <Text style={[styles.statsRate, { color: getRateColor(attendanceRate) }]}>
              {attendanceRate}% ({attendedMeetings}/{totalMeetings})
            </Text>
          </View>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <View
              style={[
                styles.progressBar,
                {
                  width: `${attendanceRate}%`,
                  backgroundColor: getRateColor(attendanceRate),
                },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  raBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  raText: {
    fontSize: 10,
    fontWeight: '700',
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  domainTag: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  domainText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  academicBox: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
    borderWidth: 1,
  },
  academicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  academicItem: {
    flex: 1,
    minWidth: 110,
  },
  academicLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  academicValue: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '100%',
  },
  contactText: {
    fontSize: 11,
  },
  statsContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  statsLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statsTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsRate: {
    fontSize: 11,
    fontWeight: '700',
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
});
