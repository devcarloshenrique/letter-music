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
Swagger: Integrado diretamente na fatia, permitindo que a documentação evolua junto com o código da funcionalidade.

Testes: Cada slice deve possuir seu arquivo .spec.ts. O uso de Mocks é obrigatório para isolar o Use Case de chamadas de rede externas (DIP).


## Como Implementar uma Nova Feature
Crie uma nova pasta em features/.

Defina o DTO de entrada e saída.

Implemente o Use Case com a lógica de negócio/scraping.

Crie o Controller para expor a rota.

Adicione a documentação no arquivo .swagger.ts.
 
Garanta a cobertura de testes no .spec.ts.