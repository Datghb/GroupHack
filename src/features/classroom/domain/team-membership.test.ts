import { describe, expect, it } from 'vitest';
import { getLeaveTeamError, getTransferLeaderError } from './team-membership';

describe('assignment team membership errors', () => {
  it('explains why a student cannot leave a team', () => {
    expect(getLeaveTeamError('HAS_SUBMISSION')).toContain('đã đăng sản phẩm');
    expect(getLeaveTeamError('LEADER_TRANSFER_REQUIRED')).toContain('chuyển quyền');
    expect(getLeaveTeamError('NOT_MEMBER')).toContain('không còn');
    expect(getLeaveTeamError('LEFT')).toBeNull();
    expect(getLeaveTeamError('DISBANDED')).toBeNull();
  });

  it('explains invalid leader transfers', () => {
    expect(getTransferLeaderError('FORBIDDEN')).toContain('trưởng nhóm');
    expect(getTransferLeaderError('NOT_MEMBER')).toContain('thành viên');
    expect(getTransferLeaderError('TRANSFERRED')).toBeNull();
  });
});
