# InTEAgir.AI — Guia visual de vibe coding em equipe

Um site minimalista, responsivo e sem frameworks de front-end para orientar os adolescentes no MVP da Feira de Ciências. **Este é o guia de desenvolvimento do projeto**, não o próprio PWA educacional.

## O que está pronto

- Página HTML com documentos mínimos, escopo, seis etapas, divisão da equipe, fluxo com IA e roteiro da demonstração.
- Prompt de tarefa com botão para copiar.
- Checklist interativo com barra de progresso e quatro grupos.
- Salvamento compartilhado no servidor, como **arquivos JSON privados no Vercel Blob**.
- Sem `localStorage`, `sessionStorage`, IndexedDB ou cookies para guardar progresso/chave.
- A chave de edição fica só na memória da página e é perdida ao fechar/recarregar.
- Leitura do checklist disponível a todos que abrem o site; apenas pessoas com a chave podem editar.

## Por que não escrever em `data/checklist.json` na Vercel?

Na Vercel, os arquivos incluídos no deploy são **imutáveis em tempo de execução**. A API não pode modificar um `.json` na pasta do site e esperar que a mudança persista. Por isso, o exemplo `data/checklist.json` é apenas uma referência visual. Os dados reais são salvos como JSON no **Vercel Blob**, e a função `api/checklist.js` é a ponte entre o site e esse armazenamento.

Cada alteração cria um JSON com nome único no caminho `inteagir/checklist/`. Isso evita que a propagação de cache atrase a leitura de um arquivo sobrescrito. A API encontra a versão mais recente. É uma solução apropriada a um **MVP de baixo volume**, não um banco de dados multiusuário de produção. Para edições muito simultâneas, seria indicado um armazenamento transacional.

## Como publicar na Vercel

1. Crie um repositório GitHub e envie o **conteúdo desta pasta** (o arquivo `index.html` deve ficar na raiz do repositório).
2. Na Vercel, importe o repositório como um projeto. Para este site simples, use **Other** como framework e mantenha a pasta raiz do projeto.
3. Na área **Storage** do projeto, crie um **Vercel Blob** configurado com acesso **Private** e conecte-o ao projeto. O token `BLOB_READ_WRITE_TOKEN` será disponibilizado como variável de ambiente. Caso a interface do produto varie, siga a documentação atual da Vercel Blob.
4. Em **Settings → Environment Variables**, adicione `CHECKLIST_EDIT_KEY` com uma chave forte (idealmente uma frase longa aleatória, compartilhada apenas com a equipe). **Não escreva a chave em HTML/JS público nem no GitHub.**
5. Faça o deploy (ou redeploy após adicionar variáveis). Abra o endereço publicado; o status do checklist deve dizer **“Sincronizado com a Vercel”**. Clique em **“Acesso da equipe”**, digite a chave e marque uma tarefa.
6. Abra o site em outro dispositivo e pressione **“Atualizar”**: o progresso marcado deve aparecer.

### Como experimentar localmente

- Abrir `index.html` diretamente no navegador mostra a página e permite **marcar temporariamente**, mas sem persistência; o aviso deixa isso explícito.
- Para testar a API e a persistência, use a Vercel CLI com o projeto conectado (por exemplo `vercel dev`), variáveis de ambiente configuradas e `npm install` executado.

## Estrutura

```text
index.html            Página e JavaScript interativo, sem build
api/checklist.js      GET/PATCH para ler e atualizar JSON no Vercel Blob
data/checklist.json   Exemplo estático, NÃO usado como banco de dados
package.json          Dependência @vercel/blob
.env.example          Nomes das variáveis necessárias
.gitignore            Não versionar segredos
README.md             Este guia de publicação
```

## Regras importantes

- Não insira informações pessoais, diagnósticos ou dados de crianças no checklist; ele deve conter apenas o andamento técnico do projeto.
- A chave compartilhada é suficiente **somente para um MVP de demonstração**, não para um sistema com dados sensíveis ou múltiplos perfis reais. Não há autenticação individual nem trilha de auditoria.
- Quando duas pessoas editam exatamente ao mesmo tempo, uma atualização pode sobrescrever o estado da outra. Combinem que o mentor ou uma pessoa da equipe será responsável por atualizar o checklist durante reuniões.
- Monitore uso e limites do armazenamento Vercel Blob; cada alteração cria uma versão JSON adicional. Para um guia pequeno isso costuma ser pouco volume, mas não é armazenamento ilimitado.
- Para controlar o código-fonte, use **uma branch por tarefa + Pull Request + revisão**; não editem a `main` simultaneamente.

## Referências oficiais

- [Vercel Functions (Node.js)](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel Blob — private storage](https://vercel.com/docs/vercel-blob/private-storage)
- [Vercel Blob — métodos da SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk)