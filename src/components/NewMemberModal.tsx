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
import { ClubMember } from '../types';

interface NewMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (memberData: Omit<ClubMember, 'id'>) => void;
}

const DOMAIN_OPTIONS = ['Technical', 'Creatives', 'Corporate', 'None'];
const ROLE_SUGGESTIONS = [
  'Vice President',
  'Secretary',
  'Joint Secretary',
  'Tech Head',
  'Tech Lead',
  'Creative Head',
  'Creative Lead',
  'Corporate Head',
  'Corporate Lead',
  'Member',
];
const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const AVATAR_COLORS = [
  '#4F46E5',
  '#7C3AED',
  '#0284C7',
  '#059669',
  '#EA580C',
  '#DB2777',
  '#2563EB',
  '#D97706',
];

export const NewMemberModal: React.FC<NewMemberModalProps> = ({ visible, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [raNo, setRaNo] = useState('');
  const [srmEmail, setSrmEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [branch, setBranch] = useState('B.Tech CSE');
  const [department, setDepartment] = useState('Computing');
  const [year, setYear] = useState('2nd Year');
  const [section, setSection] = useState('');
  const [faName, setFaName] = useState('');
  const [faEmail, setFaEmail] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [domain, setDomain] = useState('Technical');
  const [role, setRole] = useState('Member');
  const [phone, setPhone] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'Student name is required';
    if (!raNo.trim()) errs.raNo = 'Reg.No (RA No) is required';
    if (!branch.trim()) errs.branch = 'Pursuing Branch is required';
    if (!department.trim()) errs.department = 'Department is required';
    if (!faName.trim()) errs.faName = 'Faculty Advisor name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    onSubmit({
      name: name.trim(),
      raNo: raNo.trim().toUpperCase(),
      srmEmail: srmEmail.trim(),
      personalEmail: personalEmail.trim(),
      branch: branch.trim(),
      department: department.trim(),
      year,
      section: section.trim().toUpperCase(),
      faName: faName.trim(),
      faEmail: faEmail.trim(),
      linkedin: linkedin.trim(),
      github: github.trim(),
      domain: domain === 'None' ? 'None' : domain,
      role: role.trim() || 'Member',
      phone: phone.trim(),
      avatarColor: randomColor,
      joinedDate: new Date().toISOString().split('T')[0],
    });

    // Reset fields
    setName('');
    setRaNo('');
    setSrmEmail('');
    setPersonalEmail('');
    setBranch('B.Tech CSE');
    setDepartment('Computing');
    setSection('');
    setFaName('');
    setFaEmail('');
    setLinkedin('');
    setGithub('');
    setPhone('');
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
              <Text style={styles.modalTitle}>Add Crew Member</Text>
              <Text style={styles.modalSubtitle}>
                Register student with SRM details, FA & social handles
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* 1. Full Name & Reg.No */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 3 }]}>
                <Text style={styles.label}>
                  Student Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="e.g. Inesh Agarwal"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#94A3B8"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.label}>
                  Reg.No <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.raNo && styles.inputError]}
                  placeholder="RA2411003011496"
                  value={raNo}
                  onChangeText={setRaNo}
                  autoCapitalize="characters"
                  placeholderTextColor="#94A3B8"
                />
                {errors.raNo && <Text style={styles.errorText}>{errors.raNo}</Text>}
              </View>
            </View>

            {/* 2. SRM Email & Personal Email */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>SRM Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. ia1234@srmist.edu.in"
                  value={srmEmail}
                  onChangeText={setSrmEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Personal Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. name@gmail.com"
                  value={personalEmail}
                  onChangeText={setPersonalEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* 3. Pursuing Branch & Department */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Pursuing Branch <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.branch && styles.inputError]}
                  placeholder="e.g. B.Tech CSE / IT / ECE"
                  value={branch}
                  onChangeText={setBranch}
                  placeholderTextColor="#94A3B8"
                />
                {errors.branch && <Text style={styles.errorText}>{errors.branch}</Text>}
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Department <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.department && styles.inputError]}
                  placeholder="e.g. Computing / C.Tech"
                  value={department}
                  onChangeText={setDepartment}
                  placeholderTextColor="#94A3B8"
                />
                {errors.department && <Text style={styles.errorText}>{errors.department}</Text>}
              </View>
            </View>

            {/* 4. Year & Section */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.label}>Year</Text>
                <View style={styles.chipsRow}>
                  {YEAR_OPTIONS.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.chip, year === y && styles.chipActive]}
                      onPress={() => setYear(y)}
                    >
                      <Text style={[styles.chipText, year === y && styles.chipTextActive]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Section</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. C2"
                  value={section}
                  onChangeText={setSection}
                  autoCapitalize="characters"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* 5. FA Name & FA Email */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  FA Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.faName && styles.inputError]}
                  placeholder="e.g. Dr Vinod D"
                  value={faName}
                  onChangeText={setFaName}
                  placeholderTextColor="#94A3B8"
                />
                {errors.faName && <Text style={styles.errorText}>{errors.faName}</Text>}
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>FA Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. vinodd@srmist.edu.in"
                  value={faEmail}
                  onChangeText={setFaEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* 6. LinkedIn & GitHub */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>LinkedIn Profile / Handle</Text>
                <TextInput
                  style={styles.input}
                  placeholder="linkedin.com/in/username"
                  value={linkedin}
                  onChangeText={setLinkedin}
                  autoCapitalize="none"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>GitHub Profile / Handle</Text>
                <TextInput
                  style={styles.input}
                  placeholder="github.com/username"
                  value={github}
                  onChangeText={setGithub}
                  autoCapitalize="none"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* 7. Club Role & Domain */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Club Role / Designation</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Tech Head, Vice President, Lead, Member"
                value={role}
                onChangeText={(val) => {
                  setRole(val);
                  const lower = val.toLowerCase();
                  if (lower.includes('president') || lower.includes('secretary')) {
                    setDomain('None');
                  } else if (lower.includes('tech')) {
                    setDomain('Technical');
                  } else if (lower.includes('creative')) {
                    setDomain('Creatives');
                  } else if (lower.includes('corporate')) {
                    setDomain('Corporate');
                  }
                }}
                placeholderTextColor="#94A3B8"
              />
              <View style={[styles.chipsRow, { marginTop: 6 }]}>
                {ROLE_SUGGESTIONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.miniChip, role === r && styles.miniChipActive]}
                    onPress={() => {
                      setRole(r);
                      if (
                        r === 'Vice President' ||
                        r === 'Secretary' ||
                        r === 'Joint Secretary'
                      ) {
                        setDomain('None');
                      } else if (r.startsWith('Tech')) {
                        setDomain('Technical');
                      } else if (r.startsWith('Creative')) {
                        setDomain('Creatives');
                      } else if (r.startsWith('Corporate')) {
                        setDomain('Corporate');
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.miniChipText,
                        role === r && styles.miniChipTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Domain Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Club Domain {domain === 'None' && '(Not Applicable for President / VP / Core)'}
              </Text>
              <View style={styles.chipsRow}>
                {DOMAIN_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, domain === d && styles.chipActive]}
                    onPress={() => setDomain(d)}
                  >
                    <Text style={[styles.chipText, domain === d && styles.chipTextActive]}>
                      {d === 'None' ? 'None (President / VP)' : d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
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
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.submitText}>Save Member</Text>
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
    maxWidth: 620,
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
    paddingVertical: Platform.OS === 'ios' ? 9 : 7,
    fontSize: 13,
    color: '#0F172A',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 3,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  miniChip: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  miniChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  miniChipTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
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
