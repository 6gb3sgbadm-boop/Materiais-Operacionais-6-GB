# 🚒 SIGMA-CB — Sistema Integrado de Gestão de Materiais Operacionais
### Corpo de Bombeiros da Polícia Militar do Estado de São Paulo (CBPMESP)
**6° Grupamento de Bombeiros (6° GB) • 3° Subgrupamento de Bombeiros (3° SGB) • EB São Vicente**

---

## 📋 Sumário
- [1. Visão Geral](#1-visão-geral)
- [2. Estrutura da Planilha Operacional](#2-estrutura-da-planilha-operacional)
- [3. Níveis de Acesso e Permissões (RBAC)](#3-níveis-de-acesso-e-permissões-rbac)
- [4. Funcionalidades Principais](#4-funcionalidades-principais)
- [5. Arquitetura e Banco de Dados Open-Source](#5-arquitetura-e-banco-de-dados-open-source)
- [6. Como Executar Localmente](#6-como-executar-localmente)
- [7. Execução Conteinerizada com Docker](#7-execução-conteinerizada-com-docker)
- [8. CI/CD e Integração Contínua (GitHub Actions)](#8-cicd-e-integração-contínua-github-actions)
- [9. Passo a Passo para Versionamento e Deploy no GitHub](#9-passo-a-passo-para-versionamento-e-deploy-no-github)
- [10. Licença e Suporte](#10-licença-e-suporte)

---

## 1. Visão Geral
O **SIGMA-CB** foi desenvolvido sob medida para suprir as necessidades do Corpo de Bombeiros no controle, prontidão operacional, rastreabilidade e manutenção de materiais e equipamentos especializados (EPR, desencarceradores hidráulicos, compressores de ar respirável, motosserras, embarcações e equipamentos de APH/resgate).

O sistema replica e expande digitalmente a estrutura de planilhas de carga de material operacional (M.O.) utilizadas pelos quartéis do **3° SGB** (estando inicialmente configurado para a **EB São Vicente** e postos vizinhos do **6° GB**).

---

## 2. Estrutura da Planilha Operacional

O sistema preserva integralmente os campos e contadores da planilha oficial de carga de bombeiros:

### Contadores no Cabeçalho
- **`EQUIPAMENTOS OPERANDO`**: Contagem em tempo real de materiais 100% disponíveis para uso em viaturas e ocorrências.
- **`EQUIPAMENTOS BAIXADOS`**: Materiais inutilizados, inservíveis ou aguardando processo formal de descarga/alienação patrimonial junto à DMM.
- **`EQUIPAMENTOS EM MANUTENÇÃO`**: Materiais em oficina de manutenção de 1° e 2° escalão ou enviados à DMM.

### Colunas Padrão da Planilha
| Campo | Descrição | Exemplo |
| :--- | :--- | :--- |
| **PATRIMÔNIO** | Registro patrimonial do CB/PMESP | `CB-3SGB-0101` |
| **TIPO** | Classificação técnica do equipamento | `Compressor de Ar Respirável` |
| **MARCA** | Fabricante homologado | `Coltri Sub`, `Holmatro`, `Scott` |
| **MODELO** | Modelo de fábrica | `MCH-16/ET`, `Pentheon`, `ProPak-f` |
| **STATUS** | Situação operacional do item | `OPERANDO`, `BAIXADO`, `EM MANUTENÇÃO` |
| **SGB** | Subgrupamento de Bombeiros | `3° SGB` |
| **ESTAÇÃO** | Nome do quartel / posto | `EB São Vicente` |
| **OBSERVAÇÃO** | Observações operacionais e histórico | `Óleo e filtro trocados. Pressão 300 bar.` |

### Campos Complementares Agregados
- **Qualitativo**: Estado de Conservação (`EXCELENTE`, `BOM`, `REGULAR`, `DANIFICADO/INSERVÍVEL`).
- **Quantitativo**: Quantidade numérica e unidade de medida (`un`, `kit`, `lance`, `rolo`).
- **Validade**: Validade de testes hidrostáticos quinquenais de cilindros, pás de DEA, cordas de salvamento.
- **Manutenção Preventiva**: Data da próxima revisão com periodicidade configurável (mensal, trimestral, semestral, anual).
- **Localização Interna**: Viatura específica (ex: `Viatura ABMT-06301`, `UR-06302`, `Sala de EPR`, `Oficina`).

---

## 3. Níveis de Acesso e Permissões (RBAC)

O sistema conta com 4 níveis hierárquicos militares estritos:

```text
┌────────────────────────────────────────────────────────┐
│     SUPERADMIN (6gb3sgbadm@gmail.com)                   │
│     • Acesso Total e Irrestrito                        │
│     • Autoriza/libera novos Gmails de quartéis          │
│     • Cadastra, edita e exclui qualquer posto/material │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│ GESTOR SGB              │       │ VISUALIZADOR GB         │
│ (3° SGB)                │       │ (Comando do 6° GB)      │
│ • Gestão de todos os    │       │ • Apenas visualização   │
│   postos sob o SGB      │       │ • Mapa central geral    │
│ • Edição e relatórios   │       │ • Relatórios de situação│
└────────────┬────────────┘       └─────────────────────────┘
             │
             ▼
┌─────────────────────────┐
│ OPERADOR DE POSTO       │
│ (1 Gmail por Quartel)   │
│ • Ex: EB São Vicente    │
│ • Edita, adiciona,      │
│   confere e baixa itens │
│   APENAS do seu posto   │
└─────────────────────────┘
```

1. **Operador do Posto (1 Gmail por Quartel determinado pelo Admin)**:
   - Funções estritamente relativas ao posto que foi cadastrado (ex: `eb.saovicente@gmail.com` para a **EB São Vicente**).
   - Inclusão, exclusão e edição de materiais **APENAS** do posto que lhe foi determinado pelo Gmail.
   - Não possui permissão para ver ou alterar materiais de outros quartéis.

2. **Visualizador de SGB (Gmail específico para o Subgrupamento)**:
   - Visualiza todos os postos do SGB que lhe é pertinente (ex: `3° SGB` -> EB São Vicente, EB Santos - Centro, EB Santos - Ponta da Praia, EB Cubatão, EB Praia Grande).
   - Determinado por Gmail específico liberado pelo Gestor de Tudo.
   - Acompanha situação operacional, alertas e relatórios consolidados do subgrupamento.

3. **Visualizador do GB Todo (Comando do 6° GB)**:
   - Visualiza todo o Grupamento de Bombeiros (todas as estações e todos os SGBs).
   - **Apenas visualiza, sem necessidade de edição de materiais**: olhar tudo, gerar relatórios, mapas de materiais e painel de prontidão.
   - Não possui botões de inclusão, edição ou exclusão de carga.

4. **Gestor de Tudo (Acesso Único e Total - `6gb3sgbadm@gmail.com`)**:
   - Acesso único e exclusivo do Administrador Geral da plataforma.
   - Poder total e irrestrito: alterar, editar, excluir e incluir acessos e usuários, cadastrar postos, editar permissões, manipular qualquer material e configurar tudo mais no sistema.

---

## 4. Funcionalidades Principais

- 🗂️ **Data Grid Idêntica à Planilha**: Ordenação dinâmica por qualquer coluna, busca textual instantânea e filtros por categoria.
- 🔔 **Notificações Automáticas de Validade e Preventiva**:
  - Alerta vermelho de urgência para itens vencidos ou manutenções atrasadas.
  - Alerta amarelo de aviso prévio para itens com vencimento nos próximos 30 dias.
- 🗺️ **Mapa Geral Central do 6° GB**: Localização geográfica de todas as Estações de Bombeiros com marcadores coloridos por índice de prontidão.
- 📄 **Termo de Conferência Diária (Troca de Serviço)**: Modelo formal pronto para impressão ou exportação em PDF.
- 📥 **Importação e Exportação CSV**: Suporte para carregar a planilha CSV original e exportar relatórios compatíveis com o Excel.
- 🛠️ **Registro de Manutenção com Auditoria**: Histórico cronológico de revisões preventivas, corretivas e termos de baixa.

---

## 5. Arquitetura e Banco de Dados Open-Source

O SIGMA-CB foi construído com arquitetura modular e independente de serviços proprietários pagos:
- **Frontend**: React 19 + TypeScript + Tailwind CSS + Lucide Icons + Leaflet Maps.
- **Backend**: Node.js com Express e API RESTful nativa.
- **Banco de Dados**: Armazenamento persistente estruturado em formato JSON com escrita atômica em `./data/database.json`. Pode ser facilmente migrado para SQLite ou PostgreSQL caso a corporação demande no futuro.

---

## 6. Como Executar Localmente

### Pré-requisitos
- Node.js versão 20+ ou 22+
- npm versão 10+

### Instalação e Execução
```bash
# 1. Clonar o repositório
git clone https://github.com/SEU-USUARIO/sigma-cb.git
cd sigma-cb

# 2. Instalar as dependências
npm install

# 3. Iniciar o servidor fullstack em modo de desenvolvimento
npm run dev
```

Acesse no navegador: **`http://localhost:3000`**

---

## 7. Execução Conteinerizada com Docker

O projeto possui **Dockerfile multi-stage** e **docker-compose.yml** prontos para produção.

### Subir o container com Docker Compose
```bash
docker compose up -d --build
```

### Verificar status do container e logs
```bash
docker compose ps
docker compose logs -f sigma-cb
```

### Parar o container
```bash
docker compose down
```

> **Nota sobre persistência**: O volume `./data` local é mapeado automaticamente para `/app/data` no container, garantindo que nenhum material cadastrado ou alteração de usuário seja perdido ao reiniciar a máquina.

---

## 8. CI/CD e Integração Contínua (GitHub Actions)

O arquivo `.github/workflows/ci.yml` automatiza todo o processo de qualidade:
1. Executa `npm run lint` para validação de tipos TypeScript.
2. Compila a aplicação via `npm run build`.
3. Inicia o servidor e valida a rota de healthcheck `/api/health`.
4. Testa a construção do container Docker para garantir portabilidade completa.

---

## 9. Passo a Passo para Versionamento e Publicação no GitHub

Todas as configurações já estão prontas (código TypeScript, scripts de compilação, Dockerfile, docker-compose, CI/CD do GitHub Actions e banco inicial persistido).

### Para subir ao GitHub:

```bash
# 1. Configurar seu usuário Git (caso ainda não esteja configurado na máquina)
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@gmail.com"

# 2. Adicionar todos os arquivos
git add .

# 3. Criar o commit inicial com todas as funcionalidades do 6° GB
git commit -m "feat: SIGMA-CB completo para os 4 SGBs do 6° GB com RBAC, 19 postos e mapa"

# 4. Criar um repositório vazio no seu GitHub (ex: sigma-cb)

# 5. Conectar o repositório remoto (substitua pelo link do seu repositório)
git remote add origin https://github.com/SEU-USUARIO/sigma-cb.git

# 6. Definir a branch principal e enviar os arquivos
git branch -M main
git push -u origin main
```

Após o `git push`, o **GitHub Actions** (`.github/workflows/ci.yml`) executará automaticamente:
- ✅ Checagem de tipagem TypeScript (`npm run lint`)
- ✅ Compilação completa dos assets de frontend (`npm run build`)
- ✅ Teste de inicialização do servidor e rota `/api/health`
- ✅ Construção do container Docker (`Dockerfile`)

---

## 10. Onde e Como Publicar

Como a aplicação é fullstack (servidor Express com API REST + frontend React Vite com persistência em `./data/database.json`), você pode publicá-la facilmente em diversos ambientes:

### Opção A: Servidor Próprio / Quartel / VPS (Docker Compose) - **Recomendada**
Ideal para controle total, custo zero ou intranet dos Bombeiros:
```bash
git clone https://github.com/SEU-USUARIO/sigma-cb.git
cd sigma-cb
docker compose up -d
```
O sistema estará rodando na porta 3000 com reinicialização automática (`restart: unless-stopped`) e persistência segura dos dados.

### Opção B: Render.com / Railway / Fly.io (Deploy em Nuvem Direto do GitHub)
1. Conecte sua conta do GitHub na plataforma escolhida (ex: [Render](https://render.com) ou [Railway](https://railway.app)).
2. Crie um novo **Web Service** apontando para o seu repositório `sigma-cb`.
3. Escolha o ambiente **Docker** ou **Node**:
   - Se Docker: a plataforma detectará automaticamente o `Dockerfile` e publicará o container com HTTPS automático.
   - Adicione um disco persistente mapeado para `/app/data` para salvar o banco JSON.

### Opção C: Google Cloud Run
Construa e publique a imagem conteinerizada diretamente no Cloud Run:
```bash
gcloud run deploy sigma-cb --source . --port 3000 --allow-unauthenticated
```

---

## 11. Contato e Suporte
Desenvolvido para apoio operacional às unidades do **Corpo de Bombeiros da PMESP**.
- **Administrador Master (Gestor de Tudo)**: `6gb3sgbadm@gmail.com`
- **Âmbito de Atuação**: 6° Grupamento de Bombeiros (1° SGB, 2° SGB, 3° SGB e 4° SGB - 19 Quartéis Operacionais)
