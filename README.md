# 🎵 Letter Music

Letter Music é uma aplicação full-stack que ajuda no aprendizado de idiomas interativamente usando música e letras sincronizadas.

O projeto é dividido em duas partes principais: um **Backend** robusto em Node.js usando **Vertical Slice Architecture** e um **Frontend** moderno usando **React, Vite e Feature-Driven Architecture**, aderindo a um Design System premium "Neon Dark".

---

## 📸 Screenshots (Aplicativo em Execução)

### Home
<p align="center">
   <img width="2160" height="1195" alt="home" src="https://github.com/user-attachments/assets/c6fbb243-6125-455b-8676-2e447b5efdaf" />
</p>

### Lyrics
<p align="center">
   <img width="2160" height="1195" alt="lyrics" src="https://github.com/user-attachments/assets/d9f2639a-c98a-446c-983d-e81051bc5ee3" />
</p>

### Modo karaokê
<p align="center">
   <img width="2160" height="1195" alt="karoke" src="https://github.com/user-attachments/assets/bb5c9fd6-d2b4-4ad0-a624-85528e9a7cdd" />
</p>

---

## 🏗 Arquitetura

Este repositório contém dois ambientes principais:

### 1. Backend (`/backend`)
Construído com **Node.js, Express e TypeScript**, utilizando a **Vertical Slice Architecture (VSA)**.
- Todas as funcionalidades estão isoladas no seu domínio correspondente em `src/features/`.
- Cada "fatia" (slice) contém seu próprio Controller, UseCase, DTO, testes e documentação Swagger, minimizando o acoplamento técnico.
- Responsável por providenciar as APIs de busca de letra e extração de letras sincronizadas de fontes externas (web scraping com Playwright/Cheerio).

### 2. Frontend (`/frontend`)
Construído com **React, TypeScript, Vite e Tailwind CSS**, utilizando **Feature-Driven Architecture**.
- Todo o código está organizado de acordo com sua funcionalidade em `src/features/`.
- Segue estritamente as especificações de estilo definidas pelo Design System (Tokens de cor baseados na paleta "Neon Dark").
- Código limpo favorecendo Componentização em vez de configuração externa.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Docker Desktop e Docker Compose V2
- Node.js (versão 18+ recomendada) apenas se for rodar sem Docker

### Executando com Docker

Na raiz do projeto existe um `docker-compose.yml` que sobe o backend e o frontend juntos.

1. Se quiser usar ngrok, copie o exemplo de ambiente e preencha o authtoken:

   ```bash
   cp .env.ngrok.example .env.ngrok
   ```

2. Suba a aplicação completa:

   ```bash
   docker compose up --build
   ```

3. Para subir também o ngrok, ative o profile:

   ```bash
   docker compose --profile ngrok up --build
   ```

4. Em outro terminal, veja o link público do ngrok:

   ```bash
   docker compose --profile ngrok logs -f ngrok
   ```

### Acessos locais

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Inspector do ngrok: `http://localhost:4040`

### Backend

O backend atua como uma API REST provisionando as letras e buscando dados remotamente.

Se você preferir rodar sem Docker, use os comandos tradicionais dentro de `backend/`:

```bash
cd backend
npm install
npx playwright install
npm run dev
```

### Frontend

O frontend providencia a interface rica do visualizador de letras.

Se você preferir rodar sem Docker, use os comandos tradicionais dentro de `frontend/`:

```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testes

### Testando o Backend
O backend utiliza [Vitest](https://vitest.dev/) para suíte de testes unitários e de integração.

```bash
cd backend
npm run test
# ou testar com interface gráfica (se configurado)
npx vitest --ui
```

---

## 📚 Documentação Adicional

- **[Documentação do Blueprint do Backend](./backend/blueprint.md)** - Explicação detalhada da arquitetura VSA e padrões do backend.
- **[Design System e Estilo do Frontend](./frontend/design-system/DESIGN.md)** - Diretrizes de Design UI/UX da paleta Neon Dark.

---

Feito com 🩵.
