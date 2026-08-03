update public.assignment_checkpoints
set
  title = 'Checkpoint ' || (position + 1),
  description = '';

notify pgrst, 'reload schema';
