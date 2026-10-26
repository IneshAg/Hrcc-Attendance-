import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      label: 'Club Members',
      iconActive: 'people' as const,
      iconInactive: 'people-outline' as const,
      badge: membersCount,
    },
    {
      key: 'analytics' as TabKey,
      label: 'Reports & Stats',
      iconActive: 'bar-chart' as const,
      iconInactive: 'bar-chart-outline' as const,
      badge: null,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBarInner}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={isActive ? tab.iconActive : tab.iconInactive}
                  size={20}
                  color={isActive ? '#4F46E5' : '#64748B'}
                />
                {tab.badge !== null && (
                  <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                    <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
                      {tab.badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBarInner: {
    flexDirection: 'row',
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    position: 'relative',
  },
  activeTabButton: {
    backgroundColor: '#FAFAFF',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabLabel: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: '#EEF2FF',
  },
  badgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#4F46E5',
  },
  badgeTextInactive: {
    color: '#64748B',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: '#4F46E5',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});
