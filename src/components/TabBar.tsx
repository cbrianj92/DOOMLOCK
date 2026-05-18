import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../constants';

export type Tab = 'practice' | 'progress' | 'settings';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TabBar: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'practice' && styles.tabActive]}
        onPress={() => onTabChange('practice')}
        activeOpacity={0.7}>
        <Text style={[styles.label, activeTab === 'practice' && styles.labelActive]}>
          Practice
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'progress' && styles.tabActive]}
        onPress={() => onTabChange('progress')}
        activeOpacity={0.7}>
        <Text style={[styles.label, activeTab === 'progress' && styles.labelActive]}>
          Progress
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
        onPress={() => onTabChange('settings')}
        activeOpacity={0.7}>
        <Text style={[styles.label, activeTab === 'settings' && styles.labelActive]}>
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.xs,
  },
  tabActive: {
    backgroundColor: 'rgba(26, 58, 92, 0.07)',
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textLight,
  },
  labelActive: {
    color: Colors.primary,
  },
});

export default TabBar;
