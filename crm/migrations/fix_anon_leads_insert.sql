-- =====================================================
-- FIX: Allow anon role (chatbot) to INSERT leads
-- Execute this script in Supabase SQL Editor
-- =====================================================

-- The chatbot widget uses the anon key to insert leads.
-- Current RLS policies only allow 'authenticated' role.
-- This migration adds INSERT policy for 'anon' role.

-- 1. Drop any existing anon insert policy for leads
DROP POLICY IF EXISTS "anon_leads_insert" ON leads;
DROP POLICY IF EXISTS "insert_any" ON leads;
DROP POLICY IF EXISTS "chatbot_insert_leads" ON leads;

-- 2. Create INSERT policy for anon role
-- Allows chatbot to insert leads with a valid empresa_id
CREATE POLICY "chatbot_insert_leads" ON leads
    FOR INSERT
    TO anon
    WITH CHECK (empresa_id IS NOT NULL);

-- 3. Verify the policy was created
SELECT
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'leads' AND policyname = 'chatbot_insert_leads';

-- 4. Show all current policies on leads table
SELECT
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'leads'
ORDER BY cmd, policyname;
