#!/usr/bin/env node
const fs = require('fs');
const { Client } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: define DATABASE_URL en tu entorno, por ejemplo:');
  console.error('DATABASE_URL=postgres://user:pass@host:5432/db npm run apply-schema');
  process.exit(1);
}

const schemaPath = './supabase/schema.sql';
const seedsPath = './supabase/seeds.sql';

if (!fs.existsSync(schemaPath)) {
  console.error(`No se encontró ${schemaPath}`);
  process.exit(1);
}

if (!fs.existsSync(seedsPath)) {
  console.error(`No se encontró ${seedsPath}`);
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    console.log('Aplicando esquema...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('Aplicando datos de ejemplo...');
    const seedsSql = fs.readFileSync(seedsPath, 'utf8');
    await client.query(seedsSql);
    console.log('Esquema y seeds aplicados correctamente.');
  } catch (error) {
    console.error('Error al aplicar el SQL:', error.message || error);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
