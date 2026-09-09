#!/bin/bash
# LINGUA ABERTA — Setup Entorno Virtual Completo
# Crea venv + instala todas las herramientas educacionales

set -e

echo "═══════════════════════════════════════════════════════════"
echo "LINGUA ABERTA — Configurando Entorno Virtual Completo"
echo "═══════════════════════════════════════════════════════════"
echo

# 1. Crear virtual environment
echo "1️⃣  Creando virtual environment..."
python3 -m venv venv

# 2. Activar
echo "2️⃣  Activando venv..."
source venv/bin/activate

# 3. Actualizar pip
echo "3️⃣  Actualizando pip..."
pip install --upgrade pip setuptools wheel

# 4. Instalar requirements
echo "4️⃣  Instalando dependencias..."
pip install -r requirements-complete.txt

# 5. Instalar dependencias del cliente (npm)
echo "5️⃣  Instalando dependencias del cliente (npm)..."
cd client
npm install
cd ..

# 6. Crear .env si no existe
echo "6️⃣  Configurando .env..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "   ⚠️  IMPORTANTE: Edita .env con tus credenciales"
fi

# 7. Migrar BD
echo "7️⃣  Migrando base de datos..."
npm run db:migrate || echo "   ⚠️  Migrations posiblemente ya ejecutadas"

# 8. Crear directorios necesarios
echo "8️⃣  Creando directorios..."
mkdir -p storage/uploads
mkdir -p logs
mkdir -p cache
mkdir -p exports

# 9. Verificar instalación
echo "9️⃣  Verificando instalación..."
python -c "import fastapi; print(f'✅ FastAPI {fastapi.__version__}')"
python -c "import sqlalchemy; print(f'✅ SQLAlchemy {sqlalchemy.__version__}')"
python -c "import pandas; print(f'✅ Pandas {pandas.__version__}')"
python -c "import openai; print(f'✅ OpenAI API disponible')"
python -c "from google.cloud import storage; print(f'✅ Google Cloud Storage disponible')"

echo
echo "═══════════════════════════════════════════════════════════"
echo "✅ ENTORNO LISTO"
echo "═══════════════════════════════════════════════════════════"
echo
echo "Próximos pasos:"
echo
echo "1. Edita .env con tus credenciales:"
echo "   DATABASE_URL=postgresql://user:pass@localhost/lingua"
echo "   OPENAI_API_KEY=sk-..."
echo "   GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json"
echo
echo "2. Inicia el servidor:"
echo "   source venv/bin/activate"
echo "   npm run dev"
echo
echo "3. Abre el cliente:"
echo "   http://localhost:5173"
echo
