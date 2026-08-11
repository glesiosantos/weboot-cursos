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
