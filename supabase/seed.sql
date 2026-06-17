insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'demo@newtonx.ai',
  crypt('newtonx-demo-password', gen_salt('bf')),
  now(),
  '{"full_name":"Sarah Chen","company_name":"Apex Cloud Systems"}'::jsonb,
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.organizations (id, name, slug, industry_code, is_demo)
values (
  '10000000-0000-0000-0000-000000000001',
  'Apex Cloud Systems',
  'apex-cloud-systems-demo',
  'NAICS-541511',
  true
)
on conflict (id) do nothing;

insert into public.profiles (id, full_name, company_name, role, onboarding_complete)
values (
  '00000000-0000-0000-0000-000000000001',
  'Sarah Chen',
  'Apex Cloud Systems',
  'client_admin',
  true
)
on conflict (id) do update set onboarding_complete = true;

insert into public.organization_members (organization_id, user_id, role)
values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'client_admin'
)
on conflict do nothing;

insert into public.research_projects (
  id,
  organization_id,
  owner_id,
  title,
  status,
  decision_context,
  due_at
)
values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Cloud-native ERP adoption in DACH manufacturing',
  'report_ready',
  'Friday executive planning readout for mid-market expansion prioritization.',
  now() + interval '3 days'
)
on conflict (id) do nothing;

insert into public.research_questions (
  id,
  project_id,
  original_question,
  canonical_question,
  question_fingerprint,
  normalized_scope
)
values (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'What is the market penetration and buyer satisfaction of cloud-native ERP software among mid-market manufacturing companies in the DACH region?',
  'Assess cloud-native ERP penetration, satisfaction, adoption drivers, and friction among DACH mid-market manufacturers.',
  'erp-dach-manufacturing-midmarket-adoption-v1',
  '{"industry":"Manufacturing","market":"Cloud-native ERP","geography":"DACH","audience":"CIOs, COOs, ERP transformation leaders","timeframe":"2026 planning cycle"}'::jsonb
)
on conflict (id) do nothing;

insert into public.research_briefs (
  id,
  project_id,
  industry_code,
  geography_code,
  market_segment,
  company_size_band,
  research_type,
  decision_stakes,
  structured_brief,
  methodology
)
values (
  '40000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'NAICS-31-33',
  'ISO-3166-DACH',
  'cloud-native ERP',
  '250-5000 employees',
  'market adoption and buyer satisfaction',
  'internal executive planning',
  '{"objective":"Prioritize DACH ERP expansion messaging and sales enablement.","keyQuestions":["How penetrated is cloud-native ERP in target accounts?","Which adoption drivers matter most?","Where are buyers dissatisfied with incumbent systems?","Which segments warrant human validation before board use?"],"segments":["Germany 250-999 employees","Germany 1000-5000 employees","Austria and Switzerland 250-5000 employees"],"outputs":["executive summary","adoption funnel","driver ranking","segment comparison","validation gaps"]}'::jsonb,
  '{"panelSize":120,"panelType":"AI-simulated directional read","confidencePolicy":"Synthetic responses are useful for scoping and hypothesis ranking; human validation required before external citation.","questionStyle":"Structured survey with targeted qualitative probes."}'::jsonb
)
on conflict (id) do nothing;

insert into public.report_sections (project_id, section_key, title, content, confidence_level, evidence_state, citations, sort_order)
values
  ('20000000-0000-0000-0000-000000000001', 'executive_summary', 'Executive Summary', 'Cloud-native ERP is moving from exploratory pilots into active replacement planning across DACH mid-market manufacturing, but buyers remain cautious where integration risk and data residency concerns are unresolved.', 0.78, 'ai_simulated', '[{"label":"Synthetic panel n=120","type":"methodology"}]'::jsonb, 1),
  ('20000000-0000-0000-0000-000000000001', 'key_findings', 'Key Findings', 'Adoption intent is strongest among manufacturers with distributed plants and recent cloud infrastructure programs. The primary friction is not awareness; it is migration risk, partner capability, and uncertainty about total cost of ownership.', 0.74, 'ai_simulated', '[{"label":"Virtual expert responses","type":"synthetic"}]'::jsonb, 2),
  ('20000000-0000-0000-0000-000000000001', 'validation_gaps', 'Validation Gaps', 'Human validation is recommended for 2026 budget allocation, SAP migration timing, and country-specific compliance claims before board or market-facing use.', 0.69, 'ai_simulated', '[{"label":"Confidence threshold policy","type":"methodology"}]'::jsonb, 3)
on conflict do nothing;

insert into public.report_metrics (project_id, metric_key, title, chart_type, data, segment_cuts, confidence_interval, evidence_state)
values
  ('20000000-0000-0000-0000-000000000001', 'adoption_stage', 'Cloud-native ERP adoption stage', 'bar', '[{"name":"Live deployment","value":28},{"name":"Active pilot","value":24},{"name":"Budgeted in 12 months","value":31},{"name":"Monitoring only","value":17}]'::jsonb, '{"segment":"all"}'::jsonb, '{"low":0.68,"high":0.82}'::jsonb, 'ai_simulated'),
  ('20000000-0000-0000-0000-000000000001', 'purchase_drivers', 'Top purchase drivers', 'radar', '[{"name":"Integration speed","value":82},{"name":"Data residency","value":71},{"name":"TCO clarity","value":67},{"name":"Partner depth","value":63},{"name":"AI roadmap","value":49}]'::jsonb, '{"segment":"decision makers"}'::jsonb, '{"low":0.64,"high":0.79}'::jsonb, 'ai_simulated'),
  ('20000000-0000-0000-0000-000000000001', 'satisfaction_by_segment', 'Satisfaction by company size', 'line', '[{"name":"250-999","value":62},{"name":"1000-2499","value":58},{"name":"2500-5000","value":51}]'::jsonb, '{"segment":"company_size_band"}'::jsonb, '{"low":0.59,"high":0.75}'::jsonb, 'ai_simulated')
on conflict do nothing;

insert into public.audit_events (organization_id, project_id, actor_id, event_type, event_payload)
values (
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'demo.seeded',
  '{"note":"Seeded NewtonX Hub POC demo project"}'::jsonb
)
on conflict do nothing;
