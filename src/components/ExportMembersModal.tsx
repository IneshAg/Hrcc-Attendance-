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
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.modalTitle}>Extract & Export Members</Text>
              <Text style={styles.modalSubtitle}>
                Copy roster text for WhatsApp, download as formatted .txt, or export as CSV
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Success Banner */}
          {downloadSuccess && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.successBannerText}>{downloadSuccess}</Text>
            </View>
          )}

          {/* Export Action Quick Buttons */}
          <View style={styles.exportActionsRow}>
            {/* 1. Copy for WhatsApp Button */}
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.copyActionBtn]}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy'}
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.copyActionBtnText}>
                {copied ? 'Copied to Clipboard!' : 'Copy for WhatsApp'}
              </Text>
            </TouchableOpacity>

            {/* 2. Download .TXT Button */}
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.txtActionBtn]}
              onPress={handleDownloadTxt}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text" size={16} color="#2563EB" />
              <Text style={styles.txtActionBtnText}>Download .TXT</Text>
            </TouchableOpacity>

            {/* 3. Download .CSV Button */}
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.csvActionBtn]}
              onPress={handleDownloadCsv}
              activeOpacity={0.8}
            >
              <Ionicons name="grid" size={16} color="#059669" />
              <Text style={styles.csvActionBtnText}>Download .CSV</Text>
            </TouchableOpacity>
          </View>

          {/* Format Selector Tabs */}
          <View style={styles.tabsContainer}>
            <Text style={styles.previewLabel}>Select Text Format to Preview:</Text>
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabBtn, formatType === 'whatsapp' && styles.tabBtnActive]}
                onPress={() => setFormatType('whatsapp')}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={14}
                  color={formatType === 'whatsapp' ? '#25D366' : '#64748B'}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    formatType === 'whatsapp' && styles.tabBtnTextActive,
                  ]}
                >
                  WhatsApp Roster
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, formatType === 'report' && styles.tabBtnActive]}
                onPress={() => setFormatType('report')}
              >
                <Ionicons
                  name="document-text-outline"
                  size={14}
                  color={formatType === 'report' ? '#2563EB' : '#64748B'}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    formatType === 'report' && styles.tabBtnTextActive,
                  ]}
                >
                  Full Text Report
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, formatType === 'keyvalue' && styles.tabBtnActive]}
                onPress={() => setFormatType('keyvalue')}
              >
                <Ionicons
                  name="code-working-outline"
                  size={14}
                  color={formatType === 'keyvalue' ? '#7C3AED' : '#64748B'}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    formatType === 'keyvalue' && styles.tabBtnTextActive,
                  ]}
                >
                  Key-Value Text
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Text Preview Box */}
          <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={true}>
            <View style={styles.previewCard}>
              <Text style={styles.previewText} selectable={true}>
                {currentText}
              </Text>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <Text style={styles.footerMemberCount}>
              Showing all {members.length} members in hierarchy order
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Done</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 10,
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
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
    minWidth: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  copyActionBtn: {
    backgroundColor: '#0F172A',
  },
  copyActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  txtActionBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  txtActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  csvActionBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  csvActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  tabsContainer: {
    marginTop: 12,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  previewScroll: {
    marginTop: 10,
    maxHeight: 280,
  },
  previewCard: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 14,
  },
  previewText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 10,
  },
  footerMemberCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  doneBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
});
