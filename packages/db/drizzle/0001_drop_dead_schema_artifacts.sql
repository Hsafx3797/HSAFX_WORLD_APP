-- Migration: Drop dead schema artifacts
-- Reference: 90_FINAL_IMPLEMENTATION_PLAN.md Task INFRA-DB-CLEAN

-- 1. Drop wasmUrl column from tool_versions (zero references)
ALTER TABLE "tool_versions" DROP COLUMN IF EXISTS "wasm_url";

-- 2. Drop unused enums if they exist in the database
-- These were defined in schema but never used by any column
DROP TYPE IF EXISTS "identifier_type";
DROP TYPE IF EXISTS "permission_target";
