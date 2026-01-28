-- =====================================================
-- Storage bucket para documentos do investidor
-- Data: 28/01/2026
-- =====================================================

-- Criar bucket (executar no painel do Supabase ou via API)
-- Nota: buckets não podem ser criados via SQL direto, usar API ou painel

-- Políticas de storage (para quando o bucket já existir)
-- Estas são referências - aplicar no painel Storage > Policies

/*
Bucket name: Investidores
Public: true

Políticas necessárias:

1. SELECT policy:
   Name: Allow authenticated reads
   Allowed operation: SELECT
   Target roles: authenticated
   USING expression: bucket_id = 'Investidores'

2. INSERT policy:
   Name: Allow authenticated uploads
   Allowed operation: INSERT
   Target roles: authenticated
   WITH CHECK expression: bucket_id = 'Investidores'

3. DELETE policy:
   Name: Allow authenticated deletes
   Allowed operation: DELETE
   Target roles: authenticated
   USING expression: bucket_id = 'Investidores'
*/
