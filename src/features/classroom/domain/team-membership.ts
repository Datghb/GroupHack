const LEAVE_ERRORS: Record<string, string> = {
  NOT_FOUND: 'Nhóm không tồn tại.',
  NOT_MEMBER: 'Bạn không còn là thành viên của nhóm.',
  HAS_SUBMISSION: 'Nhóm đã đăng sản phẩm nên không thể rời nhóm.',
  LEADER_TRANSFER_REQUIRED: 'Bạn cần chuyển quyền trưởng nhóm trước khi rời.'
};

const TRANSFER_ERRORS: Record<string, string> = {
  NOT_FOUND: 'Nhóm không tồn tại.',
  FORBIDDEN: 'Chỉ trưởng nhóm hiện tại được chuyển quyền.',
  SAME_LEADER: 'Hãy chọn một thành viên khác làm trưởng nhóm.',
  NOT_MEMBER: 'Người được chọn không còn là thành viên của nhóm.'
};

export function getLeaveTeamError(result: string): string | null {
  return (
    LEAVE_ERRORS[result] ??
    (result === 'LEFT' || result === 'DISBANDED' ? null : 'Không thể rời nhóm.')
  );
}

export function getTransferLeaderError(result: string): string | null {
  return (
    TRANSFER_ERRORS[result] ?? (result === 'TRANSFERRED' ? null : 'Không thể chuyển trưởng nhóm.')
  );
}
