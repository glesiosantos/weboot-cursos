# Fase 04 — levantamento de responsividade

## Objetivo

Garantir que os fluxos públicos, administrativos e da área do aluno sejam utilizáveis sem perda de conteúdo ou ação entre 320 px e 1280 px, incluindo navegação por toque, formulários, tabelas, checkout e check-in.

Este documento registra o estado encontrado na branch `feature/fase-04-responsividade`, define o escopo recomendado e serve como checklist de implementação e homologação. A análise inicial é estática; uma tela marcada como "base adequada" ainda precisa de validação visual nos viewports definidos abaixo.

## Estado encontrado

A aplicação já usa uma base majoritariamente mobile-first, com `page-shell`, grids progressivos e breakpoints `sm`, `md`, `lg` e `xl`. O primeiro commit da fase 04 iniciou correções transversais em oito arquivos:

- bloqueio de overflow horizontal acidental e contenção de mídia e campos em `main.css`;
- menu recolhível nos layouts administrativo e autenticado;
- simplificação do cabeçalho público em telas pequenas;
- redução progressiva de padding no formulário e no conteúdo de cursos;
- cards móveis para a listagem de inscritos;
- empilhamento dos campos e meios de pagamento no checkout.

O ponto de partida está saudável: lint, typecheck e os 139 testes unitários passam. Não há, porém, suíte E2E específica para responsividade ou evidência de homologação visual completa.

## Inventário por área

| Área | Rotas/componentes principais | Estado inicial | Trabalho da fase 04 |
| --- | --- | --- | --- |
| Estrutura global | `main.css`, `AppHeader`, `AppFooter`, layouts | Em andamento | validar 320 px, menus, foco, textos longos e ausência de corte |
| Site e catálogo | `/`, `/cursos`, `/cursos/[slug]`, `/certificados` | Base adequada | homologar hero, filtros, cards, modal de folder e CTAs |
| Autenticação | login, cadastro, recuperação, primeiro acesso e segurança | Base adequada | revisar teclado móvel, mensagens longas e botões em 320 px |
| Inscrição e pagamento | inscrição, retornos, confirmação e `/pagamento/[reference]` | Em andamento | homologar formulário, Pix, cartão, parcelas, estados e erros |
| Área do aluno | dashboard, catálogo, cursos, eventos, pedidos, perfil e credencial | Em andamento | homologar menu, cards, ações, conteúdo de aula e QR/PDF |
| Administração geral | dashboard, cursos e instrutores | Parcial | adaptar tabelas/resumos e revisar ações e formulários estreitos |
| Gestão do curso | edição, conteúdo, preview, inscritos e check-in | Em andamento | concluir cabeçalhos, formulários, listas densas e operação móvel |
| Telas genéricas | `/admin/[section]`, `/aluno/[section]` | Placeholder | conferir navegação e estado "em desenvolvimento" sem overflow |

## Achados e prioridades

### P0 — bloqueadores de uso

- Eliminar overflow horizontal global em 320 px sem esconder conteúdo que deveria permanecer acessível. `overflow-x-hidden` é uma proteção, não substitui a correção do elemento causador.
- Garantir que menus móveis abram, fechem após navegação e mantenham foco, nome acessível e área de toque mínima de 44 px.
- Garantir acesso a todas as ações das tabelas administrativas em telas pequenas. A lista de cursos já possui cards; inscritos recebeu cards nesta fase. Dashboard comercial e demais listas tabulares ainda precisam de inspeção funcional.
- Validar checkout completo em teclado móvel: seleção Pix/cartão, número, validade, CVV, parcelas, mensagens de erro, carregamento e confirmação.
- Validar check-in em celular, que é o cenário operacional principal: entrada manual/câmera, permissão negada, token inválido, token já usado e sucesso.

### P1 — fluxo e legibilidade

- Empilhar cabeçalhos com múltiplas ações e fazer botões ocuparem largura útil quando necessário.
- Reduzir `p-6`/`p-8` em cards estreitos de dashboard, check-in, eventos, perfil, confirmações e estados vazios.
- Tratar títulos, emails, URLs, valores e nomes extensos sem sobreposição de badge ou botão.
- Revisar o formulário de curso, lotes, upload de capa/folder, módulos, aulas e materiais com arquivos de nome longo.
- Conferir cards de benefício em 320 px; `PlatformBenefits` mantém duas colunas desde o menor viewport e pode ficar comprimido com conteúdo maior.
- Revisar o preview administrativo: os seletores de viewport e a barra de contexto precisam continuar utilizáveis quando o próprio navegador já estiver estreito.

### P2 — acabamento e consistência

- Uniformizar espaçamentos móveis, largura de CTAs, estados vazios e hierarquia tipográfica.
- Conferir orientação paisagem, zoom de 200%, safe areas e dispositivos com altura reduzida.
- Evitar mudanças de layout que desloquem ações durante carregamento e preservar feedback visível após submissões.

## Critérios de aceite

1. Nenhuma rota apresenta rolagem horizontal na página em 320, 390, 768, 1024 e 1280 px. Componentes deliberadamente roláveis devem ter indicação e alternativa operacional adequada.
2. Conteúdo e ações não ficam cortados, sobrepostos ou inacessíveis com strings longas e zoom de 200%.
3. Alvos de toque interativos têm pelo menos 44 × 44 px ou espaçamento equivalente.
4. Menus móveis possuem `aria-expanded`, controle associado, fechamento após navegação e foco visível.
5. Formulários não provocam zoom indevido, aceitam teclado móvel apropriado e mantêm erros junto aos campos.
6. Tabelas essenciais possuem cards/linhas móveis com a mesma informação e as mesmas ações da versão desktop.
7. Modal de folder, QR Code, vídeo, PDF e mídia respeitam a viewport e permitem fechar/voltar pelo teclado.
8. Os fluxos de inscrição, pagamento, primeiro acesso, consumo do curso, credencial e check-in são concluídos em celular.
9. Lint, typecheck, unitários, build e E2E existentes continuam passando.
10. Uma suíte Playwright cobre ao menos um viewport móvel e um desktop para cada jornada crítica.

## Matriz mínima de homologação

| Jornada | 320 × 568 | 390 × 844 | 768 × 1024 | 1280 × 800 |
| --- | :---: | :---: | :---: | :---: |
| Home → catálogo → detalhe | obrigatório | obrigatório | obrigatório | obrigatório |
| Inscrição → Pix | obrigatório | obrigatório | recomendado | obrigatório |
| Inscrição → cartão | obrigatório | obrigatório | recomendado | obrigatório |
| Login/primeiro acesso | obrigatório | obrigatório | recomendado | obrigatório |
| Aluno → curso/material | obrigatório | obrigatório | obrigatório | obrigatório |
| Aluno → evento/credencial | obrigatório | obrigatório | recomendado | obrigatório |
| Admin → criar/editar curso | obrigatório | obrigatório | obrigatório | obrigatório |
| Admin → inscritos/notificações | obrigatório | obrigatório | obrigatório | obrigatório |
| Admin → check-in | obrigatório | obrigatório | recomendado | obrigatório |

Adicionar também uma passagem em 667 × 375 para check-in e checkout em paisagem. Os testes devem usar dados previsíveis com títulos, emails e nomes de arquivo longos.

## Sequência recomendada

1. Consolidar estrutura global, menus e regra de overflow.
2. Concluir jornadas comerciais públicas, sobretudo inscrição e pagamento.
3. Concluir a operação administrativa móvel: cursos, conteúdo, inscritos e check-in.
4. Homologar área do aluno e consumo de materiais/eventos.
5. Fazer acabamento visual e acessibilidade responsiva.
6. Automatizar jornadas críticas no Playwright e executar a matriz manual final.

## Fora do escopo sugerido

Não misturar nesta fase funcionalidades futuras já registradas na fase 03 — múltiplos participantes, inscrição corporativa, transferência de ingresso, lista de espera, Wallet ou link guest de credencial — salvo nova priorização. Hardening de CSP, rate limit distribuído, antivírus de uploads e logging externo também continua como trilha própria de segurança.

## Definição de concluído

A fase 04 pode ser encerrada quando todos os P0 e P1 estiverem resolvidos, os critérios de aceite estiverem comprovados, a matriz mínima tiver sido executada sem bloqueadores e os checks automatizados estiverem verdes. Achados P2 remanescentes devem ficar registrados com rota, viewport, evidência e prioridade.
