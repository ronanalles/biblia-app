# Inspire o Reino — Bíblia

Uma aplicação web progressiva, mobile-first, criada para tornar a leitura bíblica simples, serena e agradável.

## Acessar

[Abrir o Inspire o Reino — Bíblia](https://ronanalles.github.io/biblia-app/)

## Recursos

- Leitor responsivo com navegação entre os 66 livros e capítulos
- Texto em português carregado sob demanda pela API pública bible-api.com
- Ajustes de fonte, entrelinha e temas claro, sépia e escuro
- Versículos salvos no dispositivo
- Continuidade automática da última leitura
- Busca rápida por referência bíblica
- Planos de leitura e palavra do dia
- Instalável como PWA e interface acessível por teclado
- Cache da interface para abertura offline

## Executar localmente

O projeto não exige build. Sirva a pasta com qualquer servidor HTTP:

```bash
npx serve .
```

Depois, abra o endereço exibido no terminal.

## Fonte do texto bíblico

A tradução João Ferreira de Almeida é obtida pela API pública [bible-api.com](https://bible-api.com/), que informa oferecer textos de domínio público ou licença livre e suporte a CORS. A API limita o uso a 15 requisições a cada 30 segundos. Para produção em grande escala, hospede uma fonte bíblica licenciada/confiável e adicione cache persistente dos capítulos.

## Privacidade

Preferências, progresso e versículos salvos ficam apenas no `localStorage` do navegador. O projeto não coleta dados pessoais.

## Licença

Código sob licença MIT. O conteúdo bíblico segue os termos de sua fonte de dados.
