-- Cleanup: remove any sessions scheduled in Q1 2026 (safety net)
DELETE FROM sessions WHERE date >= '2026-01-01' AND date <= '2026-03-31';
