INSERT INTO public.businesses (id, slug, name, city) VALUES 
('11111111-1111-1111-1111-111111111111', 'test-business-a', 'Test Business A', 'Monroe'),
('22222222-2222-2222-2222-222222222222', 'test-business-b', 'Test Business B', 'Monroe')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.modules (business_id, config) VALUES
('11111111-1111-1111-1111-111111111111', '{"pos": true, "crm": true, "eforms": true, "keyrings": true, "directory": true, "themes": true, "automations": true}'::jsonb),
('22222222-2222-2222-2222-222222222222', '{"pos": true, "crm": true, "eforms": true, "keyrings": true, "directory": true, "themes": true, "automations": true}'::jsonb)
ON CONFLICT (business_id) DO UPDATE SET config = EXCLUDED.config;
