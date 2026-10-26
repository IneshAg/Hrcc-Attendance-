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
import { Meeting, AttendanceRecord, ClubMember } from '../types';
import { calculateMeetingSummary } from '../storage/storage';
import {
  generateMeetingCSV,
  generateMeetingText,
  downloadFile,
} from '../utils/exportUtils';

interface ShareModalProps {
  visible: boolean;
  meeting: Meeting | null;
  attendance: AttendanceRecord | null;
  members: ClubMember[];
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  meeting,
  attendance,
  members,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!meeting) return null;

  const summary = calculateMeetingSummary(attendance, members.length);
  const statuses = attendance?.statuses || {};
  const notes = attendance?.notes || {};

  const presentList = members.filter((m) => statuses[m.id] === 'present');
  const lateList = members.filter((m) => statuses[m.id] === 'late');
  const absentList = members.filter((m) => statuses[m.id] === 'absent');
  const excusedList = members.filter((m) => statuses[m.id] === 'excused');

  const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  };

  // Export as CSV
  const handleExportCSV = async () => {
    const csv = generateMeetingCSV(meeting, members, attendance);
    const filename = `${sanitizeFilename(meeting.title)}_${meeting.date}_attendance.csv`;
    const success = await downloadFile(filename, csv, 'text/csv;charset=utf-8;');
    if (success) {
      setDownloadSuccess('CSV downloaded successfully!');
      setTimeout(() => setDownloadSuccess(null), 3000);
    }
  };

  // Export as TXT
  const handleExportTextFile = async () => {
    const text = generateMeetingText(meeting, members, attendance);
    const filename = `${sanitizeFilename(meeting.title)}_${meeting.date}_attendance.txt`;
    const success = await downloadFile(filename, text, 'text/plain;charset=utf-8;');
    if (success) {
      setDownloadSuccess('Text file downloaded successfully!');
      setTimeout(() => setDownloadSuccess(null), 3000);
    }
  };

  // Copy to Clipboard (for WhatsApp / Slack)
  const handleCopyText = async () => {
    const text = generateMeetingText(meeting, members, attendance);
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.modalTitle}>Export Meeting Attendance</Text>
              <Text style={styles.modalSubtitle}>
                Export with student names, RA numbers, and club domains
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {downloadSuccess && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#047857" />
              <Text style={styles.successBannerText}>{downloadSuccess}</Text>
            </View>
          )}

          {/* Quick Action Export Buttons */}
          <View style={styles.exportButtonsGrid}>
            {/* 1. Download CSV Button */}
            <TouchableOpacity
              style={styles.csvExportBtn}
              onPress={handleExportCSV}
              activeOpacity={0.8}
            >
              <View style={styles.btnIconCircleGreen}>
                <Ionicons name="grid" size={18} color="#059669" />
              </View>
              <View style={styles.btnTextCol}>
                <Text style={styles.btnMainTitle}>Export as CSV</Text>
                <Text style={styles.btnSubTitle}>Excel / Sheets with domains & details</Text>
              </View>
              <Ionicons name="download-outline" size={18} color="#059669" />
            </TouchableOpacity>

            {/* 2. Download Text File Button */}
            <TouchableOpacity
              style={styles.textExportBtn}
              onPress={handleExportTextFile}
              activeOpacity={0.8}
            >
              <View style={styles.btnIconCircleBlue}>
                <Ionicons name="document-text" size={18} color="#2563EB" />
              </View>
              <View style={styles.btnTextCol}>
                <Text style={styles.btnMainTitle}>Export as Text File</Text>
                <Text style={styles.btnSubTitle}>Formatted .txt file for records & FA</Text>
              </View>
              <Ionicons name="download-outline" size={18} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {/* Report Preview */}
          <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={true}>
            <View style={styles.reportBox}>
              <Text style={styles.reportTitle}>📋 {meeting.title}</Text>
              <Text style={styles.reportMeta}>
                {meeting.date} • {meeting.time} • {meeting.location}
              </Text>

              <View style={styles.summaryBar}>
                <Text style={styles.summaryBarText}>
                  Total: {summary.total} | 🟢 Present: {summary.present} | 🔴 Absent: {summary.absent}
                </Text>
                <Text style={styles.summaryTurnout}>{summary.percentage}% Turnout</Text>
              </View>

              {/* Absent Members Callout */}
              {absentList.length > 0 && (
                <View style={styles.sectionCallout}>
                  <Text style={styles.sectionHeaderRed}>
                    ❌ Absent Members ({absentList.length})
                  </Text>
                  {absentList.map((m) => (
                    <View key={m.id} style={styles.memberListItem}>
                      <View style={styles.memberListMain}>
                        <Text style={styles.listMemberName}>{m.name}</Text>
                        <Text style={styles.listMemberRa}>[{m.raNo}]</Text>
                        <View style={[styles.domainTagPill, m.domain === 'None' && { backgroundColor: '#EEF2FF' }]}>
                          <Text style={[styles.domainTagPillText, m.domain === 'None' && { color: '#4F46E5' }]}>
                            {m.domain === 'None' || !m.domain ? m.role : m.domain}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.listMemberSub}>
                        {m.branch || m.department} • Year {m.year} • FA: {m.faName}
                      </Text>
                      {notes[m.id] && (
                        <Text style={styles.listMemberNote}>Note: {notes[m.id]}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Present Members Callout */}
              {presentList.length > 0 && (
                <View style={styles.sectionCallout}>
                  <Text style={styles.sectionHeaderGreen}>
                    ✅ Present Members ({presentList.length})
                  </Text>
                  {presentList.map((m) => (
                    <View key={m.id} style={styles.memberListItem}>
                      <View style={styles.memberListMain}>
                        <Text style={styles.listMemberName}>{m.name}</Text>
                        <Text style={styles.listMemberRa}>[{m.raNo}]</Text>
                        <View style={[styles.domainTagPill, m.domain === 'None' && { backgroundColor: '#EEF2FF' }]}>
                          <Text style={[styles.domainTagPillText, m.domain === 'None' && { color: '#4F46E5' }]}>
                            {m.domain === 'None' || !m.domain ? m.role : m.domain}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.listMemberSub}>
                        {m.year} ({m.section}) • {m.branch || m.department}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.closeActionBtn} onPress={onClose}>
              <Text style={styles.closeActionText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyText} activeOpacity={0.8}>
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={17}
                color="#FFFFFF"
              />
              <Text style={styles.copyBtnText}>
                {copied ? 'Copied to Clipboard!' : 'Copy for WhatsApp'}
              </Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 640,
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
  headerTitleGroup: {
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  exportButtonsGrid: {
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  csvExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  textExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  btnIconCircleGreen: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIconCircleBlue: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTextCol: {
    flex: 1,
  },
  btnMainTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  btnSubTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  previewScroll: {
    marginTop: 8,
    maxHeight: 260,
  },
  reportBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  reportMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  summaryBar: {
    backgroundColor: '#EEF2FF',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  summaryBarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3730A3',
  },
  summaryTurnout: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4F46E5',
  },
  sectionCallout: {
    marginBottom: 10,
  },
  sectionHeaderRed: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sectionHeaderGreen: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sectionHeaderAmber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  memberListItem: {
    backgroundColor: '#FFFFFF',
    padding: 7,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  memberListMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  listMemberName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  listMemberRa: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  domainTagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  domainTagPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  listMemberSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  listMemberNote: {
    fontSize: 11,
    color: '#6366F1',
    fontStyle: 'italic',
    marginTop: 2,
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
  closeActionBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  closeActionText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
  },
  copyBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
