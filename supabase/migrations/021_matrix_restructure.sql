-- =========================================================
-- 021: Rediseño de la matriz de auditoría (ISO 19011/9001)
-- =========================================================
-- Cambios pedidos por el negocio:
--  - El informe necesita "Objetivo" y "Criterio de auditoría" a nivel de
--    cabecera (audits), mostrados al inicio del PDF.
--  - Cada punto de la matriz agrega "Categoría del hallazgo" (conforme /
--    observación / no conformidad menor / no conformidad mayor / oportunidad
--    de mejora) para poder clasificar y contar el resultado de la auditoría.
--  - Se elimina el campo "acción" (plan de mejora) de audit_findings: ya no
--    se solicita al auditor durante la auditoría.
--  - La evidencia ahora admite un tercer tipo 'text' (evidencia redactada
--    directamente, sin archivo ni enlace).

alter table public.audits
  add column if not exists objective text,
  add column if not exists audit_criteria text;

comment on column public.audits.objective is 'Objetivo de la auditoría, mostrado al inicio del informe.';
comment on column public.audits.audit_criteria is 'Criterio utilizado para auditar (normas, manual de calidad, procedimientos, contratos, etc.), mostrado al inicio del informe.';

alter table public.audit_findings
  add column if not exists category text not null default '';

comment on column public.audit_findings.category is 'Categoría del hallazgo: Conforme, Observación, No conformidad menor, No conformidad mayor u Oportunidad de mejora.';

alter table public.audit_findings
  drop column if exists action;

-- ---------- audit_evidence: agrega 'text' (evidencia redactada) ----------
alter table public.audit_evidence
  add column if not exists content_text text;

comment on column public.audit_evidence.content_text is 'Texto redactado por el auditor cuando evidence_type = ''text'' (sin archivo ni enlace).';

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'audit_evidence_type_check'
  ) then
    alter table public.audit_evidence drop constraint audit_evidence_type_check;
  end if;

  alter table public.audit_evidence
    add constraint audit_evidence_type_check check (evidence_type in ('file', 'link', 'text'));

  if exists (
    select 1 from pg_constraint where conname = 'audit_evidence_shape_check'
  ) then
    alter table public.audit_evidence drop constraint audit_evidence_shape_check;
  end if;

  alter table public.audit_evidence
    add constraint audit_evidence_shape_check check (
      (evidence_type = 'file' and storage_path is not null and file_name is not null and external_url is null and content_text is null)
      or
      (evidence_type = 'link' and external_url is not null and storage_path is null and file_name is null and content_text is null)
      or
      (evidence_type = 'text' and content_text is not null and storage_path is null and file_name is null and external_url is null)
    );
end $$;
