import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export type TabKey = 'meetings' | 'members' | 'analytics';

interface TabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  meetingsCount: number;
  membersCount: number;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabChange,
  meetingsCount,
  membersCount,
}) => {
  const { isDark, colors } = useTheme();

  const tabs = [
    {
      key: 'meetings' as TabKey,
      label: 'Meetings',
      iconActive: 'calendar' as const,
      iconInactive: 'calendar-outline' as const,
      badge: meetingsCount,
    },
    {
      key: 'members' as TabKey,
      label: 'Members',
      iconActive: 'people' as const,
      iconInactive: 'people-outline' as const,
      badge: membersCount,
    },
    {
      key: 'analytics' as TabKey,
      label: 'Reports',
      iconActive: 'bar-chart' as const,
      iconInactive: 'bar-chart-outline' as const,
      badge: null,
    },
  ];

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
      <View style={styles.tabBarInner}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                isActive && {
                  backgroundColor: isDark ? 'rgba(5, 199, 112, 0.12)' : '#ECFDF5',
                },
              ]}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={isActive ? tab.iconActive : tab.iconInactive}
                    size={18}
                    color={isActive ? colors.brandGreen : colors.textMuted}
                  />
                  {tab.badge !== null && (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: isActive
                            ? colors.brandGreen
                            : isDark
                            ? '#1F2E24'
                            : '#E2E8F0',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color: isActive
                              ? isDark
                                ? '#070707'
                                : '#FFFFFF'
                              : isDark
                              ? '#99A1AF'
                              : '#475569',
                          },
                        ]}
                      >
                        {tab.badge}
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? (isDark ? colors.brandGreen : colors.primary) : colors.textMuted },
                    isActive && styles.activeTabLabel,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </View>

              {isActive && (
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: colors.brandGreen },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  tabBarInner: {
    flexDirection: 'row',
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 3,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabLabel: {
    fontWeight: '700',
  },
  badge: {
    marginLeft: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    left: 8,
    right: 8,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});
