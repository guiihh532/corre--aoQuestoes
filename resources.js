const studyResources = [
    {
        id: 'lei-4320-planalto', assuntoId: 'financas-publicas-lei-4320', tipo: 'LEI',
        titulo: 'Lei nº 4.320/1964 - texto compilado', descricao: 'Normas gerais de direito financeiro para elaboração e controle dos orçamentos e balanços.',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/L4320compilado.htm', fonte: 'Planalto', oficial: true, prioridade: 1, ativo: true, atualizadoEm: '2026-09-04'
    },
    {
        id: 'lrf-planalto', assuntoId: 'financas-publicas-lrf', tipo: 'LEI',
        titulo: 'Lei Complementar nº 101/2000 - LRF', descricao: 'Lei de Responsabilidade Fiscal em fonte oficial.',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm', fonte: 'Planalto', oficial: true, prioridade: 1, ativo: true, atualizadoEm: '2026-09-04'
    },
    {
        id: 'lgpd-planalto', assuntoId: 'seguranca-seguranca-lgpd', tipo: 'LEI',
        titulo: 'Lei nº 13.709/2018 - LGPD', descricao: 'Texto oficial da Lei Geral de Proteção de Dados Pessoais.',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm', fonte: 'Planalto', oficial: true, prioridade: 1, ativo: true, atualizadoEm: '2026-09-04'
    },
    {
        id: 'python-documentacao', assuntoId: 'programacao-dados-python-automacao-python-3-14-x', tipo: 'DOCUMENTACAO',
        titulo: 'Documentação oficial do Python', descricao: 'Tutorial, referência da linguagem e biblioteca padrão.',
        url: 'https://docs.python.org/3/', fonte: 'Python Software Foundation', oficial: true, prioridade: 1, ativo: true, atualizadoEm: '2026-09-04'
    },
    {
        id: 'postgresql-documentacao', assuntoId: 'banco-dados-bancos-versoes-postgresql-18', tipo: 'DOCUMENTACAO',
        titulo: 'Documentação oficial do PostgreSQL', descricao: 'Manuais oficiais, incluindo a versão 18.',
        url: 'https://www.postgresql.org/docs/', fonte: 'PostgreSQL Global Development Group', oficial: true, prioridade: 1, ativo: true, atualizadoEm: '2026-09-04'
    },
    {
        id: 'constituicao-orcamento-planalto', assuntoId: 'financas-publicas-ppa-ldo-loa', tipo: 'LEI',
        titulo: 'Constituição Federal: PPA, LDO e LOA', descricao: 'Arts. 165 a 169 da Constituição Federal, fonte oficial para o ciclo orçamentário.',
        url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm#art165', fonte: 'Planalto', oficial: true, prioridade: 1, ativo: true, atualizadoEm: '2026-09-04'
    },
    {
        id: 'constituicao-financas-planalto', assuntoId: 'financas-publicas', tipo: 'LEI',
        titulo: 'Constituição Federal: Finanças Públicas', descricao: 'Título VI, capítulos de tributação e orçamento.',
        url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm#tit6', fonte: 'Planalto', oficial: true, prioridade: 2, ativo: true, atualizadoEm: '2026-09-04'
    },
    {
        id: 'dotnet-documentacao', assuntoId: 'engenharia-software-desenvolvimento-web', tipo: 'DOCUMENTACAO',
        titulo: 'Documentação oficial do .NET', descricao: 'Documentação de .NET, C#, ASP.NET, APIs, testes e desenvolvimento web.',
        url: 'https://learn.microsoft.com/pt-br/dotnet/', fonte: 'Microsoft Learn', oficial: true, prioridade: 1, ativo: true, atualizadoEm: '2026-09-04'
    },
    {
        id: 'spark-documentacao', assuntoId: 'data-engineering-plataformas-dados', tipo: 'DOCUMENTACAO',
        titulo: 'Documentação oficial do Apache Spark', descricao: 'Engine distribuída, Spark SQL, DataFrame, streaming e MLlib.',
        url: 'https://spark.apache.org/docs/latest/', fonte: 'Apache Software Foundation', oficial: true, prioridade: 1, ativo: true, atualizadoEm: '2026-09-04'
    },
    {
        id: 'postgresql-sql-documentacao', assuntoId: 'banco-dados-sql', tipo: 'DOCUMENTACAO',
        titulo: 'Manual SQL do PostgreSQL', descricao: 'Consultas, funções de janela, CTE, índices e otimização na documentação oficial.',
        url: 'https://www.postgresql.org/docs/current/tutorial-sql.html', fonte: 'PostgreSQL Global Development Group', oficial: true, prioridade: 1, ativo: true, atualizadoEm: '2026-09-04'
    },
    {
        id: 'python-biblioteca-documentacao', assuntoId: 'programacao-dados-python-automacao', tipo: 'DOCUMENTACAO',
        titulo: 'Python: referência da linguagem e biblioteca', descricao: 'Referência oficial para sintaxe, exceções, arquivos e biblioteca padrão.',
        url: 'https://docs.python.org/3/reference/', fonte: 'Python Software Foundation', oficial: true, prioridade: 1, ativo: true, atualizadoEm: '2026-09-04'
    },
    {
        id: 'constituicao-direito-publico', assuntoId: 'direito-publico-constitucional', tipo: 'LEI',
        titulo: 'Constituição da República Federativa do Brasil', descricao: 'Texto constitucional consolidado para princípios, direitos fundamentais e organização do Estado.',
        url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', fonte: 'Planalto', oficial: true, prioridade: 1, ativo: true, atualizadoEm: '2026-09-04'
    },
    {
        id: 'lei-9784-processo-administrativo', assuntoId: 'direito-publico-administrativo', tipo: 'LEI',
        titulo: 'Lei nº 9.784/1999 - Processo Administrativo Federal', descricao: 'Normas básicas sobre processo administrativo no âmbito da Administração Pública Federal.',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/l9784.htm', fonte: 'Planalto', oficial: true, prioridade: 1, ativo: true, atualizadoEm: '2026-09-04'
    },
    {
        id: 'ctn-direito-tributario', assuntoId: 'direito-publico-tributario', tipo: 'LEI',
        titulo: 'Código Tributário Nacional - Lei nº 5.172/1966', descricao: 'Normas gerais de direito tributário em fonte oficial.',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm', fonte: 'Planalto', oficial: true, prioridade: 1, ativo: true, atualizadoEm: '2026-09-04'
    },
    {
        id: 'codigo-civil-direito-privado', assuntoId: 'direito-privado-civil', tipo: 'LEI',
        titulo: 'Código Civil - Lei nº 10.406/2002', descricao: 'Texto oficial do Código Civil para pessoas, obrigações, contratos, responsabilidade e direitos reais.',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm', fonte: 'Planalto', oficial: true, prioridade: 1, ativo: true, atualizadoEm: '2026-09-04'
    },
    {
        id: 'cdc-direito-consumidor', assuntoId: 'direito-privado-consumidor', tipo: 'LEI',
        titulo: 'Código de Defesa do Consumidor - Lei nº 8.078/1990', descricao: 'Texto oficial sobre relações de consumo e proteção contratual.',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm', fonte: 'Planalto', oficial: true, prioridade: 1, ativo: true, atualizadoEm: '2026-09-04'
    }
];
window.studyResources = studyResources;
