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
import { parseKeyValueText, getYearFromRaNo } from '../utils/csvParser';
import { useTheme } from '../context/ThemeContext';
import { DropdownInput } from './DropdownInput';

interface NewMemberModalProps {
  visible: boolean;
  initialMember?: ClubMember | null;
  onClose: () => void;
  onSubmit: (memberData: Omit<ClubMember, 'id'>) => void;
  onUpdate?: (id: string, updatedData: Partial<ClubMember>) => Promise<void>;
}

const BRANCH_OPTIONS = [
  'CSE Core',
  'CSE AIML',
  'CSE Data Science',
  'CSE Cyber Security',
  'CSE Software Engineering',
  'CSE Cloud Computing',
  'Information Technology (IT)',
  'ECE',
  'EEE',
  'Mechanical Engineering',
  'Biotechnology',
];

const DEPARTMENT_OPTIONS = [
  { label: 'Computing Technologies (C.Tech)', value: 'C.Tech', hint: 'School of Computing' },
  { label: 'Networking & Communications (NWC)', value: 'NWC', hint: 'School of Computing' },
  { label: 'Computational Intelligence (CINTEL)', value: 'CINTEL', hint: 'School of Computing' },
  { label: 'Data Science & Business Systems (DSBS)', value: 'DSBS', hint: 'School of Computing' },
  { label: 'Software Engineering (SWE)', value: 'SWE', hint: 'School of Computing' },
  { label: 'Electronics & Communication (ECE)', value: 'ECE', hint: 'Engineering' },
  { label: 'Electrical & Electronics (EEE)', value: 'EEE', hint: 'Engineering' },
  { label: 'Mechanical Engineering', value: 'Mechanical', hint: 'Engineering' },
];

const YEAR_OPTIONS = [
  { label: '3rd Year (RA24 Batch)', value: '3rd Year', hint: 'Graduating 2028' },
  { label: '2nd Year (RA25 Batch)', value: '2nd Year', hint: 'Graduating 2029' },
  { label: '1st Year (RA26 Batch)', value: '1st Year', hint: 'Graduating 2030' },
  { label: '4th Year (RA23 Batch)', value: '4th Year', hint: 'Graduating 2027' },
];

const SECTION_OPTIONS = [
  'G1', 'G2', 'F1', 'F2', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'
];

const ROLE_OPTIONS = [
  { label: 'President', value: 'President', hint: 'Core Executive' },
  { label: 'Vice President', value: 'Vice President', hint: 'Core Executive' },
  { label: 'Secretary', value: 'Secretary', hint: 'Core Executive' },
  { label: 'Joint Secretary', value: 'Joint Secretary', hint: 'Core Executive' },
  { label: 'Technical Head', value: 'Technical Head', hint: 'Technical Domain' },
  { label: 'Technical Lead', value: 'Technical Lead', hint: 'Technical Domain' },
  { label: 'Creatives Head', value: 'Creatives Head', hint: 'Creatives Domain' },
  { label: 'Creatives Lead', value: 'Creatives Lead', hint: 'Creatives Domain' },
  { label: 'Corporate Head', value: 'Corporate Head', hint: 'Corporate Domain' },
  { label: 'Corporate Lead', value: 'Corporate Lead', hint: 'Corporate Domain' },
  { label: 'Crew Member', value: 'Member', hint: 'Domain Member' },
];

const DOMAIN_OPTIONS = [
  { label: 'Technical', value: 'Technical', hint: 'Coding, Web, App, AI/ML' },
  { label: 'Creatives', value: 'Creatives', hint: 'Design, UI/UX, Video, Content' },
  { label: 'Corporate', value: 'Corporate', hint: 'Sponsorships, PR, Operations' },
  { label: 'None (President / VP / Core)', value: 'None', hint: 'Executive Leadership' },
];

const AVATAR_COLORS = [
  '#05C770',
  '#04B264',
  '#00C758',
  '#1BA94C',
  '#0A66C2',
  '#EA580C',
  '#7C3AED',
  '#D97706',
];

export const NewMemberModal: React.FC<NewMemberModalProps> = ({
  visible,
  initialMember,
  onClose,
  onSubmit,
  onUpdate,
}) => {
  const { isDark, colors } = useTheme();

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

  const [autoYearNotice, setAutoYearNotice] = useState<string | null>(null);
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
      setDomain(initialMember.domain || 'Technical');
      setRole(initialMember.role || 'Member');
      setPhone(initialMember.phone || '');
      setAutoYearNotice(null);
    } else {
      // Clear form when opening empty modal
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
      setAutoYearNotice(null);
      setIsPasteBoxOpen(false);
      setPasteText('');
      setErrors({});
    }
  }, [initialMember, visible]);

  // When RA number is changed: automatically detect year (RA24 -> 3rd, RA25 -> 2nd, RA26 -> 1st, RA23 -> 4th)
  const handleRaNoChange = (val: string) => {
    setRaNo(val);
    const detected = getYearFromRaNo(val);
    if (detected) {
      setYear(detected);
      setAutoYearNotice(`Auto-set to ${detected}`);
      setTimeout(() => setAutoYearNotice(null), 3000);
    }
  };

  // Handle parsing pasted multi-line block to auto-populate fields
  const handleApplyPastedText = () => {
    if (!pasteText.trim()) return;
    const parsed = parseKeyValueText(pasteText);
    if (parsed.name) setName(parsed.name);
    if (parsed.raNo) {
      setRaNo(parsed.raNo);
      const detectedYear = getYearFromRaNo(parsed.raNo);
      if (detectedYear) setYear(parsed.year || detectedYear);
    } else if (parsed.year) {
      setYear(parsed.year);
    }
    if (parsed.srmEmail) setSrmEmail(parsed.srmEmail);
    if (parsed.personalEmail) setPersonalEmail(parsed.personalEmail);
    if (parsed.branch) setBranch(parsed.branch);
    if (parsed.department) setDepartment(parsed.department);
    if (parsed.section) setSection(parsed.section);
    if (parsed.faName) setFaName(parsed.faName);
    if (parsed.faEmail) setFaEmail(parsed.faEmail);
    if (parsed.linkedin) setLinkedin(parsed.linkedin);
    if (parsed.github) setGithub(parsed.github);
    if (parsed.domain) setDomain(parsed.domain);
    if (parsed.role) setRole(parsed.role);
    if (parsed.phone) setPhone(parsed.phone);

    setIsPasteBoxOpen(false);
    setPasteText('');
  };

  // Handle role selection with smart domain sync
  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
    const lower = selectedRole.toLowerCase();
    if (lower.includes('president') || lower.includes('secretary')) {
      setDomain('None');
    } else if (lower.includes('tech')) {
      setDomain('Technical');
    } else if (lower.includes('creative')) {
      setDomain('Creatives');
    } else if (lower.includes('corporate')) {
      setDomain('Corporate');
    }
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!domain) errs.domain = 'Domain selection is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const memberPayload = {
      name: name.trim(),
      raNo: raNo.trim() || undefined,
      srmEmail: srmEmail.trim() || undefined,
      personalEmail: personalEmail.trim() || undefined,
      branch: branch.trim() || undefined,
      department: department.trim() || undefined,
      year: year.trim() || undefined,
      section: section.trim() || undefined,
      faName: faName.trim() || undefined,
      faEmail: faEmail.trim() || undefined,
      linkedin: linkedin.trim() || undefined,
      github: github.trim() || undefined,
      domain: domain as any,
      role: role.trim() || 'Member',
      phone: phone.trim() || undefined,
      avatarColor:
        initialMember?.avatarColor ||
        AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    };

    if (initialMember && onUpdate) {
      await onUpdate(initialMember.id, memberPayload);
    } else {
      onSubmit(memberPayload);
    }

    onClose();
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {initialMember ? 'Edit Member Details' : 'Add New Member'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Select from dropdowns or type manually to customize any detail
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Quick Paste Auto-Fill Dropdown */}
          <View style={styles.pasteToggleRow}>
            <TouchableOpacity
              style={[
                styles.pasteToggleBtn,
                {
                  backgroundColor: isDark ? 'rgba(5, 199, 112, 0.12)' : '#ECFDF5',
                  borderColor: isDark ? 'rgba(5, 199, 112, 0.3)' : '#A7F3D0',
                },
              ]}
              onPress={() => setIsPasteBoxOpen(!isPasteBoxOpen)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPasteBoxOpen ? 'chevron-up-circle' : 'flash'}
                size={14}
                color={colors.brandGreen}
              />
              <Text style={[styles.pasteToggleText, { color: isDark ? colors.brandGreen : colors.primary }]}>
                {isPasteBoxOpen
                  ? 'Hide Text Auto-Fill Box'
                  : '⚡ Paste Details Text to Auto-Fill'}
              </Text>
            </TouchableOpacity>
          </View>

          {isPasteBoxOpen && (
            <View
              style={[
                styles.pasteBoxContainer,
                {
                  backgroundColor: isDark ? '#0A0E0C' : '#F8FAFC',
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.pasteBoxHint, { color: colors.textSecondary }]}>
                Paste key-value text lines (Name: ..., Reg.No: ..., Branch: ...):
              </Text>
              <TextInput
                style={[
                  styles.pasteTextArea,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder={`Name: John Doe\nReg.No: RA2411003010123\nPursuing Branch: CSE Core\nDomain: Technical\nRole: Lead`}
                placeholderTextColor={colors.textMuted}
                value={pasteText}
                onChangeText={setPasteText}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.applyPasteBtn,
                  { backgroundColor: colors.brandGreen },
                  !pasteText.trim() && styles.applyPasteBtnDisabled,
                ]}
                onPress={handleApplyPastedText}
                disabled={!pasteText.trim()}
              >
                <Ionicons name="sparkles" size={14} color={isDark ? '#070707' : '#FFFFFF'} />
                <Text
                  style={[
                    styles.applyPasteBtnText,
                    { color: isDark ? '#070707' : '#FFFFFF' },
                  ]}
                >
                  Apply & Auto-Fill Form Fields
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* 1. Name & Registration */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1.2 }]}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Full Name <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.textInputWrapper,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: errors.name ? colors.danger : colors.inputBorder,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g. Purva Jain"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                {errors.name ? <Text style={[styles.errorText, { color: colors.danger }]}>{errors.name}</Text> : null}
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Reg. No / RA No</Text>
                  {autoYearNotice && (
                    <Text style={[styles.autoNoticeText, { color: colors.brandGreen }]}>
                      ⚡ {autoYearNotice}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.textInputWrapper,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g. RA2411003010123"
                    value={raNo}
                    onChangeText={handleRaNoChange}
                    autoCapitalize="characters"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* 2. Branch & Department with Dropdown & Manual Input */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <DropdownInput
                  label="Pursuing Branch"
                  value={branch}
                  onChangeText={setBranch}
                  options={BRANCH_OPTIONS}
                  placeholder="e.g. CSE Core, AIML"
                />
              </View>

              <View style={{ flex: 1 }}>
                <DropdownInput
                  label="Department"
                  value={department}
                  onChangeText={setDepartment}
                  options={DEPARTMENT_OPTIONS}
                  placeholder="e.g. C.Tech, NWC"
                />
              </View>
            </View>

            {/* 3. Year of Study & Section with Dropdown & Manual Input */}
            <View style={styles.row}>
              <View style={{ flex: 1.2 }}>
                <DropdownInput
                  label="Year of Study"
                  value={year}
                  onChangeText={setYear}
                  options={YEAR_OPTIONS}
                  placeholder="e.g. 3rd Year"
                  helperText={
                    raNo ? `(RA24=3rd, RA25=2nd, RA26=1st)` : undefined
                  }
                />
              </View>

              <View style={{ flex: 0.8 }}>
                <DropdownInput
                  label="Section"
                  value={section}
                  onChangeText={(val) => setSection(val.toUpperCase())}
                  options={SECTION_OPTIONS}
                  placeholder="e.g. G1, F2"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* 4. Club Role & Domain with Dropdown & Manual Input */}
            <View style={styles.row}>
              <View style={{ flex: 1.2 }}>
                <DropdownInput
                  label="Club Role / Designation"
                  value={role}
                  onChangeText={setRole}
                  onSelectOption={handleRoleSelect}
                  options={ROLE_OPTIONS}
                  placeholder="e.g. Technical Head"
                />
              </View>

              <View style={{ flex: 1 }}>
                <DropdownInput
                  label="Club Domain"
                  required
                  value={domain}
                  onChangeText={setDomain}
                  options={DOMAIN_OPTIONS}
                  placeholder="Technical, Creatives..."
                  error={errors.domain}
                />
              </View>
            </View>

            {/* 5. Emails */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>SRM Email ID</Text>
                <View
                  style={[
                    styles.textInputWrapper,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="pj1234@srmist.edu.in"
                    value={srmEmail}
                    onChangeText={setSrmEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Personal Email</Text>
                <View
                  style={[
                    styles.textInputWrapper,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="purva@gmail.com"
                    value={personalEmail}
                    onChangeText={setPersonalEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* 6. LinkedIn & GitHub */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>LinkedIn Profile / Handle</Text>
                <View
                  style={[
                    styles.textInputWrapper,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="linkedin.com/in/username"
                    value={linkedin}
                    onChangeText={setLinkedin}
                    autoCapitalize="none"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>GitHub Profile / Handle</Text>
                <View
                  style={[
                    styles.textInputWrapper,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="github.com/username"
                    value={github}
                    onChangeText={setGithub}
                    autoCapitalize="none"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* 7. Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Phone Number (Optional)</Text>
              <View
                style={[
                  styles.textInputWrapper,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={[styles.modalActions, { borderTopColor: colors.cardBorder }]}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? '#161E19' : '#F1F5F9',
                },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={17} color={isDark ? '#070707' : '#FFFFFF'} />
              <Text
                style={[
                  styles.submitText,
                  { color: isDark ? '#070707' : '#FFFFFF', fontWeight: '800' },
                ]}
              >
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '94%',
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
    fontSize: 11.5,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  pasteToggleRow: {
    marginTop: 10,
    marginBottom: 6,
  },
  pasteToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pasteToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pasteBoxContainer: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  pasteBoxHint: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  pasteTextArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 11.5,
    minHeight: 85,
    maxHeight: 150,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  applyPasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 6,
  },
  applyPasteBtnDisabled: {
    opacity: 0.5,
  },
  applyPasteBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  formScroll: {
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 11,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },
  autoNoticeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  required: {
    color: '#EF4444',
  },
  textInputWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    justifyContent: 'center',
  },
  input: {
    fontSize: 13,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  errorText: {
    fontSize: 11,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitText: {
    fontSize: 13,
  },
});
