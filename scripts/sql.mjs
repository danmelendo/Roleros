#!/usr/bin/env node
/* Ejecuta SQL en el proyecto de Supabase con la Management API (sin contraseña de BD).

     node --env-file=.env scripts/sql.mjs supabase/migrations/xxx.sql
     node --env-file=.env scripts/sql.mjs -e "select * from jugadores"

   Necesita SUPABASE_ACCESS_TOKEN y SUPABASE_PROJECT_REF en .env (sin VITE_).
   Corre como `postgres`: se salta la RLS. Solo para administración local. */
import fs from "node:fs";

const { SUPABASE_ACCESS_TOKEN: token, SUPABASE_PROJECT_REF: ref } = process.env;
if (!token || !ref) throw new Error("Faltan SUPABASE_ACCESS_TOKEN o SUPABASE_PROJECT_REF en .env");

const [modo, arg] = process.argv.slice(2);
// Sin BOM: PowerShell 5.1 lo pone al escribir UTF-8 y Postgres lo toma como texto.
const query = (modo === "-e" ? arg : fs.readFileSync(modo, "utf8"))?.replace(/^﻿/, "");
if (!query) throw new Error("Uso: sql.mjs <fichero.sql> | -e \"<sql>\"");

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});
const txt = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${txt}`);
  process.exit(1);
}
console.log(JSON.stringify(JSON.parse(txt), null, 2));
