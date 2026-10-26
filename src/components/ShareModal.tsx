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
import { useTheme } from '../context/ThemeContext';

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
  const { isDark, colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!meeting) return null;

  const summary = calculateMeetingSummary(attendance, members.length);
  const statuses = attendance?.statuses || {};
  const notes = attendance?.notes || {};

  const presentList = members.filter((m) => statuses[m.id] === 'present');
  const absentList = members.filter((m) => statuses[m.id] === 'absent');

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
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Share Meeting Attendance</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {meeting.title} • {meeting.date}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Quick Copy WhatsApp Highlight Banner */}
          <TouchableOpacity
            style={[styles.whatsappBanner, { backgroundColor: colors.primary }]}
            onPress={handleCopyText}
            activeOpacity={0.85}
          >
            <View style={styles.whatsappIconCircle}>
              <Ionicons name={copied ? 'checkmark-circle' : 'logo-whatsapp'} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.whatsappTextCol}>
              <Text style={styles.whatsappBannerTitle}>
                {copied ? 'Copied to Clipboard!' : 'Copy Summary for WhatsApp'}
              </Text>
              <Text style={styles.whatsappBannerSubtitle}>
                Ready formatted with emojis, present/absent names & stats
              </Text>
            </View>
          </TouchableOpacity>

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

          {/* File Downloads */}
          <View style={styles.exportButtonsGrid}>
            <TouchableOpacity
              style={[
                styles.exportBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F0FDF4',
                  borderColor: isDark ? '#047857' : '#86EFAC',
                },
              ]}
              onPress={handleExportCSV}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.btnIconCircle,
                  { backgroundColor: isDark ? '#064E3B' : '#DCFCE7' },
                ]}
              >
                <Ionicons name="grid-outline" size={16} color={colors.success} />
              </View>
              <View style={styles.btnTextCol}>
                <Text style={[styles.btnMainTitle, { color: colors.text }]}>Export CSV Spreadsheet</Text>
                <Text style={[styles.btnSubTitle, { color: colors.textSecondary }]}>
                  Compatible with Microsoft Excel & Google Sheets
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.exportBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                  borderColor: isDark ? '#3B82F6' : '#93C5FD',
                },
              ]}
              onPress={handleExportTextFile}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.btnIconCircle,
                  { backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE' },
                ]}
              >
                <Ionicons name="document-text-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.btnTextCol}>
                <Text style={[styles.btnMainTitle, { color: colors.text }]}>Download Plain Text (.txt)</Text>
                <Text style={[styles.btnSubTitle, { color: colors.textSecondary }]}>
                  Clean text report for archiving or email
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Report Live Preview */}
          <ScrollView
            style={styles.previewScroll}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.reportBox,
                {
                  backgroundColor: isDark ? '#111827' : '#F8FAFC',
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.reportTitle, { color: colors.text }]}>
                {meeting.title}
              </Text>
              <Text style={[styles.reportMeta, { color: colors.textSecondary }]}>
                📅 {meeting.date} • ⏰ {meeting.time} • 📍 {meeting.location}
              </Text>

              {/* Turnout summary pill */}
              <View
                style={[
                  styles.summaryBar,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#EEF2FF',
                    borderColor: isDark ? '#334155' : '#C7D2FE',
                  },
                ]}
              >
                <Text style={[styles.summaryBarText, { color: colors.primary }]}>
                  {summary.present} Present • {summary.absent} Absent • {summary.unmarked} Unmarked
                </Text>
                <Text style={[styles.summaryTurnout, { color: colors.primary }]}>
                  {summary.percentage}% Turnout
                </Text>
              </View>

              {/* Present List */}
              {presentList.length > 0 && (
                <View style={styles.sectionCallout}>
                  <Text style={[styles.sectionHeaderGreen, { color: colors.success }]}>
                    ✅ Present Members ({presentList.length}):
                  </Text>
                  {presentList.map((m, idx) => (
                    <View
                      key={m.id}
                      style={[
                        styles.memberListItem,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          borderColor: colors.cardBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.listMemberName, { color: colors.text }]}>
                        {idx + 1}. {m.name} {m.raNo ? `[${m.raNo}]` : ''}
                      </Text>
                      {notes[m.id] ? (
                        <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                          Note: {notes[m.id]}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}

              {/* Absent List */}
              {absentList.length > 0 && (
                <View style={styles.sectionCallout}>
                  <Text style={[styles.sectionHeaderRed, { color: colors.danger }]}>
                    ❌ Absent Members ({absentList.length}):
                  </Text>
                  {absentList.map((m, idx) => (
                    <View
                      key={m.id}
                      style={[
                        styles.memberListItem,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          borderColor: colors.cardBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.listMemberName, { color: colors.text }]}>
                        {idx + 1}. {m.name} {m.raNo ? `[${m.raNo}]` : ''}
                      </Text>
                      {notes[m.id] ? (
                        <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                          Note: {notes[m.id]}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
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
    maxWidth: 580,
    maxHeight: '90%',
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
  whatsappBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  whatsappIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappTextCol: {
    flex: 1,
  },
  whatsappBannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  whatsappBannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 1,
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
  exportButtonsGrid: {
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  btnIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTextCol: {
    flex: 1,
  },
  btnMainTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  btnSubTitle: {
    fontSize: 11,
    marginTop: 1,
  },
  previewScroll: {
    marginTop: 6,
    maxHeight: 240,
  },
  reportBox: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  reportMeta: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
  },
  summaryBar: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
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
  },
  summaryTurnout: {
    fontSize: 12,
    fontWeight: '800',
  },
  sectionCallout: {
    marginBottom: 10,
  },
  sectionHeaderGreen: {
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionHeaderRed: {
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  memberListItem: {
    padding: 6,
    borderRadius: 6,
    marginBottom: 3,
    borderWidth: 1,
  },
  listMemberName: {
    fontSize: 12,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
