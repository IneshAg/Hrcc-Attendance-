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
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleCol}>
              <Text style={styles.modalTitle}>Bulk Import / Update Members</Text>
              <Text style={styles.modalSubtitle}>
                Paste names, copy-paste columns from Excel/Sheets, or upload a CSV file
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {step === 'input' ? (
            <View style={styles.contentBody}>
              {/* Instructions */}
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle-outline" size={18} color="#4F46E5" />
                <Text style={styles.infoBannerText}>
                  Paste structured text blocks (Name: ..., Reg.No: ...), simple name lists, or copy columns directly from Excel/Sheets. Existing members will automatically have their columns updated!
                </Text>
              </View>

              {/* Paste Text Area */}
              <Text style={styles.inputLabel}>Paste Text, Key-Value Details, Excel Rows, or CSV:</Text>
              <TextInput
                style={styles.textArea}
                multiline
                placeholder={`Examples:\n1. Structured Text Blocks (Auto-Updates Existing):\nName: Purva Jain\nReg.No: RA2411003010099\nSRM email: pj1234@srmist.edu.in\nPersonal Email: purva@gmail.com\nPursuing Branch: B.Tech CSE\nDepartment: Computing\nFA name: Dr Vinod D\n\n2. Simple Names:\nPurva Jain - Vice President\nInesh Agarwal - Tech Head\n\n3. Or CSV / Excel Rows:\nName, Reg.No, SRM Email, Branch, Department, FA Name, Domain, Role`}
                value={inputText}
                onChangeText={setInputText}
                placeholderTextColor="#94A3B8"
              />

              {/* Web File Input Shortcut */}
              {Platform.OS === 'web' && (
                <View style={styles.fileUploadRow}>
                  <Text style={styles.fileUploadLabel}>Or upload a .CSV file:</Text>
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleFileUploadWeb}
                    style={{ fontSize: 13 }}
                  />
                </View>
              )}

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, !inputText.trim() && styles.primaryBtnDisabled]}
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
                <View style={styles.badgeNew}>
                  <Text style={styles.badgeNewText}>🆕 {newMembersCount} New to Insert</Text>
                </View>
                <View style={styles.badgeUpdate}>
                  <Text style={styles.badgeUpdateText}>
                    🔄 {updateMembersCount} Existing to Update
                  </Text>
                </View>
                <Text style={styles.totalRowsText}>Total: {parsedRows.length}</Text>
              </View>

              {/* Parsed List Preview */}
              <ScrollView style={styles.previewListScroll} showsVerticalScrollIndicator={true}>
                {parsedRows.map((row, idx) => (
                  <View key={idx} style={styles.previewRowCard}>
                    <View style={styles.previewRowHeader}>
                      <View style={styles.previewNameGroup}>
                        <Text style={styles.previewMemberName}>{row.name}</Text>
                        {row.raNo ? (
                          <View style={styles.raPill}>
                            <Text style={styles.raPillText}>{row.raNo}</Text>
                          </View>
                        ) : null}
                      </View>

                      <View
                        style={[
                          styles.actionPill,
                          row.isExisting ? styles.actionPillUpdate : styles.actionPillNew,
                        ]}
                      >
                        <Text
                          style={[
                            styles.actionPillText,
                            row.isExisting
                              ? styles.actionPillTextUpdate
                              : styles.actionPillTextNew,
                          ]}
                        >
                          {row.isExisting ? 'Update' : 'New'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.previewMetaRow}>
                      <Text style={styles.previewMetaItem}>
                        {row.domain && row.domain !== 'None' ? `${row.domain} • ` : ''}
                        {row.role || 'Member'}
                      </Text>
                      {row.branch ? (
                        <Text style={styles.previewMetaItem}>• {row.branch}</Text>
                      ) : null}
                      {row.faName ? (
                        <Text style={styles.previewMetaItem}>• FA: {row.faName}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setStep('input')}
                  disabled={isProcessing}
                >
                  <Text style={styles.cancelText}>Back to Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, isProcessing && styles.primaryBtnDisabled]}
                  onPress={handleConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload" size={17} color="#FFFFFF" />
                      <Text style={styles.primaryBtnText}>
                        Confirm & Save to Supabase ({parsedRows.length})
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
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
  headerTitleCol: {
    flex: 1,
    marginRight: 8,
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
  contentBody: {
    marginTop: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 12,
  },
  infoBannerText: {
    fontSize: 12,
    color: '#3730A3',
    lineHeight: 16,
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 160,
    maxHeight: 240,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  fileUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  fileUploadLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  previewStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  badgeNew: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeNewText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  badgeUpdate: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeUpdateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  totalRowsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 'auto',
  },
  previewListScroll: {
    maxHeight: 280,
  },
  previewRowCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  raPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  raPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  actionPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionPillNew: {
    backgroundColor: '#ECFDF5',
  },
  actionPillUpdate: {
    backgroundColor: '#EFF6FF',
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionPillTextNew: {
    color: '#059669',
  },
  actionPillTextUpdate: {
    color: '#2563EB',
  },
  previewMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  previewMetaItem: {
    fontSize: 11,
    color: '#64748B',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
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
