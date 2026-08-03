import type { Activity, Assignment, Classroom, Team } from '../domain/types';

const now = new Date();
const days = (value: number) => new Date(now.getTime() + value * 86_400_000);

export const classrooms: Classroom[] = [
  {
    id: 'web-2026',
    name: 'Phát triển Web hiện đại',
    description: 'Xây dựng sản phẩm web theo nhóm trong 8 tuần.',
    teacherId: 'teacher-1',
    archived: false,
    studentCount: 28,
    teamCount: 5
  },
  {
    id: 'ux-2026',
    name: 'Thiết kế trải nghiệm người dùng',
    description: 'Nghiên cứu, tạo prototype và kiểm thử với người dùng.',
    teacherId: 'teacher-1',
    archived: false,
    studentCount: 24,
    teamCount: 4
  },
  {
    id: 'data-2026',
    name: 'Kể chuyện bằng dữ liệu',
    description: 'Biến dữ liệu thành câu chuyện trực quan có ý nghĩa.',
    teacherId: 'teacher-2',
    archived: false,
    studentCount: 31,
    teamCount: 6
  }
];

export const assignment: Assignment = {
  id: 'assignment-1',
  classroomId: 'web-2026',
  title: 'Sản phẩm cộng đồng số',
  description: 'Thiết kế và triển khai một sản phẩm giải quyết vấn đề thật trong cộng đồng.',
  status: 'ACTIVE',
  startAt: days(-14),
  endAt: days(14),
  checkpoints: [
    {
      id: 'cp-1',
      assignmentId: 'assignment-1',
      title: 'Nghiên cứu cá nhân',
      type: 'INDIVIDUAL',
      order: 1,
      opensAt: days(-14),
      dueAt: days(-10),
      closesAt: days(-8)
    },
    {
      id: 'cp-2',
      assignmentId: 'assignment-1',
      title: 'Đề xuất ý tưởng nhóm',
      type: 'TEAM',
      order: 2,
      opensAt: days(-10),
      dueAt: days(-5),
      closesAt: days(-3)
    },
    {
      id: 'cp-3',
      assignmentId: 'assignment-1',
      title: 'Prototype tương tác',
      type: 'TEAM',
      order: 3,
      opensAt: days(-4),
      dueAt: days(4),
      closesAt: days(7)
    },
    {
      id: 'cp-4',
      assignmentId: 'assignment-1',
      title: 'Phản tư cá nhân',
      type: 'INDIVIDUAL',
      order: 4,
      opensAt: days(7),
      dueAt: days(12),
      closesAt: days(14)
    }
  ]
};

export const teams: Team[] = [
  {
    id: 'alpha',
    classroomId: 'web-2026',
    name: 'Nhóm Alpha',
    description: 'Nền tảng kết nối tình nguyện viên.',
    leaderId: 'student-1',
    memberIds: ['student-1', 'student-2', 'student-3', 'student-4'],
    capacity: 5,
    open: true,
    archived: false,
    progress: 85,
    completedCheckpoints: 2,
    totalCheckpoints: 4,
    lateCheckpoints: 0,
    currentCheckpoint: 'Prototype tương tác',
    lastActivityAt: days(-0.1)
  },
  {
    id: 'beta',
    classroomId: 'web-2026',
    name: 'Nhóm Beta',
    description: 'Bản đồ không gian học tập công cộng.',
    leaderId: 'student-5',
    memberIds: ['student-5', 'student-6', 'student-7'],
    capacity: 5,
    open: true,
    archived: false,
    progress: 70,
    completedCheckpoints: 2,
    totalCheckpoints: 4,
    lateCheckpoints: 0,
    currentCheckpoint: 'Prototype tương tác',
    lastActivityAt: days(-1)
  },
  {
    id: 'gamma',
    classroomId: 'web-2026',
    name: 'Nhóm Gamma',
    description: 'Theo dõi thực phẩm dư thừa trong khu phố.',
    leaderId: 'student-8',
    memberIds: ['student-8', 'student-9'],
    capacity: 4,
    open: true,
    archived: false,
    progress: 45,
    completedCheckpoints: 1,
    totalCheckpoints: 4,
    lateCheckpoints: 1,
    currentCheckpoint: 'Đề xuất ý tưởng nhóm',
    lastActivityAt: days(-3)
  },
  {
    id: 'delta',
    classroomId: 'web-2026',
    name: 'Nhóm Delta',
    description: 'Thư viện trao đổi đồ dùng sinh viên.',
    leaderId: 'student-10',
    memberIds: ['student-10', 'student-11', 'student-12'],
    capacity: 5,
    open: false,
    archived: false,
    progress: 30,
    completedCheckpoints: 1,
    totalCheckpoints: 4,
    lateCheckpoints: 1,
    currentCheckpoint: 'Đề xuất ý tưởng nhóm',
    lastActivityAt: days(-9)
  }
];

export const activities: Activity[] = [
  {
    id: 'a1',
    teamId: 'alpha',
    actor: 'Nguyễn An',
    message: 'cập nhật Prototype tương tác từ 50% lên 75%',
    createdAt: days(-0.1)
  },
  {
    id: 'a2',
    teamId: 'beta',
    actor: 'Trần Minh',
    message: 'thêm liên kết prototype',
    createdAt: days(-0.4)
  },
  {
    id: 'a3',
    teamId: 'gamma',
    actor: 'Nhóm Gamma',
    message: 'đã nộp Đề xuất ý tưởng nhóm trễ hạn',
    createdAt: days(-1.2)
  },
  {
    id: 'a4',
    teamId: 'alpha',
    actor: 'Giảng viên',
    message: 'xác nhận Đề xuất ý tưởng nhóm hoàn thành',
    createdAt: days(-2)
  }
];
