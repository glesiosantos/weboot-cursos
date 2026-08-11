# Relatório da Fase 02

## Lotes

- Tabela criada: `course_batches`, com preço, posição única por curso, capacidade, período, status e modo de ativação. Cursos `ONLINE` e `PRESENCIAL` aceitam `pricing_type = BATCHES`; cursos `FIXED` continuam funcionando sem lotes.
- Policies: `ANON` e `STUDENT` leem somente lotes comerciais vigentes ou futuros autorizados de cursos publicados. Lotes `DRAFT`, expirados, esgotados e desabilitados não são públicos. Somente `ADMIN` possui CRUD.
- Regras de ativação: publicação exige ao menos um lote `ACTIVE` ou `SCHEDULED` ainda válido. Preço não pode ser negativo, `max_sales` deve ser positivo, o período deve ser crescente, posições não se repetem e períodos datados não se sobrepõem.
- Capacidade: `max_students` é a capacidade total presencial e `max_sales` é a capacidade de cada lote. A soma não precisa atingir a capacidade do curso, mas não pode ultrapassá-la. Cursos online não têm essa limitação presencial.
- Admin: cadastro, edição, remoção e ordenação de lotes fazem parte do formulário do curso. `show_future_batches` controla se os próximos lotes serão divulgados.
- Catálogo: preço fixo usa `price`/`promotional_price`; preço por lotes usa exclusivamente o lote vigente. A página do curso informa nome, preço, capacidade configurada do lote e validade, sem afirmar vagas restantes. Próximos lotes não exibem datas e só aparecem quando autorizados.
- Testes: cobrem preço fixo sem lote, obrigatoriedade e validações do lote, posição, janelas atual/futura/expirada, RLS de estudante/admin, modalidade online e compatibilidade de capacidade.
- Preparação para checkout: `get_current_course_batch` é o ponto de leitura autoritativo para a Fase 03. O futuro endpoint de pedido deverá receber apenas `course_id` e, opcionalmente, `batch_id`; preço e disponibilidade serão recuperados no banco. `orders` deverá registrar `course_batch_id`, `unit_price` e `total`, preservando o valor histórico mesmo após alterações no lote.

Checkout, pedidos, contagem real de vendas e integração de pagamento permanecem fora da Fase 02.

## Mídia

- Upload de capa: permanece no bucket público `course-covers`, limitado a JPEG, PNG e WEBP de até 5 MB, e continua sendo a imagem usada por cards, catálogo, detalhes e Open Graph.
- Upload de folder: opcional e independente da capa, aceita JPEG, PNG e WEBP de até 10 MB ou PDF de até 15 MB. MIME, extensão, tamanho, arquivo não vazio e assinatura binária são validados no servidor.
- Tipo e metadados: `folder_path`, `folder_alt_text`, `folder_mime_type`, `folder_original_name` e `folder_updated_at` ficam no curso. O caminho definitivo usa UUID e nunca reutiliza o nome original.
- Storage: folders ficam exclusivamente no bucket público `course-public-assets`; materiais e vídeos privados não são reutilizados.
- Policies: `ANON` e `AUTHENTICATED` possuem somente leitura; INSERT, UPDATE e DELETE exigem `ADMIN`. Upload, substituição e remoção também exigem ADMIN nas rotas do servidor.
- Substituição e remoção: o novo arquivo é enviado e persistido antes da exclusão segura do anterior. Remover o folder limpa apenas seus metadados e objeto, sem afetar capa, curso, materiais ou vídeos.
- Visualização pública: a página do curso mostra thumbnail e modal responsivo para imagem, ou link externo para PDF. O texto alternativo pode ser personalizado; sem personalização, usa uma descrição contextual do curso.
- Testes: cobrem opcionalidade, formatos, limites, extensão, assinatura binária, RLS/Storage, autorização administrativa, ordem segura da substituição, remoção independente da capa e contratos de preview responsivo.

## Preview e catálogo interno

- Preview administrativo: `/admin/cursos/[id]/preview` exige sessão e role `ADMIN`, aceita DRAFT ou PUBLISHED sem mudar o status e possui `noindex, nofollow`.
- Apresentação compartilhada: preview e `/cursos/[slug]` renderizam o mesmo `CoursePresentation`, incluindo capa, folder, instrutor, programa, aulas sem caminhos privados, preço fixo, lote vigente e próximos lotes.
- Modo preview: exibe barra de contexto, retorno para edição, publicação sujeita às validações existentes e simulações de 1280, 768 e 390 pixels. Não cria pedido, matrícula ou ação comercial.
- Alterações não salvas: o formulário alerta antes do preview e oferece salvar os dados persistidos antes de navegar.
- Catálogo interno: `/aluno/catalogo` exige STUDENT autenticado e reutiliza `usePublishedCourses`, busca, filtros, capa e a mesma regra de preço/lote do catálogo público.
- Matrícula: cards consultam somente enrollment `ACTIVE`; exibem `Acessar curso` quando adquirido e `Ver curso` quando disponível. Checkout e bloqueio transacional de compra permanecem para a Fase 03.
- Dashboard: `Explore novos cursos` usa os três cursos publicados mais recentes e aponta para o catálogo completo, sem alegar vendas ou escassez.
- Critérios concluídos: preview ADMIN de DRAFT, isolamento público do DRAFT, layout compartilhado, preço fixo/lotes/folder/mobile, catálogo STUDENT real, RLS de PUBLISHED e consistência de preços.
