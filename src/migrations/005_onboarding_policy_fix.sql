begin;

drop policy if exists "Academies are readable by members" on public.academies;

create policy "Academies are readable by members or creator"
on public.academies
for select
to authenticated
using (
  created_by = auth.uid()
  or public.can_view_academy(id)
);

commit;
