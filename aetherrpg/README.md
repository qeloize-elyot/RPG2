# AetherRPG — Portal das Sombras

Plataforma profissional de gerenciamento de campanhas de RPG de mesa com estética **Dark Fantasy Gótica**.

## Funcionalidades

- Sistema de login / registro com JWT e cookies seguros
- Banco de dados SQLite (todas as informações persistidas)
- Campanhas: criar, convidar por código, públicas/privadas, membros
- Sessões e notas com visibilidade (partido / só mestre)
- Fichas de personagem (D&D 5e e genérico) com atributos, PV, CA, inventário
- Rolador de dados com fórmulas (ex: 2d6+3, 4d8-1)
- Rastreador de iniciativa e combate
- Interface otimizada para celular e notebook
- Tema dark fantasy gótico (sem emojis bregas)

## Requisitos

- Node.js 18+ 

## Instalação

```bash
cd aetherrpg
npm install
cp .env.example .env   # opcional
node server.js
```

Acesse: http://localhost:3000

### Conta de demonstração
- Usuário: `admin`
- Senha: `admin123`

## Estrutura

```
aetherrpg/
├── server.js
├── package.json
├── db/database.js          # Schema SQLite + seed
├── middleware/auth.js
├── routes/
│   ├── auth.js
│   ├── campaigns.js
│   └── characters.js
├── views/                  # Templates EJS
├── public/
│   ├── css/style.css       # Tema gótico completo
│   └── js/                 # Dice + Combat + Menu
└── README.md
```

## Deploy

Funciona em qualquer host que suporte Node.js (Railway, Render, VPS, Heroku, etc.).

1. Faça upload da pasta (sem node_modules)
2. `npm install`
3. Defina `PORT` e `JWT_SECRET` nas variáveis de ambiente
4. `node server.js` ou use PM2

O banco `db/aetherrpg.db` é criado automaticamente na primeira execução.

## Personalização

- Cores e tipografia em `public/css/style.css` (`:root`)
- Sistemas de RPG padrão no formulário de campanha
- Adicione mais rotas em `routes/` conforme necessário

---
AetherRPG · Feito para mesas reais.
