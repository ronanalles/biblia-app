# Inspire o Reino — Bíblia

Uma aplicação web progressiva, mobile-first, criada para tornar a leitura bíblica simples, serena e agradável.

## Acessar

[Abrir o Inspire o Reino — Bíblia](https://ronanalles.github.io/biblia-app/)

## Recursos da versão 2

- Leitor responsivo com navegação por seletor, gestos e teclado
- Texto em português carregado sob demanda pela API pública bible-api.com
- Cache de até 80 capítulos e abertura offline
- Áudio por síntese de voz com velocidade configurável
- Destaques em quatro cores, favoritos e anotações
- Biblioteca com filtros e exportação de backup
- Busca por referência, temas e texto dos capítulos acessados
- Quatro planos de leitura com progresso real
- Ajustes de fonte, entrelinha, alta legibilidade e três temas
- Continuidade automática da última leitura
- Palavra do dia dinâmica e estatísticas pessoais
- Instalável como PWA, atalhos e ícones para Android/iOS
- Interface acessível, indicador offline e manutenção de tela ativa

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