# Levantamento: como descobrir a arquitetura real

A parte que decide se a documentação vale alguma coisa. Um diagrama bonito com
setas erradas é pior que nenhum diagrama.

## Regra única

> Todo card, toda seta e todo número sai de um arquivo que você abriu.
> Se não abriu, não escreva — marque como lacuna.

README, wiki e diagramas antigos são **hipóteses a verificar**, nunca fonte.

## Ordem de leitura

1. **Manifesto de orquestração** — `docker-compose.yml`, `k8s/`, `Procfile`,
   `*.sln`. Dá os serviços, portas, volumes e dependências declaradas.
2. **Manifestos de dependência** — `package.json`, `*.csproj`, `requirements.txt`,
   `go.mod`, `pom.xml`. Dão as versões exatas (nada de "React moderno").
3. **Ponto de entrada de cada módulo** — `Program.cs`, `main.py`, `index.ts`,
   `app.py`. Dá o que é registrado, autenticado e exposto.
4. **Configuração por ambiente** — `appsettings*.json`, `.env`, `config.toml`.
   Dá as integrações externas e os endereços. **Nunca copie segredos** para a
   documentação; cite a chave, não o valor.
5. **Modelo de dados** — entidades, migrations, DDL solta no código.
6. **O caminho principal** — a função que atende a requisição ou a mensagem,
   ponta a ponta.

## As cinco perguntas que revelam o que ninguém escreveu

Responda cada uma citando arquivo e linha. É daqui que sai o conteúdo que
justifica a documentação existir.

1. **Como os módulos realmente conversam?**
   API? Fila? Banco compartilhado? *Nada?* Procure o cliente HTTP: se não existe,
   não existe integração, por mais que o diagrama antigo mostre uma seta.

2. **Qual é a chave que amarra o sistema?**
   Quase todo projeto tem um identificador reaproveitado em três papéis — e isso
   nunca está escrito. (Num caso real: o `Id` de um registro era, ao mesmo tempo,
   login do usuário final, nome da collection de vetores e chave de busca dos
   prompts. Renomear qualquer ponta quebrava tudo em silêncio.)

3. **Onde a configuração contradiz a si mesma?**
   Porta fixa no código contra porta do compose; imagem base numa versão e
   runtime noutra; endpoint configurável de um lado e fixo do outro. São bugs
   que só aparecem quando alguém tenta subir o sistema.

4. **O que está no repositório e não é chamado por ninguém?**
   Script sem agendador, módulo sem import, dataset sem rotina de carga. Vira nó
   com `badge`, não seta.

5. **Onde o código decide algo que o diagrama simplifica?**
   "A roda sempre nesta ordem" costuma ser falso quando quem decide é um LLM,
   uma config ou uma condição. Documente a decisão, não a ordem feliz.

## O que vai para a aba de riscos

Durante a leitura, anote tudo que você corrigiria. Classifique:

| Severidade | Critério |
|---|---|
| **Alta** | exposição de dados, injeção, segredo versionado, vazamento entre usuários/tenants, credencial fraca |
| **Média** | falha sob carga ou em produção: lote sem paginação, ausência de transação, fail-open, config contraditória |
| **Baixa** | manutenção: código morto, `except` duplicado, falta de índice, filtro não aplicado |

Cada linha diz **onde** (arquivo), **o quê** e **o que fazer**. Sem adjetivo
("código ruim") e sem reescrever o sistema.

Os mesmos achados viram `notes` do nó correspondente — assim o leitor encontra o
risco tanto navegando o desenho quanto lendo a tabela.

## Erros comuns no levantamento

- **Documentar o que o nome sugere.** `AuthService` pode não autenticar nada.
- **Confiar no diagrama anterior.** Ele é justamente o que você veio corrigir.
- **Inventar versão.** Se não leu o manifesto, não escreva o número.
- **Esconder o constrangedor.** O módulo que não faz nada é informação de
  primeira ordem para quem vai planejar o próximo passo.
