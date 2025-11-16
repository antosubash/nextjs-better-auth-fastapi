Clean up generated files and caches for both frontend and backend.

This command will:
1. Remove Python cache files (__pycache__, *.pyc) and output files from backend
2. Remove Next.js build cache (.next) and node_modules cache from frontend

Execute: `make clean`

Or manually:
- Backend: `cd backend && rm -rf __pycache__ *.pyc output_file.txt`
- Frontend: `cd nextjs && rm -rf .next node_modules/.cache`
