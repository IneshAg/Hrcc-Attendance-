import { ClubMember } from '../types';

export interface ParsedMemberRow {
  name: string;
  raNo?: string;
  srmEmail?: string;
  personalEmail?: string;
  branch?: string;
  department?: string;
  year?: string;
  section?: string;
  faName?: string;
  faEmail?: string;
  linkedin?: string;
  github?: string;
  domain?: string;
  role?: string;
  phone?: string;
  isExisting?: boolean;
  existingId?: string;
}

/**
 * Parses raw text, TSV (Excel paste), or CSV into structured member rows
 */
export const parseBulkMembersText = (
  rawText: string,
  existingMembers: ClubMember[]
): ParsedMemberRow[] => {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const results: ParsedMemberRow[] = [];

  // Check if first line is a header
  const firstLine = lines[0].toLowerCase();
  const hasHeader =
    firstLine.includes('name') ||
    firstLine.includes('reg') ||
    firstLine.includes('email') ||
    firstLine.includes('domain') ||
    firstLine.includes('role');

  const dataLines = hasHeader ? lines.slice(1) : lines;

  // Header mapping if first line is CSV/TSV header
  let headers: string[] = [];
  if (hasHeader) {
    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    headers = lines[0]
      .split(delimiter)
      .map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
  }

  for (const line of dataLines) {
    // Determine delimiter: tab (Excel paste) or comma
    const delimiter = line.includes('\t') ? '\t' : ',';
    const parts = line.split(delimiter).map((p) => p.replace(/^["']|["']$/g, '').trim());

    let name = '';
    let raNo = '';
    let srmEmail = '';
    let personalEmail = '';
    let branch = '';
    let department = '';
    let year = '';
    let section = '';
    let faName = '';
    let faEmail = '';
    let linkedin = '';
    let github = '';
    let domain = 'None';
    let role = 'Member';
    let phone = '';

    if (hasHeader && headers.length > 0) {
      // Map based on header names
      headers.forEach((h, idx) => {
        const val = parts[idx] || '';
        if (h.includes('name')) name = val;
        else if (h.includes('reg') || h.includes('ra')) raNo = val;
        else if (h.includes('srm')) srmEmail = val;
        else if (h.includes('personal') || (h.includes('email') && !srmEmail)) {
          if (!srmEmail && val.includes('@srmist')) srmEmail = val;
          else personalEmail = val;
        } else if (h.includes('branch')) branch = val;
        else if (h.includes('dept') || h.includes('department')) department = val;
        else if (h.includes('year')) year = val;
        else if (h.includes('sec')) section = val;
        else if (h.includes('fa') && h.includes('email')) faEmail = val;
        else if (h.includes('fa') || h.includes('advisor')) faName = val;
        else if (h.includes('link') || h.includes('linkedin')) linkedin = val;
        else if (h.includes('git') || h.includes('github')) github = val;
        else if (h.includes('domain')) domain = val;
        else if (h.includes('role') || h.includes('designation')) role = val;
        else if (h.includes('phone') || h.includes('contact')) phone = val;
      });
    } else {
      // Format without header:
      // Case 1: Simple list of names with optional role/domain (e.g. "Purva Jain - Vice President" or "Inesh Agarwal, Tech Head")
      const firstCol = parts[0] || '';
      if (parts.length === 1) {
        // e.g. "Purva Jain - Vice President" or "* Purva Jain"
        const cleanLine = firstCol.replace(/^[*•\-]\s*/, '').trim();
        if (cleanLine.includes(' - ')) {
          const [n, r] = cleanLine.split(' - ');
          name = n.trim();
          role = r ? r.trim() : 'Member';
        } else if (cleanLine.includes('(') && cleanLine.includes(')')) {
          const match = cleanLine.match(/^(.*?)\s*\((.*?)\)$/);
          if (match) {
            name = match[1].trim();
            role = match[2].trim();
          } else {
            name = cleanLine;
          }
        } else {
          name = cleanLine;
        }
      } else {
        // Multi-column row without header (default column order):
        // Name, Reg.No, SRM Email, Personal Email, Branch, Department, Year, Section, FA Name, FA Email, Domain, Role
        name = parts[0] || '';
        raNo = parts[1] || '';
        srmEmail = parts[2] || '';
        personalEmail = parts[3] || '';
        branch = parts[4] || '';
        department = parts[5] || '';
        year = parts[6] || '';
        section = parts[7] || '';
        faName = parts[8] || '';
        faEmail = parts[9] || '';
        domain = parts[10] || 'None';
        role = parts[11] || 'Member';
      }
    }

    if (!name || !name.trim()) continue;

    // Automatic role to domain mapping if domain is not specified
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('president') || lowerRole.includes('secretary')) {
      domain = 'None';
    } else if (lowerRole.includes('tech')) {
      domain = 'Technical';
    } else if (lowerRole.includes('creative')) {
      domain = 'Creatives';
    } else if (lowerRole.includes('corporate')) {
      domain = 'Corporate';
    }

    // Match with existing members to see if this is an UPDATE or a NEW member
    const existing = existingMembers.find((m) => {
      if (raNo && m.raNo && m.raNo.toUpperCase() === raNo.toUpperCase()) return true;
      return m.name.toLowerCase().trim() === name.toLowerCase().trim();
    });

    results.push({
      name: name.trim(),
      raNo: raNo ? raNo.trim().toUpperCase() : existing?.raNo || '',
      srmEmail: srmEmail.trim() || existing?.srmEmail || '',
      personalEmail: personalEmail.trim() || existing?.personalEmail || '',
      branch: branch.trim() || existing?.branch || '',
      department: department.trim() || existing?.department || '',
      year: year.trim() || existing?.year || '',
      section: section.trim() || existing?.section || '',
      faName: faName.trim() || existing?.faName || '',
      faEmail: faEmail.trim() || existing?.faEmail || '',
      linkedin: linkedin.trim() || existing?.linkedin || '',
      github: github.trim() || existing?.github || '',
      domain: domain !== 'None' ? domain : existing?.domain || 'None',
      role: role.trim() !== 'Member' ? role.trim() : existing?.role || role.trim(),
      phone: phone.trim() || existing?.phone || '',
      isExisting: Boolean(existing),
      existingId: existing?.id,
    });
  }

  return results;
};
