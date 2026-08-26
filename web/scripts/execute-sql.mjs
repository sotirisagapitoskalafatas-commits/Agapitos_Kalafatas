import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jbmccmokfvyvijmumuzn.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibWNjbW9rZnZ5dmlqbXVtdXpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzY3NjM5NywiZXhwIjoyMTAzMjUyMzk3fQ.0_TWElpFrZzRP0QV9fX-Rboe7319YDAWSpX-NrrH1Eg';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node execute-sql.mjs <sql-file1> [sql-file2] ...');
  process.exit(1);
}

for (const file of files) {
  const sqlPath = resolve(file);
  console.log(`\n--- Executing: ${sqlPath} ---`);
  const sql = readFileSync(sqlPath, 'utf8');
  
  const { data, error } = await supabase.rpc('exec_sql', { query: sql }).single();
  
  if (error) {
    // If exec_sql doesn't exist, try alternative approaches
    if (error.message?.includes('function') && error.message?.includes('does not exist')) {
      console.log('exec_sql function not found. Trying raw SQL via query...');
      
      // Try using the SQL endpoint directly
      const response = await fetch(`${SUPABASE_URL}/pg`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      });
      
      const result = await response.text();
      console.log(`Response (${response.status}):`, result.substring(0, 300));
      
      if (!response.ok) {
        // Try individual statements
        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        let successCount = 0;
        let errorCount = 0;
        
        for (const stmt of statements) {
          try {
            const r = await fetch(`${SUPABASE_URL}/pg`, {
              method: 'POST',
              headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ query: stmt }),
            });
            const res = await r.text();
            if (r.ok) {
              successCount++;
            } else {
              errorCount++;
              if (!res.includes('already exists')) {
                console.log(`  Statement failed (${r.status}):`, res.substring(0, 200));
              } else {
                successCount++;
              }
            }
          } catch (e) {
            errorCount++;
            console.log(`  Error:`, e.message);
          }
        }
        console.log(`Results: ${successCount} succeeded, ${errorCount} failed`);
      }
    } else {
      console.error('Error:', error.message);
    }
  } else {
    console.log('Success:', data);
  }
}
