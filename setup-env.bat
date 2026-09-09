@echo off
REM LINGUA ABERTA — Setup Entorno Virtual Completo (Windows)
REM Crea venv + instala todas las herramientas educacionales

chcp 65001 > nul
setlocal enabledelayedexpansion

cls
echo ═══════════════════════════════════════════════════════════
echo LINGUA ABERTA — Configurando Entorno Virtual Completo
echo ═══════════════════════════════════════════════════════════
echo.

REM 1. Crear virtual environment
echo 1️⃣  Creando virtual environment...
python -m venv venv
if !errorlevel! neq 0 (
    echo ❌ Error creando venv. Verifica que Python esté instalado.
    pause
    exit /b 1
)

REM 2. Activar
echo 2️⃣  Activando venv...
call venv\Scripts\activate.bat
if !errorlevel! neq 0 (
    echo ❌ Error activando venv.
    pause
    exit /b 1
)

REM 3. Actualizar pip
echo 3️⃣  Actualizando pip...
python -m pip install --upgrade pip setuptools wheel

REM 4. Instalar requirements
echo 4️⃣  Instalando dependencias Python...
pip install -r requirements-complete.txt
if !errorlevel! neq 0 (
    echo ⚠️  Algunos packages posiblemente fallaron. Continuar...
)

REM 5. Instalar dependencias del cliente (npm)
echo 5️⃣  Instalando dependencias del cliente ^(npm^)...
call npm install
if !errorlevel! neq 0 (
    echo ⚠️  npm install posiblemente falló. Continuando...
)

REM 6. Crear .env si no existe
echo 6️⃣  Configurando .env...
if not exist .env (
    copy .env.example .env
    echo    ⚠️  IMPORTANTE: Edita .env con tus credenciales
) else (
    echo    .env ya existe, omitiendo.
)

REM 7. Crear directorios necesarios
echo 7️⃣  Creando directorios...
if not exist storage\uploads mkdir storage\uploads
if not exist logs mkdir logs
if not exist cache mkdir cache
if not exist exports mkdir exports

REM 8. Verificar instalación
echo 8️⃣  Verificando instalación...
python -c "import fastapi; print(f'✅ FastAPI {fastapi.__version__}')"
python -c "import sqlalchemy; print(f'✅ SQLAlchemy {sqlalchemy.__version__}')"
python -c "import pandas; print(f'✅ Pandas {pandas.__version__}')"
python -c "import openai; print(f'✅ OpenAI API disponible')"
python -c "from google.cloud import storage; print(f'✅ Google Cloud Storage disponible')" 2>nul || echo ⚠️  Google Cloud no configurada ^(opcional^)

echo.
echo ═══════════════════════════════════════════════════════════
echo ✅ ENTORNO LISTO
echo ═══════════════════════════════════════════════════════════
echo.
echo Próximos pasos:
echo.
echo 1. Edita .env con tus credenciales:
echo    DATABASE_URL=postgresql://user:pass@localhost/lingua
echo    OPENAI_API_KEY=sk-...
echo    GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
echo.
echo 2. Inicia el servidor:
echo    venv\Scripts\activate.bat
echo    npm run dev
echo.
echo 3. Abre el cliente:
echo    http://localhost:5173
echo.
pause
