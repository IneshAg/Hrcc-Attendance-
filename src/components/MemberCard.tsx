import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClubMember } from '../types';
import { MemberOverallStats } from '../storage/storage';
import { getRoleBadgeConfig } from '../utils/roleUtils';

interface MemberCardProps {
  member: ClubMember;
  stats?: MemberOverallStats;
  onEdit?: (member: ClubMember) => void;
  onDelete: (memberId: string) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, stats, onEdit, onDelete }) => {
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
    <View style={styles.card}>
      {/* Top Row: Avatar, Name, Reg.No, Role & Delete */}
      <View style={styles.headerRow}>
        <View style={[styles.avatar, { backgroundColor: member.avatarColor || '#4F46E5' }]}>
          <Text style={styles.avatarText}>{getInitials(member.name)}</Text>
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{member.name}</Text>
            {member.raNo ? (
              <View style={styles.raBadge}>
                <Text style={styles.raText}>{member.raNo}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.domainRow}>
            {/* 1. Official Role Badge with Icon */}
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: roleConfig.badgeBg, borderColor: roleConfig.badgeBorder },
              ]}
            >
              <Ionicons
                name={roleConfig.icon as any}
                size={13}
                color={roleConfig.textColor}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.roleBadgeText, { color: roleConfig.textColor }]}>
                {roleConfig.label}
              </Text>
            </View>

            {/* 2. Domain Tag (if not Executive / None) */}
            {member.domain && member.domain !== 'None' ? (
              <View style={styles.domainTag}>
                <Text style={styles.domainText}>{member.domain} Domain</Text>
              </View>
            ) : (
              <View style={[styles.domainTag, styles.domainTagExecutive]}>
                <Text style={styles.domainTextExecutive}>Core Executive</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardActions}>
          {onEdit && (
            <TouchableOpacity
              style={styles.actionBtnEdit}
              onPress={() => onEdit(member)}
              accessibilityLabel="Edit Member Details"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={17} color="#4F46E5" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete(member.id)}
            accessibilityLabel="Remove Member"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Academic Details Grid */}
      <View style={styles.academicGrid}>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Pursuing Branch</Text>
          <Text style={styles.gridValue} numberOfLines={1}>
            {member.branch || 'Not specified'}
          </Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Department</Text>
          <Text style={styles.gridValue} numberOfLines={1}>
            {member.department || 'Not specified'}
          </Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Year & Section</Text>
          <Text style={styles.gridValue}>
            {member.year || '-'} {member.section ? `• Sec ${member.section}` : ''}
          </Text>
        </View>

        <View style={[styles.gridItem, { width: '100%' }]}>
          <Text style={styles.gridLabel}>Faculty Advisor (FA)</Text>
          <Text style={styles.gridValue}>
            {member.faName}{' '}
            {member.faEmail ? (
              <Text style={styles.faEmailText}>({member.faEmail})</Text>
            ) : null}
          </Text>
        </View>
      </View>

      {/* Contact & Social Links */}
      <View style={styles.contactRow}>
        {member.srmEmail ? (
          <View style={styles.contactItem}>
            <Ionicons name="school-outline" size={13} color="#4F46E5" />
            <Text style={styles.contactText} numberOfLines={1}>
              {member.srmEmail}
            </Text>
          </View>
        ) : null}

        {member.personalEmail ? (
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={13} color="#64748B" />
            <Text style={styles.contactText} numberOfLines={1}>
              {member.personalEmail}
            </Text>
          </View>
        ) : null}

        {member.linkedin ? (
          <View style={[styles.contactItem, styles.socialPill]}>
            <Ionicons name="logo-linkedin" size={12} color="#0A66C2" />
            <Text style={[styles.contactText, { color: '#0A66C2', fontWeight: '600' }]}>
              {member.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '@')}
            </Text>
          </View>
        ) : null}

        {member.github ? (
          <View style={[styles.contactItem, styles.socialPill]}>
            <Ionicons name="logo-github" size={12} color="#181717" />
            <Text style={[styles.contactText, { color: '#181717', fontWeight: '600' }]}>
              {member.github.replace(/^https?:\/\/(www\.)?github\.com\//i, '@')}
            </Text>
          </View>
        ) : null}

        {member.phone ? (
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={12} color="#64748B" />
            <Text style={styles.contactText}>{member.phone}</Text>
          </View>
        ) : null}
      </View>

      {/* Attendance Stats Bar */}
      {totalMeetings > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statsLabelRow}>
            <Text style={styles.statsTitle}>Meeting Turnout</Text>
            <Text style={[styles.statsRate, { color: getRateColor(attendanceRate) }]}>
              {attendanceRate}% ({attendedMeetings}/{totalMeetings} attended)
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(100, Math.max(0, attendanceRate))}%`,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  raBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  raText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 0.3,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
    flexWrap: 'wrap',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  domainTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  domainTagExecutive: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  domainText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  domainTextExecutive: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7E22CE',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnEdit: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 6,
  },
  academicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  gridItem: {
    flex: 1,
    minWidth: 125,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  gridValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  faEmailText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  socialPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  contactText: {
    fontSize: 11,
    color: '#64748B',
  },
  statsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statsLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statsTitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  statsRate: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
