import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClubMember } from '../types';
import { parseBulkMembersText, ParsedMemberRow } from '../utils/csvParser';
import { useTheme } from '../context/ThemeContext';

interface BulkImportModalProps {
  visible: boolean;
  existingMembers: ClubMember[];
  onClose: () => void;
  onConfirmImport: (rows: ParsedMemberRow[]) => Promise<void>;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  visible,
  existingMembers,
  onClose,
  onConfirmImport,
}) => {
  const { isDark, colors } = useTheme();
  const [inputText, setInputText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedMemberRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  const handleParse = () => {
    if (!inputText.trim()) return;
    const parsed = parseBulkMembersText(inputText, existingMembers);
    setParsedRows(parsed);
    setStep('preview');
  };

  const handleFileUploadWeb = (event: any) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setInputText(content);
        const parsed = parseBulkMembersText(content, existingMembers);
        setParsedRows(parsed);
        setStep('preview');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirm = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    try {
      await onConfirmImport(parsedRows);
      // Reset
      setInputText('');
      setParsedRows([]);
      setStep('input');
      onClose();
    } catch (err) {
      console.error('Bulk import error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const newMembersCount = parsedRows.filter((r) => !r.isExisting).length;
  const updateMembersCount = parsedRows.filter((r) => r.isExisting).length;

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
            <View style={styles.headerTitleCol}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Bulk Import / Update Members</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Paste text blocks, copy-paste columns from Excel/Sheets, or upload a CSV file
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {step === 'input' ? (
            <View style={styles.contentBody}>
              {/* Instructions */}
              <View
                style={[
                  styles.infoBanner,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#EEF2FF',
                    borderColor: isDark ? '#334155' : '#C7D2FE',
                  },
                ]}
              >
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.infoBannerText, { color: isDark ? '#CBD5E1' : '#3730A3' }]}>
                  Paste structured text blocks (Name: ..., Reg.No: ...), simple name lists, or copy columns directly from Excel/Sheets. Existing members will automatically have their columns updated!
                </Text>
              </View>

              {/* Paste Text Area */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Paste Text, Key-Value Details, Excel Rows, or CSV:
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                multiline
                placeholder={`Examples:\n1. Structured Text Blocks (Auto-Updates Existing):\nName: Purva Jain\nReg.No: RA2411003010099\nSRM email: pj1234@srmist.edu.in\nPursuing Branch: B.Tech CSE\n\n2. Simple Names:\nPurva Jain - Vice President\nInesh Agarwal - Tech Head\n\n3. Or CSV / Excel Rows:\nName, Reg.No, SRM Email, Branch, Department, Domain, Role`}
                value={inputText}
                onChangeText={setInputText}
                placeholderTextColor={colors.textMuted}
              />

              {/* Web File Input Shortcut */}
              {Platform.OS === 'web' && (
                <View style={styles.fileUploadRow}>
                  <Text style={[styles.fileUploadLabel, { color: colors.textSecondary }]}>
                    Or upload a .CSV file:
                  </Text>
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleFileUploadWeb}
                    style={{ fontSize: 13, color: colors.text }}
                  />
                </View>
              )}

              {/* Modal Actions */}
              <View style={[styles.modalActions, { borderTopColor: colors.cardBorder }]}>
                <TouchableOpacity
                  style={[
                    styles.cancelBtn,
                    { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                  ]}
                  onPress={onClose}
                >
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: colors.primary },
                    !inputText.trim() && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleParse}
                  disabled={!inputText.trim()}
                >
                  <Ionicons name="eye-outline" size={17} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Parse & Preview</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.contentBody}>
              {/* Preview Stats Bar */}
              <View style={styles.previewStatsBar}>
                <View
                  style={[
                    styles.badgeNew,
                    {
                      backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
                      borderColor: isDark ? '#047857' : '#A7F3D0',
                    },
                  ]}
                >
                  <Text style={[styles.badgeNewText, { color: isDark ? '#34D399' : '#047857' }]}>
                    🆕 {newMembersCount} New
                  </Text>
                </View>
                <View
                  style={[
                    styles.badgeUpdate,
                    {
                      backgroundColor: isDark ? '#1E3A8A' : '#EFF6FF',
                      borderColor: isDark ? '#2563EB' : '#BFDBFE',
                    },
                  ]}
                >
                  <Text style={[styles.badgeUpdateText, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>
                    🔄 {updateMembersCount} Existing to Update
                  </Text>
                </View>
                <Text style={[styles.totalRowsText, { color: colors.textMuted }]}>
                  Total: {parsedRows.length}
                </Text>
              </View>

              {/* Parsed List Preview */}
              <ScrollView style={styles.previewListScroll} showsVerticalScrollIndicator={true}>
                {parsedRows.map((row, index) => (
                  <View
                    key={index}
                    style={[
                      styles.previewRowCard,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <View style={styles.previewRowHeader}>
                      <View style={styles.previewNameGroup}>
                        <Text style={[styles.previewMemberName, { color: colors.text }]}>
                          {index + 1}. {row.name}
                        </Text>
                        {row.raNo ? (
                          <View
                            style={[
                              styles.raPill,
                              { backgroundColor: isDark ? '#111827' : '#F1F5F9' },
                            ]}
                          >
                            <Text style={[styles.raPillText, { color: colors.primary }]}>{row.raNo}</Text>
                          </View>
                        ) : null}
                      </View>

                      <View
                        style={[
                          styles.actionPill,
                          row.isExisting
                            ? { backgroundColor: isDark ? '#1E3A8A' : '#EFF6FF' }
                            : { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.actionPillText,
                            row.isExisting
                              ? { color: isDark ? '#60A5FA' : '#2563EB' }
                              : { color: isDark ? '#34D399' : '#059669' },
                          ]}
                        >
                          {row.isExisting ? 'Update' : 'New'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.previewMetaRow}>
                      <Text style={[styles.previewMetaItem, { color: colors.textSecondary }]}>
                        Role: {row.role || 'Member'}
                      </Text>
                      <Text style={[styles.previewMetaItem, { color: colors.textSecondary }]}>
                        Domain: {row.domain || 'Technical'}
                      </Text>
                      {row.branch && (
                        <Text style={[styles.previewMetaItem, { color: colors.textSecondary }]}>
                          Branch: {row.branch}
                        </Text>
                      )}
                      {row.srmEmail && (
                        <Text style={[styles.previewMetaItem, { color: colors.textSecondary }]}>
                          Email: {row.srmEmail}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Action Buttons */}
              <View style={[styles.modalActions, { borderTopColor: colors.cardBorder }]}>
                <TouchableOpacity
                  style={[
                    styles.cancelBtn,
                    { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                  ]}
                  onPress={() => setStep('input')}
                  disabled={isProcessing}
                >
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Back to Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: colors.success },
                    isProcessing && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload" size={17} color="#FFFFFF" />
                      <Text style={styles.primaryBtnText}>
                        Confirm & Import ({parsedRows.length})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    maxWidth: 620,
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
  headerTitleCol: {
    flex: 1,
    marginRight: 8,
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
  contentBody: {
    marginTop: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  textArea: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    minHeight: 150,
    maxHeight: 220,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  fileUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  fileUploadLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  badgeNew: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeNewText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeUpdate: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeUpdateText: {
    fontSize: 11,
    fontWeight: '700',
  },
  totalRowsText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  previewListScroll: {
    maxHeight: 280,
  },
  previewRowCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 9,
    marginBottom: 6,
  },
  previewRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  previewMemberName: {
    fontSize: 13,
    fontWeight: '700',
  },
  raPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  raPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  actionPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  previewMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  previewMetaItem: {
    fontSize: 11,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
