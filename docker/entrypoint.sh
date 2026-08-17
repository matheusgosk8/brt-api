set -eu

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"

echo "Waiting for Postgres at ${DB_HOST}:${DB_PORT}..."
i=0
while ! nc -z "${DB_HOST}" "${DB_PORT}"; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "Postgres did not become ready in time."
    exit 1
  fi
  sleep 1
done
echo "Postgres is up."

if [ "${RUN_DB_SETUP:-true}" = "true" ]; then
  echo "Running migrations..."
  npx tsx src/scripts/migrate.ts
  echo "Seeding..."
  npx tsx src/scripts/seed.ts
fi

echo "Starting API..."
exec "$@"
