import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onNewMeeting?: () => void;
  onNewMember?: () => void;
  activeTab: 'meetings' | 'members' | 'analytics';
}

export const Header: React.FC<HeaderProps> = ({
  title = 'HackerRank Campus Crew',
  subtitle = 'Club Attendance System',
  onNewMeeting,
  onNewMember,
  activeTab,
}) => {
  const { isDark, colors, toggleTheme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.brandRow}>
        <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
          <Ionicons name="checkbox-outline" size={22} color="#FFFFFF" />
        </View>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
            <View
              style={[
                styles.versionTag,
                {
                  backgroundColor: isDark ? '#1E293B' : '#EEF2FF',
                  borderColor: isDark ? '#334155' : '#C7D2FE',
                },
              ]}
            >
              <Text
                style={[
                  styles.versionText,
                  { color: isDark ? '#A5B4FC' : '#4F46E5' },
                ]}
              >
                PRO
              </Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {/* Dark / Light Mode Toggle Button */}
        <TouchableOpacity
          style={[
            styles.themeToggleBtn,
            {
              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.7}
          accessibilityLabel={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={18}
            color={isDark ? '#FBBF24' : '#6366F1'}
          />
        </TouchableOpacity>

        {/* Desktop / Tablet Quick Actions (FAB provides access on mobile) */}
        {activeTab === 'meetings' && onNewMeeting && (
          <TouchableOpacity
            style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
            onPress={onNewMeeting}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={17} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>+ New Meeting</Text>
          </TouchableOpacity>
        )}

        {activeTab === 'members' && onNewMember && (
          <TouchableOpacity
            style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
            onPress={onNewMember}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add" size={17} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>+ Add Member</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContainer: {
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  versionTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  versionText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
