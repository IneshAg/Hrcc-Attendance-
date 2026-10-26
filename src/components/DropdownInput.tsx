import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface DropdownInputProps {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (val: string) => void;
  options: { label: string; value: string; hint?: string }[] | string[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  onSelectOption?: (val: string) => void;
}

export const DropdownInput: React.FC<DropdownInputProps> = ({
  label,
  required,
  value,
  onChangeText,
  options,
  placeholder,
  error,
  helperText,
  autoCapitalize = 'words',
  onSelectOption,
}) => {
  const { isDark, colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Normalize options to object format
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt };
    }
    return opt;
  });

  const handleSelect = (val: string) => {
    onChangeText(val);
    if (onSelectOption) {
      onSelectOption(val);
    }
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        {helperText ? (
          <Text style={[styles.helperText, { color: colors.brandGreen }]}>{helperText}</Text>
        ) : null}
      </View>

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.inputBg,
            borderColor: error ? colors.danger : isOpen ? colors.brandGreen : colors.inputBorder,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize={autoCapitalize}
        />

        <TouchableOpacity
          style={[
            styles.chevronBtn,
            {
              backgroundColor: isDark ? 'rgba(5, 199, 112, 0.1)' : '#ECFDF5',
            },
          ]}
          onPress={() => setIsOpen(!isOpen)}
          activeOpacity={0.7}
          accessibilityLabel={`Toggle options for ${label}`}
        >
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={isDark ? colors.brandGreen : colors.primary}
          />
        </TouchableOpacity>
      </View>

      {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}

      {/* Dropdown Options Collapsible Menu */}
      {isOpen && (
        <View
          style={[
            styles.dropdownMenu,
            {
              backgroundColor: isDark ? '#111613' : '#FFFFFF',
              borderColor: isDark ? '#1F2E24' : '#E2E8F0',
            },
          ]}
        >
          <View style={[styles.dropdownHeader, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.dropdownHeaderTitle, { color: colors.textMuted }]}>
              Select option or type custom above
            </Text>
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Text style={[styles.dropdownDoneText, { color: colors.brandGreen }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.optionsScroll}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            {normalizedOptions.map((opt) => {
              const isSelected = value.toLowerCase().trim() === opt.value.toLowerCase().trim();
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.optionItem,
                    isSelected && {
                      backgroundColor: isDark ? 'rgba(5, 199, 112, 0.12)' : '#ECFDF5',
                    },
                  ]}
                  onPress={() => handleSelect(opt.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionTextCol}>
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          color: isSelected
                            ? (isDark ? colors.brandGreen : colors.primary)
                            : colors.text,
                          fontWeight: isSelected ? '800' : '500',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {opt.hint ? (
                      <Text style={[styles.optionHint, { color: colors.textMuted }]}>
                        {opt.hint}
                      </Text>
                    ) : null}
                  </View>

                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={17}
                      color={isDark ? colors.brandGreen : colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 11,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  required: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 6,
    height: 38,
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  chevronBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 11,
    marginTop: 2,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  dropdownHeaderTitle: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  dropdownDoneText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  optionsScroll: {
    maxHeight: 180,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionTextCol: {
    flex: 1,
    marginRight: 8,
  },
  optionLabel: {
    fontSize: 12.5,
  },
  optionHint: {
    fontSize: 10.5,
    marginTop: 1,
  },
});
