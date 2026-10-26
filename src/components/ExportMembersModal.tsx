import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClubMember } from '../types';
import {
  generateMembersListCSV,
  generateMembersWhatsAppText,
  generateMembersListText,
  generateMembersKeyValueText,
  downloadFile,
} from '../utils/exportUtils';
import { sortMembersByHierarchy } from '../utils/roleUtils';
import { useTheme } from '../context/ThemeContext';

interface ExportMembersModalProps {
  visible: boolean;
  members: ClubMember[];
  onClose: () => void;
}

type TextFormatType = 'whatsapp' | 'report' | 'keyvalue';

export const ExportMembersModal: React.FC<ExportMembersModalProps> = ({
  visible,
  members,
  onClose,
}) => {
  const { isDark, colors } = useTheme();
  const [formatType, setFormatType] = useState<TextFormatType>('whatsapp');
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const sortedMembers = sortMembersByHierarchy(members);

  const getPreviewText = () => {
    if (formatType === 'whatsapp') {
      return generateMembersWhatsAppText(sortedMembers);
    }
    if (formatType === 'report') {
      return generateMembersListText(sortedMembers);
    }
    return generateMembersKeyValueText(sortedMembers);
  };

  const currentText = getPreviewText();

  // Copy to Clipboard (WhatsApp, Slack, notes)
  const handleCopy = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(currentText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  };

  // Download as .TXT file
  const handleDownloadTxt = async () => {
    const filename = `hrcc_members_roster_${new Date().toISOString().split('T')[0]}.txt`;
    const success = await downloadFile(filename, currentText, 'text/plain;charset=utf-8;');
    if (success) {
      setDownloadSuccess('Text file downloaded successfully!');
      setTimeout(() => setDownloadSuccess(null), 3000);
    }
  };

  // Download as .CSV file
  const handleDownloadCsv = async () => {
    const csv = generateMembersListCSV(sortedMembers);
    const filename = `hrcc_members_directory_${new Date().toISOString().split('T')[0]}.csv`;
    const success = await downloadFile(filename, csv, 'text/csv;charset=utf-8;');
    if (success) {
      setDownloadSuccess('CSV spreadsheet downloaded successfully!');
      setTimeout(() => setDownloadSuccess(null), 3000);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.cardBorder }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Extract & Export Members</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Copy roster text for WhatsApp, download as formatted .txt, or export as CSV
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Success Banner */}
          {downloadSuccess && (
            <View
              style={[
                styles.successBanner,
                {
                  backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
                  borderColor: isDark ? '#047857' : '#A7F3D0',
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.successBannerText, { color: colors.success }]}>
                {downloadSuccess}
              </Text>
            </View>
          )}

          {/* Export Action Quick Buttons */}
          <View style={styles.exportActionsRow}>
            {/* 1. Copy for WhatsApp Button */}
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy'}
                size={15}
                color={isDark ? '#070707' : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.copyActionBtnText,
                  { color: isDark ? '#070707' : '#FFFFFF', fontWeight: '800' },
                ]}
              >
                {copied ? 'Copied!' : 'Copy for WhatsApp'}
              </Text>
            </TouchableOpacity>

            {/* 2. Download .TXT Button */}
            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                  borderColor: isDark ? '#3B82F6' : '#BFDBFE',
                  borderWidth: 1,
                },
              ]}
              onPress={handleDownloadTxt}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text" size={15} color={isDark ? '#60A5FA' : '#1D4ED8'} />
              <Text style={[styles.txtActionBtnText, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>
                Download .TXT
              </Text>
            </TouchableOpacity>

            {/* 3. Download .CSV Button */}
            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#ECFDF5',
                  borderColor: isDark ? '#047857' : '#A7F3D0',
                  borderWidth: 1,
                },
              ]}
              onPress={handleDownloadCsv}
              activeOpacity={0.8}
            >
              <Ionicons name="grid" size={15} color={isDark ? '#34D399' : '#047857'} />
              <Text style={[styles.csvActionBtnText, { color: isDark ? '#34D399' : '#047857' }]}>
                Download .CSV
              </Text>
            </TouchableOpacity>
          </View>

          {/* Format Selector Tabs */}
          <View style={styles.tabsContainer}>
            <Text style={[styles.previewLabel, { color: colors.textMuted }]}>
              Select Text Format to Preview:
            </Text>
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor:
                      formatType === 'whatsapp'
                        ? isDark
                          ? '#232946'
                          : '#EEF2FF'
                        : isDark
                        ? '#1E293B'
                        : '#F8FAFC',
                    borderColor:
                      formatType === 'whatsapp'
                        ? colors.primary
                        : colors.cardBorder,
                  },
                ]}
                onPress={() => setFormatType('whatsapp')}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={14}
                  color={formatType === 'whatsapp' ? '#22C55E' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    {
                      color:
                        formatType === 'whatsapp'
                          ? colors.primary
                          : colors.textSecondary,
                    },
                    formatType === 'whatsapp' && styles.tabBtnTextActive,
                  ]}
                >
                  WhatsApp Roster
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor:
                      formatType === 'report'
                        ? isDark
                          ? '#232946'
                          : '#EEF2FF'
                        : isDark
                        ? '#1E293B'
                        : '#F8FAFC',
                    borderColor:
                      formatType === 'report'
                        ? colors.primary
                        : colors.cardBorder,
                  },
                ]}
                onPress={() => setFormatType('report')}
              >
                <Ionicons
                  name="document-text-outline"
                  size={14}
                  color={formatType === 'report' ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    {
                      color:
                        formatType === 'report'
                          ? colors.primary
                          : colors.textSecondary,
                    },
                    formatType === 'report' && styles.tabBtnTextActive,
                  ]}
                >
                  Full Text Report
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor:
                      formatType === 'keyvalue'
                        ? isDark
                          ? '#232946'
                          : '#EEF2FF'
                        : isDark
                        ? '#1E293B'
                        : '#F8FAFC',
                    borderColor:
                      formatType === 'keyvalue'
                        ? colors.primary
                        : colors.cardBorder,
                  },
                ]}
                onPress={() => setFormatType('keyvalue')}
              >
                <Ionicons
                  name="code-slash"
                  size={14}
                  color={formatType === 'keyvalue' ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    {
                      color:
                        formatType === 'keyvalue'
                          ? colors.primary
                          : colors.textSecondary,
                    },
                    formatType === 'keyvalue' && styles.tabBtnTextActive,
                  ]}
                >
                  Key-Value Text
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Text Live Preview Box */}
          <View
            style={[
              styles.previewContainer,
              {
                backgroundColor: isDark ? '#0B0F17' : '#F8FAFC',
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={true}>
              <Text
                style={[
                  styles.previewText,
                  {
                    color: colors.text,
                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  },
                ]}
                selectable={true}
              >
                {currentText}
              </Text>
            </ScrollView>
          </View>

          {/* Footer Bar */}
          <View style={[styles.modalFooter, { borderTopColor: colors.cardBorder }]}>
            <View style={styles.countBadge}>
              <Text style={[styles.countBadgeText, { color: colors.textMuted }]}>
                {sortedMembers.length} members formatted
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.dismissBtn,
                { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.dismissBtnText, { color: colors.textSecondary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '92%',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  exportActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  primaryActionBtn: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  copyActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  txtActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  csvActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabsContainer: {
    marginTop: 10,
  },
  previewLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    fontWeight: '700',
  },
  previewContainer: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 10,
    padding: 10,
    minHeight: 180,
    maxHeight: 260,
  },
  previewScroll: {
    flex: 1,
  },
  previewText: {
    fontSize: 11.5,
    lineHeight: 17,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 10,
    borderTopWidth: 1,
  },
  countBadge: {},
  countBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  dismissBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  dismissBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
