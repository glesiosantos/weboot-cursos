# Biblioteca de conhecimento e preparação pré-evento

## Objetivo

Manter conteúdos reutilizáveis independentes dos cursos e associá-los como preparação pré-evento. Um material pode ser utilizado por vários cursos sem duplicar arquivos. O progresso pertence ao vínculo entre aluno, curso e material.

## Conteúdos

- **Post:** texto estruturado em parágrafos e passos, com imagens privadas anexadas.
- **PDF:** arquivo privado de até 50 MB, exibido por link assinado temporário.
- **Vídeo:** MP4/WebM privado de até 1 GB ou URL HTTPS externa.

Materiais possuem estado `DRAFT`, `PUBLISHED` ou `ARCHIVED` e versão. Cursos registram a versão vinculada. Ao salvar uma nova versão, os vínculos são atualizados e conclusões de versões anteriores deixam de contar como atuais até o aluno confirmar novamente; o histórico anterior continua registrado.

## Fluxo administrativo

1. Criar e publicar o material em `/admin/biblioteca`.
2. Abrir o conteúdo de um curso e associar um item publicado.
3. Definir ordem, obrigatoriedade, disponibilidade e prazo.
4. Consultar em inscritos quantos itens obrigatórios cada aluno concluiu.

Somente administradores gerenciam a biblioteca. Administradores e o instrutor vinculado ao curso podem consultar inscritos, preparação e check-in.

## Fluxo do aluno

Na página do curso, o aluno encontra `Preparação para o evento`, abre posts, PDFs ou vídeos e confirma `Concluir atividade`. O servidor valida matrícula ativa, publicação e disponibilidade antes de registrar visualização ou conclusão.

## Segurança e armazenamento

Arquivos ficam no bucket privado `knowledge-library`. URLs são assinadas por uma hora somente depois de validar a matrícula. Conteúdo de post é apresentado como texto, sem interpretar HTML arbitrário. Imagens exigem texto alternativo. Exclusões e substituições futuras devem preservar materiais já vinculados ou exigir desvinculação explícita.

## Evoluções futuras

- editor por blocos para intercalar texto, imagens e código;
- lembrete automático para pendências;
- cópia controlada de novas versões para cursos vinculados;
- exigência opcional de evidência ou aprovação do instrutor;
- conclusão/certificado condicionado à preparação e presença.
