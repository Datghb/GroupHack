import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { deleteClassroom } from './service';
import { classroomKeys } from './queries';

export const deleteClassroomMutation = mutationOptions({
  mutationFn: deleteClassroom,
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: classroomKeys.all });
  }
});
