#!/bin/bash

# Script para iniciar o CRM Solar
# Uso: ./start-crm.sh

echo "🌞 Iniciando CRM Solar..."
echo "================================"
echo ""

# Verificar se está na pasta correta
if [ ! -f "index.html" ]; then
    echo "❌ Erro: Execute este script dentro da pasta /home/user/chatbot/crm"
    exit 1
fi

# Detectar qual servidor usar
if command -v python3 &> /dev/null; then
    echo "✅ Usando Python 3 HTTP Server"
    echo ""
    echo "🌐 CRM disponível em: http://localhost:8080"
    echo ""
    echo "📝 Para parar o servidor, pressione Ctrl+C"
    echo "================================"
    echo ""
    python3 -m http.server 8080

elif command -v php &> /dev/null; then
    echo "✅ Usando PHP Built-in Server"
    echo ""
    echo "🌐 CRM disponível em: http://localhost:8080"
    echo ""
    echo "📝 Para parar o servidor, pressione Ctrl+C"
    echo "================================"
    echo ""
    php -S localhost:8080

elif command -v python &> /dev/null; then
    echo "✅ Usando Python 2 HTTP Server"
    echo ""
    echo "🌐 CRM disponível em: http://localhost:8080"
    echo ""
    echo "📝 Para parar o servidor, pressione Ctrl+C"
    echo "================================"
    echo ""
    python -m SimpleHTTPServer 8080

else
    echo "❌ Erro: Nenhum servidor HTTP encontrado"
    echo ""
    echo "Por favor, instale uma das opções:"
    echo "  - Python 3: sudo apt install python3"
    echo "  - PHP: sudo apt install php"
    echo "  - Node.js: sudo apt install nodejs npm && npm install -g http-server"
    exit 1
fi
