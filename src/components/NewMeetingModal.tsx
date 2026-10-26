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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meeting } from '../types';

interface NewMeetingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (meetingData: Omit<Meeting, 'id' | 'createdAt'>) => void;
}

export const NewMeetingModal: React.FC<NewMeetingModalProps> = ({ visible, onClose, onSubmit }) => {
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
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Schedule New Meeting</Text>
              <Text style={styles.modalSubtitle}>Create meeting session for taking roll call</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Meeting Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="e.g. Weekly All-Hands Sync or Domain Review"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#94A3B8"
              />
              {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
            </View>

            {/* Date & Time */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Date (YYYY-MM-DD) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.date && styles.inputError]}
                  placeholder="2026-10-26"
                  value={date}
                  onChangeText={setDate}
                  placeholderTextColor="#94A3B8"
                />
                {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Time <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.time && styles.inputError]}
                  placeholder="e.g. 5:00 PM - 6:30 PM"
                  value={time}
                  onChangeText={setTime}
                  placeholderTextColor="#94A3B8"
                />
                {errors.time ? <Text style={styles.errorText}>{errors.time}</Text> : null}
              </View>
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Location / Venue / Online Link <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.location && styles.inputError]}
                placeholder="e.g. Seminar Hall 302 or Google Meet"
                value={location}
                onChangeText={setLocation}
                placeholderTextColor="#94A3B8"
              />
              {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
            </View>

            {/* Description / Agenda */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Agenda / Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Outline discussion points, domain presentations, etc."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
              <Ionicons name="calendar" size={17} color="#FFFFFF" />
              <Text style={styles.submitText}>Create Meeting</Text>
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
    maxWidth: 500,
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
    paddingBottom: 14,
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
  formScroll: {
    marginTop: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 14,
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
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
  },
  submitText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
