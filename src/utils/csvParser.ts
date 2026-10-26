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
 * Parses a single block of Key: Value text (e.g. copied from WhatsApp, forms, or messages)
 */
export const parseKeyValueText = (rawText: string): Partial<ClubMember> => {
  if (!rawText || !rawText.trim()) return {};

  const result: Partial<ClubMember> = {};
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const val = line.slice(colonIdx + 1).trim();
    if (!val) continue;

    if (key.includes('name') && !key.includes('fa')) {
      result.name = val;
    } else if (
      key.includes('reg') ||
      key.includes('ra no') ||
      key.includes('ra.no') ||
      key.startsWith('ra')
    ) {
      result.raNo = val.toUpperCase();
    } else if (key.includes('srm')) {
      result.srmEmail = val;
    } else if (key.includes('personal')) {
      result.personalEmail = val;
    } else if (key.includes('branch')) {
      result.branch = val;
    } else if (key.includes('dept') || key.includes('department')) {
      result.department = val;
    } else if (key.includes('year')) {
      result.year = val;
    } else if (key.includes('sec') || key.includes('section')) {
      result.section = val.toUpperCase();
    } else if (key.includes('fa') && key.includes('email')) {
      result.faEmail = val;
    } else if (key.includes('fa') || key.includes('advisor')) {
      result.faName = val;
    } else if (key.includes('link') || key.includes('linkedin')) {
      result.linkedin = val;
    } else if (key.includes('git') || key.includes('github')) {
      result.github = val;
    } else if (key.includes('role') || key.includes('designation')) {
      result.role = val;
    } else if (key.includes('domain')) {
      result.domain = val;
    } else if (key.includes('phone') || key.includes('contact') || key.includes('mobile')) {
      result.phone = val;
    } else if (key.includes('email') && !result.srmEmail) {
      if (val.includes('@srmist')) result.srmEmail = val;
      else result.personalEmail = val;
    }
  }

  // Automatic domain mapping if role was extracted
  if (result.role && (!result.domain || result.domain === 'None')) {
    const lowerRole = result.role.toLowerCase();
    if (lowerRole.includes('president') || lowerRole.includes('secretary')) {
      result.domain = 'None';
    } else if (lowerRole.includes('tech')) {
      result.domain = 'Technical';
    } else if (lowerRole.includes('creative')) {
      result.domain = 'Creatives';
    } else if (lowerRole.includes('corporate')) {
      result.domain = 'Corporate';
    }
  }

  return result;
};

/**
 * Parses raw text, Key-Value blocks, TSV (Excel paste), or CSV into structured member rows
 */
export const parseBulkMembersText = (
  rawText: string,
  existingMembers: ClubMember[]
): ParsedMemberRow[] => {
  if (!rawText || !rawText.trim()) return [];

  // Check if text is in Key-Value format (e.g. contains 'Name:' or 'Reg.No:' or 'SRM email:')
  const isKeyValueFormat = /(name|reg|srm|branch|dept|fa)\s*:/i.test(rawText);

  if (isKeyValueFormat) {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsedBlocks: Partial<ClubMember>[] = [];
    let current: Partial<ClubMember> = {};

    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim().toLowerCase();
      const val = line.slice(colonIdx + 1).trim();

      // If we encounter a new 'name' and current already has a name, start a new block
      if (key === 'name' && current.name) {
        parsedBlocks.push(current);
        current = {};
      }

      if (key.includes('name') && !key.includes('fa')) current.name = val;
      else if (key.includes('reg') || key.includes('ra no') || key.includes('ra.no') || key.startsWith('ra')) current.raNo = val.toUpperCase();
      else if (key.includes('srm')) current.srmEmail = val;
      else if (key.includes('personal')) current.personalEmail = val;
      else if (key.includes('branch')) current.branch = val;
      else if (key.includes('dept') || key.includes('department')) current.department = val;
      else if (key.includes('year')) current.year = val;
      else if (key.includes('sec') || key.includes('section')) current.section = val.toUpperCase();
      else if (key.includes('fa') && key.includes('email')) current.faEmail = val;
      else if (key.includes('fa') || key.includes('advisor')) current.faName = val;
      else if (key.includes('link') || key.includes('linkedin')) current.linkedin = val;
      else if (key.includes('git') || key.includes('github')) current.github = val;
      else if (key.includes('role')) current.role = val;
      else if (key.includes('domain')) current.domain = val;
      else if (key.includes('phone') || key.includes('contact')) current.phone = val;
      else if (key.includes('email') && !current.srmEmail) {
        if (val.includes('@srmist')) current.srmEmail = val;
        else current.personalEmail = val;
      }
    }

    if (current.name) {
      parsedBlocks.push(current);
    }

    if (parsedBlocks.length > 0) {
      return parsedBlocks.map((b) => {
        const name = (b.name || '').trim();
        const raNo = (b.raNo || '').trim().toUpperCase();

        // Match with existing member by Reg.No or Name
        const existing = existingMembers.find((m) => {
          if (raNo && m.raNo && m.raNo.toUpperCase() === raNo) return true;
          return m.name.toLowerCase().trim() === name.toLowerCase().trim();
        });

        let domain = b.domain || existing?.domain || 'None';
        let role = b.role || existing?.role || 'Member';

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

        return {
          name,
          raNo: raNo || existing?.raNo || '',
          srmEmail: b.srmEmail?.trim() || existing?.srmEmail || '',
          personalEmail: b.personalEmail?.trim() || existing?.personalEmail || '',
          branch: b.branch?.trim() || existing?.branch || '',
          department: b.department?.trim() || existing?.department || '',
          year: b.year?.trim() || existing?.year || '',
          section: b.section?.trim() || existing?.section || '',
          faName: b.faName?.trim() || existing?.faName || '',
          faEmail: b.faEmail?.trim() || existing?.faEmail || '',
          linkedin: b.linkedin?.trim() || existing?.linkedin || '',
          github: b.github?.trim() || existing?.github || '',
          domain,
          role,
          phone: b.phone?.trim() || existing?.phone || '',
          isExisting: Boolean(existing),
          existingId: existing?.id,
        };
      });
    }
  }

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
