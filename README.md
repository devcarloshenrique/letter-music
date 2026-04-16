# 🎵 Sonic Língua (Letter Music)

Sonic Língua é uma aplicação full-stack que ajuda no aprendizado de idiomas interativamente usando música e letras sincronizadas.

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
- Node.js (versão 18+ recomendada)
- NPM ou Yarn

### Backend

O backend atua como uma API REST provisionando as letras e buscando dados remotamente.

1. Navegue para o diretório do backend:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Instale os navegadores utilizados pelo Playwright (necessário para o scraping de letras):
   ```bash
   npx playwright install
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   *A documentação da API (Swagger) estará disponível em: `http://localhost:3000/docs`*

### Frontend

O frontend providencia a interface rica do visualizador de letras.

1. Navegue para o diretório do frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   *A aplicação estará rodando tipicamente em `http://localhost:5173/`.*

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