update public.classroom_courses
set name = case position
  when 1 then 'Khóa 3'
  when 2 then 'Khóa 4'
end
where (position = 1 and name = 'Khóa 1')
   or (position = 2 and name = 'Khóa 2');

notify pgrst, 'reload schema';
