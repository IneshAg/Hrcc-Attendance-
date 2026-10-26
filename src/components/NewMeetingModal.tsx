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
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meeting } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NewMeetingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (meetingData: Omit<Meeting, 'id' | 'createdAt'>) => void;
}

export const NewMeetingModal: React.FC<NewMeetingModalProps> = ({ visible, onClose, onSubmit }) => {
  const { isDark, colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 600;

  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('5:00 PM - 6:30 PM');
  const [location, setLocation] = useState('Tech Park Seminar Hall 302');
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!title.trim()) errs.title = 'Meeting title is required';
    if (!date.trim()) errs.date = 'Meeting date is required';
    if (!time.trim()) errs.time = 'Meeting time is required';
    if (!location.trim()) errs.location = 'Location or venue is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      title: title.trim(),
      date: date.trim(),
      time: time.trim(),
      location: location.trim(),
      description: description.trim(),
      status: 'upcoming',
    });

    // Reset fields
    setTitle('');
    setDate(todayStr);
    setTime('5:00 PM - 6:30 PM');
    setLocation('Tech Park Seminar Hall 302');
    setDescription('');
    setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.overlay,
          {
            backgroundColor: colors.modalOverlay,
            justifyContent: isMobile ? 'flex-end' : 'center',
            padding: isMobile ? 0 : 16,
          },
        ]}
      >
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
              maxWidth: isMobile ? '100%' : 540,
              maxHeight: isMobile ? '92%' : '88%',
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              borderBottomLeftRadius: isMobile ? 0 : 22,
              borderBottomRightRadius: isMobile ? 0 : 22,
              paddingHorizontal: isMobile ? 16 : 22,
              paddingTop: isMobile ? 12 : 20,
              paddingBottom: isMobile ? (Platform.OS === 'ios' ? 32 : 18) : 20,
              borderBottomWidth: isMobile ? 0 : 1,
            },
          ]}
        >
          {/* Mobile Sheet Drag Handle */}
          {isMobile && (
            <View style={styles.dragHandleContainer}>
              <View
                style={[
                  styles.dragHandle,
                  { backgroundColor: isDark ? '#26362C' : '#CBD5E1' },
                ]}
              />
            </View>
          )}

          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.cardBorder }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Schedule New Meeting</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Create a session for club attendance & roll call
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Meeting Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                  errors.title && styles.inputError,
                ]}
                placeholder="e.g. Weekly All-Hands Sync or Domain Review"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={colors.textMuted}
              />
              {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
            </View>

            {/* Date & Time */}
            <View style={isMobile ? styles.mobileStack : styles.row}>
              <View style={[styles.inputGroup, !isMobile && { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Date (YYYY-MM-DD) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    },
                    errors.date && styles.inputError,
                  ]}
                  placeholder="2026-10-26"
                  value={date}
                  onChangeText={setDate}
                  placeholderTextColor={colors.textMuted}
                />
                {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
              </View>

              <View style={[styles.inputGroup, !isMobile && { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Time <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    },
                    errors.time && styles.inputError,
                  ]}
                  placeholder="e.g. 5:00 PM - 6:30 PM"
                  value={time}
                  onChangeText={setTime}
                  placeholderTextColor={colors.textMuted}
                />
                {errors.time ? <Text style={styles.errorText}>{errors.time}</Text> : null}
              </View>
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Location / Venue <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                  errors.location && styles.inputError,
                ]}
                placeholder="e.g. Tech Park UB 204 or Online GMeet"
                value={location}
                onChangeText={setLocation}
                placeholderTextColor={colors.textMuted}
              />
              {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Meeting Description / Agenda</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Discussing upcoming hackathon tracks, responsibilities, and schedule"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View
            style={[
              styles.modalFooter,
              {
                borderTopColor: colors.cardBorder,
                flexDirection: isMobile ? 'row' : 'row',
                justifyContent: isMobile ? 'space-between' : 'flex-end',
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: isDark ? '#161E19' : '#F1F5F9',
                  flex: isMobile ? 1 : undefined,
                },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  flex: isMobile ? 1.4 : undefined,
                },
              ]}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar" size={16} color={isDark ? '#070707' : '#FFFFFF'} />
              <Text style={[styles.submitButtonText, { color: isDark ? '#070707' : '#FFFFFF' }]}>
                Create Meeting
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  modalCard: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 4,
  },
  dragHandle: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 6,
  },
  formScroll: {
    marginTop: 12,
  },
  inputGroup: {
    marginBottom: 12,
    width: '100%',
  },
  mobileStack: {
    flexDirection: 'column',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13.5,
  },
  textArea: {
    minHeight: 80,
    height: 'auto',
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 3,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    marginTop: 6,
    borderTopWidth: 1,
  },
  cancelButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  submitButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
    borderRadius: 10,
    shadowColor: '#05C770',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
