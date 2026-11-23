-- PDF-first PYQ archive uploads. Published PDFs are publicly readable; only SmartPrep admins can write.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('pyq-papers','pyq-papers',true,52428800,array['application/pdf'])
on conflict (id) do update set public=true,file_size_limit=52428800,allowed_mime_types=array['application/pdf'];

drop policy if exists pyq_papers_pdf_public_read on storage.objects;
create policy pyq_papers_pdf_public_read on storage.objects
for select to anon,authenticated using (bucket_id='pyq-papers');

drop policy if exists pyq_papers_pdf_admin_insert on storage.objects;
create policy pyq_papers_pdf_admin_insert on storage.objects
for insert to authenticated with check (bucket_id='pyq-papers' and public.is_smartprep_admin());

drop policy if exists pyq_papers_pdf_admin_update on storage.objects;
create policy pyq_papers_pdf_admin_update on storage.objects
for update to authenticated using (bucket_id='pyq-papers' and public.is_smartprep_admin())
with check (bucket_id='pyq-papers' and public.is_smartprep_admin());

drop policy if exists pyq_papers_pdf_admin_delete on storage.objects;
create policy pyq_papers_pdf_admin_delete on storage.objects
for delete to authenticated using (bucket_id='pyq-papers' and public.is_smartprep_admin());
