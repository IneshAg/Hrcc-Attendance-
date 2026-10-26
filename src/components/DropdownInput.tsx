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
  isOpen?: boolean;
  onToggle?: () => void;
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
  isOpen: controlledIsOpen,
  onToggle,
}) => {
  const { isDark, colors } = useTheme();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isMenuOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const toggleMenu = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const closeMenu = () => {
    if (onToggle && controlledIsOpen) {
      onToggle();
    } else {
      setInternalIsOpen(false);
    }
  };

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
    closeMenu();
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
            borderColor: error ? colors.danger : isMenuOpen ? colors.brandGreen : colors.inputBorder,
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
              backgroundColor: isDark ? 'rgba(5, 199, 112, 0.12)' : '#ECFDF5',
            },
          ]}
          onPress={toggleMenu}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={`Toggle options for ${label}`}
        >
          <Ionicons
            name={isMenuOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={isDark ? colors.brandGreen : colors.primary}
          />
        </TouchableOpacity>
      </View>

      {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}

      {/* Dropdown Options Collapsible Menu */}
      {isMenuOpen && (
        <View
          style={[
            styles.dropdownMenu,
            {
              backgroundColor: isDark ? '#111613' : '#FFFFFF',
              borderColor: isDark ? '#1F2E24' : '#E2E8F0',
            },
          ]}
        >
          <View style={[styles.dropdownHeader, { borderBottomColor: isDark ? '#1F2E24' : '#E2E8F0' }]}>
            <Text style={[styles.dropdownHeaderTitle, { color: colors.textMuted }]}>
              Tap to choose or type custom value
            </Text>
            <TouchableOpacity onPress={closeMenu} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
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
                          fontWeight: isSelected ? '800' : '600',
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
                      size={18}
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
    marginBottom: 12,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 11,
    fontWeight: '600',
  },
  required: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 6,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  chevronBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 11,
    marginTop: 3,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 100,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  dropdownHeaderTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  dropdownDoneText: {
    fontSize: 12,
    fontWeight: '800',
  },
  optionsScroll: {
    maxHeight: 200,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  optionTextCol: {
    flex: 1,
    marginRight: 8,
  },
  optionLabel: {
    fontSize: 13,
  },
  optionHint: {
    fontSize: 11,
    marginTop: 2,
  },
});
