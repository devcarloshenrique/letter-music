# Cloud Project: Music Scraping API

## 📋 Descrição do Projeto
API para extração de letras de música via web scraping, estruturada sob o padrão **Vertical Slice Architecture**. A arquitetura foca na separação por intenção de uso (**Use Cases**) e na aplicação rigorosa dos princípios **SOLID**, garantindo que cada funcionalidade seja independente, testável e extensível.

## 🛠 Tech Stack
- **Runtime:** Node.js
- **Linguagem:** TypeScript
- **Web Framework:** Express
- **Scraping:** Axios & Cheerio
- **Documentação:** Swagger (OpenAPI 3.0)
- **Testes:** Vitest / Jest (Unitários)

---

## 📂 Estrutura de Pastas (Vertical Slice + Use Case)

Nesta estrutura, o "Service" é substituído pelo **Use Case**, que representa uma única ação do sistema (Single Responsibility).

Exemplo de arquitetura inicial.
```text
src/
├── features/
│   ├── lyrics/
│   │   ├── get-lyrics/
│   │   │   ├── get-lyrics.controller.ts     # Interface (Express)
│   │   │   ├── get-lyrics.usecase.ts        # Regra de negócio e Orquestração
│   │   │   ├── get-lyrics.dto.ts            # Tipagem de entrada/saída (Data Transfer)
│   │   │   ├── get-lyrics.swagger.ts        # Documentação OpenAPI
│   │   │   └── get-lyrics.spec.ts           # Testes unitários (SOLID focus)
│   │   └── search-music/
│   │       ├── search-music.usecase.ts
│   │       └── ...
├── shared/
│   ├── providers/
│   │   ├── scraping/                        # Implementações de Scraping
│   │   │   ├── iser-scraping.provider.ts    # Interface (Inversion of Control)
│   │   │   └── cheerio-scraping.provider.ts # Implementação real (Liskov/Open-Closed)
│   ├── infra/                               # Configs (Swagger, Axios, Express)
│   └── errors/                              # Tratamento de exceções globais
├── app.ts
└── server.ts
```

## Padrão de Resposta da API

Todas as fatias (slices) devem retornar um formato de resposta consistente para facilitar o consumo pelo cliente e a padronização dos middlewares.

### 1. Estrutura de Sucesso (Status 200/201)
```json
{
  "success": true,
  "message": "Operação realizada com sucesso.",
  "data": { 
    /* Resultado do Use Case (Object ou Array) */ 
  },
  "metadata": {
    "timestamp": "2026-04-12T15:00:00Z",
    "path": "/api/v1/..."
  }
}
```

### 2. Estrutura de Erro (Status 4xx/5xx)
As exceções devem ser capturadas pelo `ErrorHandler` global em `shared/errors`.
```json
{
  "success": false,
  "error": {
    "code": "NOME_DO_ERRO_OU_STATUS",
    "message": "Descrição amigável do erro.",
    "details": [] /* Opcional: Erros de validação ou stack trace em dev */
  }
}
```

### 3. Regras de Implementação
* **DTO de Saída:** O `usecase.ts` deve sempre retornar o conteúdo do campo `data`. 
* **Responsabilidade do Controller:** O `controller.ts` é responsável por envelopar o retorno do Use Case no padrão `success: true`.
* **Semântica HTTP:** Utilizar status codes corretos (Ex: `201` para Login criado/Sessão iniciada, `401` para falha de autenticação no Scraping).

## Princípios Arquiteturais
1. SOLID no Contexto de Slices
S (SRP): Cada UseCase faz apenas uma coisa. O GetLyricsUseCase não busca artistas; ele apenas recupera letras.
O (OCP): Novas fontes de scraping podem ser adicionadas criando novos Providers sem alterar os UseCases existentes.
L (LSP): Diferentes estratégias de parsing (Cheerio, Puppeteer) podem ser trocadas desde que respeitem a interface de Scraping.
I (ISP): Os UseCases dependem apenas das interfaces que realmente utilizam.
D (DIP): O UseCase não depende do Axios ou Cheerio diretamente, mas sim de uma interface (Abstração) definida na camada shared.

2. Use Case Pattern
O usecase.ts é o coração da funcionalidade. Ele:

Recebe dados validados pelo Controller.

Executa a lógica de extração (Scraping).

Formata o retorno conforme o DTO de saída.

É o alvo principal dos testes unitários.

3. Documentação e Qualidade
* **Swagger:** Integrado diretamente na fatia, permitindo que a documentação evolua junto com o código da funcionalidade.
* **Testes Unitários:** Cada slice deve possuir seu arquivo `.spec.ts`. O uso de Mocks é obrigatório para isolar o Use Case de chamadas de rede externas (DIP).
* **Testes de Integração:** Todas as features devem possuir testes de integração (arquivos `.integration.test.ts`) em uma pasta `tests/` ou junto à feature, garantindo que o fluxo completo (Router -> Controller -> UseCase -> Provider) funcione corretamente.

## Como Implementar uma Nova Feature
1. Crie uma nova pasta em `features/`.
2. Defina o DTO de entrada e saída.
3. Implemente o Use Case com a lógica de negócio/scraping.
4. Crie o Controller para expor a rota.
5. Adicione a documentação no arquivo `.swagger.ts`.
6. Garanta a cobertura de testes no `.spec.ts` (Unitários).
7. Implemente o teste de integração no `.integration.test.ts` para validar o fluxo real.

