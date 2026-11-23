create or replace function public.admin_upsert_question(p_question jsonb)
returns uuid language plpgsql security definer set search_path=''
as $function$
declare v_id uuid; v_source_type text:=coalesce(p_question->>'source_type','practice'); v_tags text[]:=array[]::text[];
begin
 if not public.is_smartprep_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 if jsonb_typeof(p_question->'options')<>'array' or jsonb_array_length(p_question->'options')<>4 then raise exception 'Exactly four options are required'; end if;
 if coalesce(p_question->>'answer_key','') not in ('A','B','C','D') then raise exception 'Answer key must be A, B, C or D'; end if;
 if nullif(trim(p_question->>'prompt'),'') is null then raise exception 'Question prompt is required'; end if;
 if nullif(p_question->>'chapter_id','') is null then raise exception 'Chapter is required'; end if;
 if v_source_type not in ('practice','pyq','sample','school_exam') then raise exception 'Invalid question source type'; end if;
 if jsonb_typeof(p_question->'tags')='array' then select coalesce(array_agg(value),'{}') into v_tags from jsonb_array_elements_text(p_question->'tags'); end if;
 if nullif(p_question->>'id','') is null then
  insert into public.questions(chapter_id,topic_id,prompt,options,answer_key,explanation,difficulty,language,access_tier,is_published,source_type,source_year,source_exam,source_question_number,source_reference,question_image_path,tags)
  values((p_question->>'chapter_id')::uuid,nullif(p_question->>'topic_id','')::uuid,p_question->>'prompt',p_question->'options',p_question->>'answer_key',p_question->>'explanation',coalesce(p_question->>'difficulty','medium'),coalesce(p_question->>'language','en'),coalesce(p_question->>'access_tier','free'),coalesce((p_question->>'is_published')::boolean,false),v_source_type,nullif(p_question->>'source_year','')::integer,nullif(p_question->>'source_exam',''),nullif(p_question->>'source_question_number','')::integer,nullif(p_question->>'source_reference',''),nullif(p_question->>'question_image_path',''),v_tags)
  returning id into v_id;
 else
  v_id:=(p_question->>'id')::uuid;
  update public.questions set chapter_id=(p_question->>'chapter_id')::uuid,topic_id=nullif(p_question->>'topic_id','')::uuid,prompt=p_question->>'prompt',options=p_question->'options',answer_key=p_question->>'answer_key',explanation=p_question->>'explanation',difficulty=coalesce(p_question->>'difficulty','medium'),language=coalesce(p_question->>'language','en'),access_tier=coalesce(p_question->>'access_tier','free'),is_published=coalesce((p_question->>'is_published')::boolean,false),source_type=v_source_type,source_year=nullif(p_question->>'source_year','')::integer,source_exam=nullif(p_question->>'source_exam',''),source_question_number=nullif(p_question->>'source_question_number','')::integer,source_reference=nullif(p_question->>'source_reference',''),question_image_path=nullif(p_question->>'question_image_path',''),tags=v_tags,updated_at=now() where id=v_id;
  if not found then raise exception 'Question not found'; end if;
 end if;
 return v_id;
end;
$function$;

create or replace function public.admin_get_questions(p_chapter_id uuid default null)
returns setof jsonb language plpgsql security definer set search_path=''
as $function$
begin
 if not public.is_smartprep_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 return query select jsonb_build_object('id',q.id,'chapter_id',q.chapter_id,'topic_id',q.topic_id,'prompt',q.prompt,'options',q.options,'answer_key',q.answer_key,'explanation',q.explanation,'difficulty',q.difficulty,'language',q.language,'access_tier',q.access_tier,'is_published',q.is_published,'source_type',q.source_type,'source_year',q.source_year,'source_exam',q.source_exam,'source_question_number',q.source_question_number,'source_reference',q.source_reference,'question_image_path',q.question_image_path,'tags',q.tags)
 from public.questions q where p_chapter_id is null or q.chapter_id=p_chapter_id order by q.created_at desc;
end;
$function$;
