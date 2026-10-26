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
  subtitle = 'SRM Student Chapter • Attendance System',
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
        {/* HackerRank Icon Mark */}
        <View style={[styles.logoBadge, { backgroundColor: isDark ? '#05C770' : '#049D57' }]}>
          <Text style={styles.logoBadgeText}>H</Text>
        </View>

        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText} numberOfLines={1}>
              <Text style={{ color: colors.text }}>HackerRank </Text>
              <Text style={{ color: colors.brandGreen }}>CampusCrew</Text>
            </Text>
            <View
              style={[
                styles.versionTag,
                {
                  backgroundColor: colors.primaryLight,
                  borderColor: isDark ? 'rgba(5, 199, 112, 0.3)' : '#A7F3D0',
                },
              ]}
            >
              <Text
                style={[
                  styles.versionText,
                  { color: isDark ? colors.brandGreen : '#047857' },
                ]}
              >
                SRM
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
              backgroundColor: isDark ? '#161E19' : '#F1F5F9',
              borderColor: isDark ? '#26362C' : '#E2E8F0',
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
            color={isDark ? '#05C770' : '#475569'}
          />
        </TouchableOpacity>

        {/* Desktop / Tablet Quick Actions */}
        {activeTab === 'meetings' && onNewMeeting && (
          <TouchableOpacity
            style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
            onPress={onNewMeeting}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={17} color={isDark ? '#070707' : '#FFFFFF'} />
            <Text
              style={[
                styles.primaryActionText,
                { color: isDark ? '#070707' : '#FFFFFF' },
              ]}
            >
              + New Meeting
            </Text>
          </TouchableOpacity>
        )}

        {activeTab === 'members' && onNewMember && (
          <TouchableOpacity
            style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
            onPress={onNewMember}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add" size={17} color={isDark ? '#070707' : '#FFFFFF'} />
            <Text
              style={[
                styles.primaryActionText,
                { color: isDark ? '#070707' : '#FFFFFF' },
              ]}
            >
              + Add Member
            </Text>
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
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#05C770',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  logoBadgeText: {
    color: '#070707',
    fontWeight: '900',
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'sans-serif-black',
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
  titleText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  versionTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  versionText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
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
    shadowColor: '#05C770',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
