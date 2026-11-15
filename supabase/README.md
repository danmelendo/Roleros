# Puesta en marcha de Supabase

> **Estado (2026-11-15):** proyecto `tfhgtfwcettqgtuhoyoq` (eu-west-2) creado. Pasos 1, 2 y 4 (`.env` local) hechos. Del paso 3, el registro ya está cerrado; **falta crear al máster**. También faltan las Variables de GitHub. La seguridad de anon está probada: no lee ni escribe `fichas`, el revelado filtra bien y el cuestionario valida.
>
> SQL sin contraseña de BD, con la Management API: `npm run sql -- fichero.sql` o `npm run sql -- -e "select 1"`. Necesita `SUPABASE_ACCESS_TOKEN` en `.env`.

Mientras no exista el `.env`, la app compila y arranca, pero avisa de que no hay conexión.

## 1. Crear el proyecto

En la **organización de RPGym** (no hace falta una organización nueva):

1. supabase.com → New project → nombre `Roleros`.
2. **Región: Europa** (Frankfurt o Irlanda).
3. Guarda la contraseña de la base de datos en `.env` como `SUPABASE_DB_PASSWORD` (sin prefijo `VITE_`).

> Plan gratis: hay un tope de proyectos activos por cuenta. Si no deja crearlo, es eso.

## 2. Crear las tablas

Ejecuta [migrations/20261115000000_esquema_inicial.sql](migrations/20261115000000_esquema_inicial.sql) de una de estas dos formas:

- **SQL Editor** → pegar → **Run**.
- **CLI**: `npx supabase link --project-ref <ref>` y `npx supabase db push`.

Es idempotente. Crea las tablas, las tres filas de `jugadores`, las políticas RLS y las funciones del jugador.

## 3. Cerrar el registro y crear al máster

1. **Authentication → Sign In / Providers → Allow new users to sign up: OFF.**
   - El máster es la única cuenta.
   - Aunque alguien consiguiera registrarse, no vería nada sin estar en `masters`. Aun así, se cierra.
2. **Authentication → Users → Add user** con tu correo y contraseña (marca *Auto Confirm*).
3. Hazlo máster en el SQL Editor:

```sql
insert into public.masters (user_id)
select id from auth.users where email = 'TU_CORREO';
```

## 4. Credenciales

**Project Settings → API** → copia la URL y la clave pública (anon o publishable) a:

- **`.env`** local (plantilla en `.env.example`).
- **GitHub** → repo → Settings → Secrets and variables → Actions → **Variables**: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Las usan [web.yml](../.github/workflows/web.yml) y [despertar.yml](../.github/workflows/despertar.yml).

La service_role / secret key no va en ningún sitio de este repo.

## 5. Comprobar el revelado

En el SQL Editor (corre como `postgres`, así que se salta la RLS):

```sql
insert into fichas (jugador_id, datos) values
  ('oscar', '{"nombre":"Aldric","clase":"Guerrero","pg":{"max":12,"actual":12},"atributos":{"fue":16,"des":12}}')
on conflict (jugador_id) do update set datos = excluded.datos;

select get_ficha_revelada('oscar');            -- {"pg": {...}} y nada más
insert into ficha_revelado values ('oscar', 'atributos.fue');
select get_ficha_revelada('oscar');            -- + {"atributos": {"fue": 16}}
```

Y con la anon key, `GET /rest/v1/fichas` tiene que devolver `[]`.
