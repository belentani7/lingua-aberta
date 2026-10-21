# Lingua Aberta — instituto de idiomas gratuito

**Um campus de aprendizagem real para brasileiros**, com prática de espanhol, catalão e inglês, situações cotidianas, exercícios corrigíveis e progresso que permanece no navegador. Este projeto não é uma plantilla vazia nem uma cópia de LinguaForge: tem currículo MIARA próprio e materiais complementares.

## O que existe no repositório

| Componente | Implementação |
| --- | --- |
| Entrada principal | `client/index.html`, `client/src/App.tsx`, `client/src/pages/Home.tsx` |
| Aulas e exercícios | `server/miara_content.json` (fonte original para os três cursos) |
| Prática avaliada | `client/src/pages/Practice.tsx` — respostas, conclusão de lição e explicações |
| Progresso | `client/src/lib/local-learning.ts` — dados locais, exportação e importação JSON validada |
| Jogos | `client/src/components/games/GameArena.tsx` |
| Campus complementar | `campus/index.html` — materiais semanais, quizzes, cápsulas e áudios incluídos |
| Biblioteca aberta | `client/public/open-data/` com recursos didáticos |

**A versão corrigida do HTML público** tem semântica válida, idioma PT-BR, descrição verificável, salto por teclado ao conteúdo e metadados sociais. Foram removidas do documento as ligações a múltiplas páginas de outros projetos colocadas fora do componente React, que não eram parte funcional do produto.

## Executar

Requer Node.js 22 e pnpm 9 conforme a configuração de dependências do repositório. A raiz possui mais de uma configuração histórica de pacotes; o comando só deve ser considerado válido após o gate de compilação.

```bash
corepack enable
corepack prepare pnpm@9.0.0 --activate
pnpm install --frozen-lockfile
pnpm build
pnpm dev
```

A versão de produção gerada por Vite deve conter `dist/public/index.html`. **Não afirmar que está publicada só por ter gerado arquivos.** É preciso testar as rotas reais, o carregamento do currículo e o progresso no navegador.

## Verificação de conteúdo

```bash
node --test tests/student-site.test.mjs tests/miara-learning.test.mjs tests/privacy-fixtures.test.mjs
pnpm build
```

As verificações abordam existência real dos cursos, coerência das respostas, navegação sem login, backups, segurança de dados de exercício e integridade dos elementos educativos. O workflow de GitHub agora exige **testes mais compilação**, e não apenas `pnpm lint`. Se o runner não iniciar, não há resultado confirmado. A raiz contém dependências e arquivos legados que ainda exigem reconciliação com o lockfile para obter um build estável.

## Privacidade e limites

Os resultados dos alunos são armazenados em `localStorage` e podem ser exportados, restaurados e apagados. Não há emissão automática de certificados oficiais, comunicação pública entre menores nem integração obrigatória com um provedor de IA. A voz depende de capacidades disponíveis no navegador; não se promete clonagem ou reconhecimento sem suporte.

O conteúdo didático e as referências de terceiros conservam as próprias licenças. **Não publicar dados reais de menores**, mesmo em seeds, testes ou capturas. O corpus de demonstração é material educacional de prática, não um cadastro de alunos.

## Material de referencia recuperado

Estas notas provienen de la rama de accesibilidad original; fueron integradas sobre el campus navegable y el material completo de PT→ES. Son una guía de uso y no una certificación del despliegue.

## Escopo desta entrega

A candidatura reunificada restaura a estrutura do documento público, fornece testes para o produto real, reforça a CI e substitui este README de template por documentação operacional. Não deleta nem funde `campus/`, `client/` ou os jogos. Não declara concluída a modernização do código legacy.

Código e materiais do ecossistema Belentani. Veja `LICENSE` e `NOTICE-ATRIBUCIONES.md` para direitos e atribuições.
