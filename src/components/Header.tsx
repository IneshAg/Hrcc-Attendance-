import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onNewMeeting?: () => void;
  onNewMember?: () => void;
  activeTab: 'meetings' | 'members' | 'analytics';
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  subtitle = 'SRM Student Chapter • Attendance System',
  onNewMeeting,
  onNewMember,
  activeTab,
  onRefresh,
  isRefreshing = false,
}) => {
  const { isDark, colors, toggleTheme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isNarrow = windowWidth < 580;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.cardBorder,
          paddingHorizontal: isNarrow ? 12 : 16,
        },
      ]}
    >
      <View style={styles.brandRow}>
        {/* Official HRCC Logo */}
        <View
          style={[
            styles.logoBadge,
            {
              backgroundColor: isDark ? '#111613' : '#F1F5F9',
              borderColor: isDark ? '#1F2E24' : '#E2E8F0',
              borderWidth: 1,
              width: isNarrow ? 34 : 38,
              height: isNarrow ? 34 : 38,
            },
          ]}
        >
          <Image
            source={require('../../assets/hrcc-logo.png')}
            style={{
              width: isNarrow ? 22 : 25,
              height: isNarrow ? 22 : 25,
            }}
            resizeMode="contain"
          />
        </View>

        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.titleText, isNarrow && { fontSize: 15 }]} numberOfLines={1}>
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
          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary },
              isNarrow && { fontSize: 10.5 },
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={[styles.actionsRow, isNarrow && { gap: 6 }]}>
        {/* Sync / Refresh Cloud Data Button */}
        {onRefresh && (
          <TouchableOpacity
            style={[
              styles.themeToggleBtn,
              {
                backgroundColor: isDark ? '#161E19' : '#ECFDF5',
                borderColor: isDark ? '#26362C' : '#A7F3D0',
                width: isNarrow ? 32 : 36,
                height: isNarrow ? 32 : 36,
              },
            ]}
            onPress={onRefresh}
            activeOpacity={0.7}
            accessibilityLabel="Refresh Data from Cloud"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isRefreshing ? 'sync' : 'refresh'}
              size={isNarrow ? 15 : 17}
              color={isDark ? colors.brandGreen : colors.primary}
            />
          </TouchableOpacity>
        )}

        {/* Dark / Light Mode Toggle Button */}
        <TouchableOpacity
          style={[
            styles.themeToggleBtn,
            {
              backgroundColor: isDark ? '#161E19' : '#F1F5F9',
              borderColor: isDark ? '#26362C' : '#E2E8F0',
              width: isNarrow ? 32 : 36,
              height: isNarrow ? 32 : 36,
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.7}
          accessibilityLabel={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={isNarrow ? 16 : 18}
            color={isDark ? '#05C770' : '#475569'}
          />
        </TouchableOpacity>

        {/* Quick Actions (Add Meeting / Add Member) - Only displayed on desktop/tablets (>=580px) to prevent title truncation on mobile */}
        {!isNarrow && activeTab === 'meetings' && onNewMeeting && (
          <TouchableOpacity
            style={[
              styles.primaryActionButton,
              {
                backgroundColor: colors.primary,
                paddingHorizontal: 13,
                height: 36,
              },
            ]}
            onPress={onNewMeeting}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={17} color={isDark ? '#070707' : '#FFFFFF'} />
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

        {!isNarrow && activeTab === 'members' && onNewMember && (
          <TouchableOpacity
            style={[
              styles.primaryActionButton,
              {
                backgroundColor: colors.primary,
                paddingHorizontal: 13,
                height: 36,
              },
            ]}
            onPress={onNewMember}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add" size={14} color={isDark ? '#070707' : '#FFFFFF'} />
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
    paddingTop: Platform.OS === 'ios' ? 12 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  logoBadge: {
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
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  versionTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  versionText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleBtn: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
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
