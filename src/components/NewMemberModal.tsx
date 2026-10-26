import React, { useState, useEffect } from 'react';
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
import { parseKeyValueText } from '../utils/csvParser';

interface NewMemberModalProps {
  visible: boolean;
  initialMember?: ClubMember | null;
  onClose: () => void;
  onSubmit: (memberData: Omit<ClubMember, 'id'>) => void;
  onUpdate?: (id: string, updatedData: Partial<ClubMember>) => Promise<void>;
}

const DOMAIN_OPTIONS = ['Technical', 'Creatives', 'Corporate', 'None'];
const ROLE_SUGGESTIONS = [
  'President',
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

export const NewMemberModal: React.FC<NewMemberModalProps> = ({
  visible,
  initialMember,
  onClose,
  onSubmit,
  onUpdate,
}) => {
  const [name, setName] = useState('');
  const [raNo, setRaNo] = useState('');
  const [srmEmail, setSrmEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [branch, setBranch] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [faName, setFaName] = useState('');
  const [faEmail, setFaEmail] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [domain, setDomain] = useState('Technical');
  const [role, setRole] = useState('Member');
  const [phone, setPhone] = useState('');

  const [isPasteBoxOpen, setIsPasteBoxOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialMember) {
      setName(initialMember.name || '');
      setRaNo(initialMember.raNo || '');
      setSrmEmail(initialMember.srmEmail || '');
      setPersonalEmail(initialMember.personalEmail || '');
      setBranch(initialMember.branch || '');
      setDepartment(initialMember.department || '');
      setYear(initialMember.year || '');
      setSection(initialMember.section || '');
      setFaName(initialMember.faName || '');
      setFaEmail(initialMember.faEmail || '');
      setLinkedin(initialMember.linkedin || '');
      setGithub(initialMember.github || '');
      setDomain(initialMember.domain || 'None');
      setRole(initialMember.role || 'Member');
      setPhone(initialMember.phone || '');
    } else {
      setName('');
      setRaNo('');
      setSrmEmail('');
      setPersonalEmail('');
      setBranch('');
      setDepartment('');
      setYear('');
      setSection('');
      setFaName('');
      setFaEmail('');
      setLinkedin('');
      setGithub('');
      setDomain('Technical');
      setRole('Member');
      setPhone('');
    }
    setErrors({});
    setIsPasteBoxOpen(false);
    setPasteText('');
  }, [initialMember, visible]);

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'Student name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleApplyPasteText = () => {
    if (!pasteText.trim()) return;
    const extracted = parseKeyValueText(pasteText);
    if (extracted.name) setName(extracted.name);
    if (extracted.raNo) setRaNo(extracted.raNo);
    if (extracted.srmEmail) setSrmEmail(extracted.srmEmail);
    if (extracted.personalEmail) setPersonalEmail(extracted.personalEmail);
    if (extracted.branch) setBranch(extracted.branch);
    if (extracted.department) setDepartment(extracted.department);
    if (extracted.year) setYear(extracted.year);
    if (extracted.section) setSection(extracted.section);
    if (extracted.faName) setFaName(extracted.faName);
    if (extracted.faEmail) setFaEmail(extracted.faEmail);
    if (extracted.linkedin) setLinkedin(extracted.linkedin);
    if (extracted.github) setGithub(extracted.github);
    if (extracted.domain) setDomain(extracted.domain);
    if (extracted.role) setRole(extracted.role);
    if (extracted.phone) setPhone(extracted.phone);
    setIsPasteBoxOpen(false);
    setPasteText('');
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (initialMember && onUpdate) {
      await onUpdate(initialMember.id, {
        name: name.trim(),
        raNo: raNo.trim().toUpperCase() || undefined,
        srmEmail: srmEmail.trim() || undefined,
        personalEmail: personalEmail.trim() || undefined,
        branch: branch.trim() || undefined,
        department: department.trim() || undefined,
        year: year || undefined,
        section: section.trim().toUpperCase() || undefined,
        faName: faName.trim() || undefined,
        faEmail: faEmail.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        github: github.trim() || undefined,
        domain: domain === 'None' ? 'None' : domain,
        role: role.trim() || 'Member',
        phone: phone.trim() || undefined,
      });
      onClose();
      return;
    }

    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    onSubmit({
      name: name.trim(),
      raNo: raNo.trim().toUpperCase() || undefined,
      srmEmail: srmEmail.trim() || undefined,
      personalEmail: personalEmail.trim() || undefined,
      branch: branch.trim() || undefined,
      department: department.trim() || undefined,
      year: year || undefined,
      section: section.trim().toUpperCase() || undefined,
      faName: faName.trim() || undefined,
      faEmail: faEmail.trim() || undefined,
      linkedin: linkedin.trim() || undefined,
      github: github.trim() || undefined,
      domain: domain === 'None' ? 'None' : domain,
      role: role.trim() || 'Member',
      phone: phone.trim() || undefined,
      avatarColor: randomColor,
      joinedDate: new Date().toISOString().split('T')[0],
    });

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.modalTitle}>
                {initialMember ? `Edit: ${initialMember.name}` : 'Add Crew Member'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {initialMember
                  ? 'Update academic info, contact, or paste details text to auto-fill'
                  : 'Only name is required — other fields can be filled now or updated later'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Quick Auto-Fill Banner / Toggle */}
            <TouchableOpacity
              style={styles.pasteToggleBtn}
              onPress={() => setIsPasteBoxOpen(!isPasteBoxOpen)}
              activeOpacity={0.7}
            >
              <Ionicons name="flash" size={15} color="#4F46E5" />
              <Text style={styles.pasteToggleText}>
                {isPasteBoxOpen
                  ? 'Hide Text Auto-Fill Box'
                  : '⚡ Paste Details Text to Auto-Fill'}
              </Text>
              <Ionicons
                name={isPasteBoxOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#4F46E5"
              />
            </TouchableOpacity>

            {isPasteBoxOpen && (
              <View style={styles.pasteBoxContainer}>
                <Text style={styles.pasteBoxHint}>
                  Paste member details in any format (e.g. Name: ..., Reg.No: ..., SRM email: ...):
                </Text>
                <TextInput
                  style={styles.pasteTextArea}
                  multiline
                  placeholder={`Name: ${name || 'Inesh Agarwal'}\nReg.No: RA2411003011496\nSRM email: ia3383@srmist.edu.in\nPersonal Email: name@gmail.com\nPursuing Branch: CSE\nDepartment: Computing\nFA name: Dr Vinod D\nFA email: drvinodd@srmist.edu.in\nLinkedIn: https://linkedin.com/in/username\nGitHub: https://github.com/username`}
                  value={pasteText}
                  onChangeText={setPasteText}
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity
                  style={[styles.applyPasteBtn, !pasteText.trim() && styles.applyPasteBtnDisabled]}
                  onPress={handleApplyPasteText}
                  disabled={!pasteText.trim()}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                  <Text style={styles.applyPasteBtnText}>Apply Extracted Details</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 1. Full Name & Reg.No */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 3 }]}>
                <Text style={styles.label}>
                  Student Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="e.g. Purva Jain"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#94A3B8"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.label}>Reg.No (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="RA241100301..."
                  value={raNo}
                  onChangeText={setRaNo}
                  autoCapitalize="characters"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* 2. SRM Email & Personal Email */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>SRM Email (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. pj1234@srmist.edu.in"
                  value={srmEmail}
                  onChangeText={setSrmEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Personal Email (Optional)</Text>
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
                <Text style={styles.label}>Pursuing Branch (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. B.Tech CSE / IT"
                  value={branch}
                  onChangeText={setBranch}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Department (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Computing / C.Tech"
                  value={department}
                  onChangeText={setDepartment}
                  placeholderTextColor="#94A3B8"
                />
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
                <Text style={styles.label}>FA Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Dr Vinod D"
                  value={faName}
                  onChangeText={setFaName}
                  placeholderTextColor="#94A3B8"
                />
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
                        r === 'President' ||
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
              <Text style={styles.submitText}>
                {initialMember ? 'Save Changes' : 'Save Member'}
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
  pasteToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  pasteToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    flex: 1,
    marginLeft: 6,
  },
  pasteBoxContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  pasteBoxHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  pasteTextArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    color: '#0F172A',
    minHeight: 110,
    maxHeight: 180,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  applyPasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 6,
  },
  applyPasteBtnDisabled: {
    opacity: 0.5,
  },
  applyPasteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
