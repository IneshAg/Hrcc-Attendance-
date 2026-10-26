import { ClubMember } from '../types';

export type RoleTier = 'executive' | 'head' | 'lead' | 'member';

export interface RoleBadgeConfig {
  tier: RoleTier;
  tierTag: string;
  label: string;
  icon: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  rank: number;
}

/**
 * Returns complete styling, iconography, and hierarchy rank for a given role and domain
 */
export const getRoleBadgeConfig = (
  role: string = 'Member',
  domain: string = 'None'
): RoleBadgeConfig => {
  const r = (role || 'Member').trim();
  const lower = r.toLowerCase();

  // 1. President / Chairperson
  if (
    lower.includes('president') &&
    !lower.includes('vice')
  ) {
    return {
      tier: 'executive',
      tierTag: 'PRESIDENT',
      label: r || 'President',
      icon: 'ribbon',
      badgeBg: '#FEF3C7',
      badgeBorder: '#FCD34D',
      textColor: '#B45309',
      rank: 1,
    };
  }

  // 2. Vice President
  if (lower.includes('vice president') || lower === 'vp') {
    return {
      tier: 'executive',
      tierTag: 'VICE PRESIDENT',
      label: 'Vice President',
      icon: 'shield-checkmark',
      badgeBg: '#F5F3FF',
      badgeBorder: '#DDD6FE',
      textColor: '#6D28D9',
      rank: 2,
    };
  }

  // 3. Secretary
  if (lower.includes('joint') && (lower.includes('sec') || lower.includes('secretary'))) {
    return {
      tier: 'executive',
      tierTag: 'JOINT SEC',
      label: 'Joint Secretary',
      icon: 'documents',
      badgeBg: '#F0FDFA',
      badgeBorder: '#99F6E4',
      textColor: '#0F766E',
      rank: 4,
    };
  }

  if (lower.includes('secretary') || lower === 'sec') {
    return {
      tier: 'executive',
      tierTag: 'SECRETARY',
      label: 'Secretary',
      icon: 'file-tray-full',
      badgeBg: '#EFF6FF',
      badgeBorder: '#BFDBFE',
      textColor: '#1D4ED8',
      rank: 3,
    };
  }

  // 4. Domain Heads
  if (lower.includes('head')) {
    let icon = 'star';
    let badgeBg = '#FEF3C7';
    let badgeBorder = '#FDE68A';
    let textColor = '#92400E';

    if (lower.includes('tech') || domain === 'Technical') {
      icon = 'terminal';
      badgeBg = '#EEF2FF';
      badgeBorder = '#C7D2FE';
      textColor = '#4338CA';
    } else if (lower.includes('corp') || domain === 'Corporate') {
      icon = 'business';
      badgeBg = '#ECFDF5';
      badgeBorder = '#A7F3D0';
      textColor = '#047857';
    } else if (lower.includes('creat') || domain === 'Creatives') {
      icon = 'color-palette';
      badgeBg = '#FDF2F8';
      badgeBorder = '#FBCFE8';
      textColor = '#BE185D';
    }

    return {
      tier: 'head',
      tierTag: 'HEAD',
      label: r,
      icon,
      badgeBg,
      badgeBorder,
      textColor,
      rank: 5,
    };
  }

  // 5. Domain Leads
  if (lower.includes('lead')) {
    let icon = 'flash';
    let badgeBg = '#EFF6FF';
    let badgeBorder = '#DBEAFE';
    let textColor = '#1E40AF';

    if (lower.includes('tech') || domain === 'Technical') {
      icon = 'code-slash';
      badgeBg = '#E0F2FE';
      badgeBorder = '#BAE6FD';
      textColor = '#0369A1';
    } else if (lower.includes('corp') || domain === 'Corporate') {
      icon = 'trending-up';
      badgeBg = '#F0FDF4';
      badgeBorder = '#BBF7D0';
      textColor = '#15803D';
    } else if (lower.includes('creat') || domain === 'Creatives') {
      icon = 'sparkles';
      badgeBg = '#FFF1F2';
      badgeBorder = '#FECDD3';
      textColor = '#BE123C';
    }

    return {
      tier: 'lead',
      tierTag: 'LEAD',
      label: r,
      icon,
      badgeBg,
      badgeBorder,
      textColor,
      rank: 6,
    };
  }

  // 6. Member
  return {
    tier: 'member',
    tierTag: 'MEMBER',
    label: r || 'Member',
    icon: 'person',
    badgeBg: '#F8FAFC',
    badgeBorder: '#E2E8F0',
    textColor: '#475569',
    rank: 7,
  };
};

/**
 * Sorts members by HRCC hierarchy:
 * 1. President
 * 2. Vice President
 * 3. Secretary
 * 4. Joint Secretary
 * 5. Heads (Tech, Corporate, Creatives)
 * 6. Leads (Tech, Corporate, Creatives)
 * 7. Members
 * (Within same rank, sorts by Domain, then Name)
 */
export const sortMembersByHierarchy = (members: ClubMember[]): ClubMember[] => {
  return [...members].sort((a, b) => {
    const configA = getRoleBadgeConfig(a.role, a.domain);
    const configB = getRoleBadgeConfig(b.role, b.domain);

    if (configA.rank !== configB.rank) {
      return configA.rank - configB.rank;
    }

    if (a.domain !== b.domain) {
      return (a.domain || '').localeCompare(b.domain || '');
    }

    return (a.name || '').localeCompare(b.name || '');
  });
};
