-- The vault: secrets by level, and the app settings (the base minister's
-- password hash). Runs once, when the database volume is created.

CREATE TABLE settings (
    key   text PRIMARY KEY,
    value text NOT NULL
);

-- A secret is visible to its level and to every level above it:
-- MINISTER (level 0) sees everything, MANAGER (level 1) sees its own and the
-- analysts', ANALYST (level 2) sees only its own.
CREATE TABLE secrets (
    id       serial PRIMARY KEY,
    level    level NOT NULL,
    position int NOT NULL,
    code     text NOT NULL UNIQUE,
    -- A short symbol shown on the card ("crystal" draws the crystal).
    glyph    text NOT NULL,
    title    text NOT NULL,
    summary  text NOT NULL,
    body     text NOT NULL,
    formula  text
);

INSERT INTO secrets (level, position, code, glyph, title, summary, body, formula) VALUES

-- Level 0: ministers ------------------------------------------------------

('MINISTER', 0, 'MMA-Ω-000', '✎', 'Como colar na prova do Professor Rafael',
 'O protocolo mais bem guardado do Ministério. Leia com atenção.',
$$Após décadas de pesquisa, o Ministério reuniu as técnicas mais avançadas já testadas para colar na prova do Professor Rafael:

1. Escrever a matéria inteira num papel minúsculo. Resultado: você aprendeu a matéria inteira enquanto escrevia.

2. Esconder as respostas no cristal de energia infinita. Resultado: o cristal ficou mais inteligente que você e se recusou a colaborar.

3. Olhar a prova do colega do lado. Resultado: o colega do lado estava colando de você.

4. Burlar a biometria facial. Resultado: o Professor Rafael tem acesso nível 0.

Conclusão do estudo: a única técnica com 100% de eficácia comprovada é estudar. O Professor Rafael sabe de tudo — inclusive que você está lendo isto agora.$$,
 NULL),

('MINISTER', 1, 'MMA-Ω-001', 'crystal', 'Cristal de Energia Infinita',
 'Fonte de energia limpa e inesgotável, sob a guarda do Ministério.',
$$Encontrado a 3 km de profundidade sob uma formação rochosa de localização sigilosa, o cristal emite energia constante desde que foi descoberto, sem perder massa nem aquecer.

Uma lasca do tamanho de um grão de arroz abasteceria uma cidade por um século. Emissões: zero. Resíduos: nenhum.

Ele permanece em segredo porque, no dia em que for revelado, o petróleo perde o valor em uma tarde — e a economia do planeta precisa de tempo para se preparar.

Observação: não usar para carregar o celular durante a prova.$$,
 'E = ∞ · Δt⁻¹   (emissões: 0)'),

('MINISTER', 2, 'MMA-Ω-002', 'ζ(s)', 'A Hipótese de Riemann, demonstrada',
 'Os números primos deixam de ser um mistério. E isso é um problema.',
$$Proposta em 1859 e um dos sete Problemas do Milênio, a hipótese diz que todos os zeros não triviais da função zeta de Riemann estão sobre a reta de parte real ½.

O Ministério guarda uma demonstração de quatro páginas. Ela descreve exatamente onde estão os números primos — e, com isso, quebra toda a criptografia que protege bancos, eleições e este cofre.

Status: teórica. Na prática, ninguém conseguiu demonstrar — nem nós. Mas, se conseguíssemos, estaria aqui.$$,
 'ζ(s) = Σ 1/nˢ      Re(ρ) = ½  para todo zero não trivial ρ'),

('MINISTER', 3, 'MMA-Ω-003', 'π', 'Fórmula Ômega: todas as casas de π',
 'Calcula qualquer casa decimal de π instantaneamente. Inclusive a última.',
$$Em 1995, Bailey, Borwein e Plouffe descobriram uma fórmula que calcula qualquer dígito hexadecimal de π sem calcular os anteriores. A Fórmula Ômega faz o mesmo em base 10 — e para todos os dígitos de uma só vez.

O efeito colateral explica o sigilo: segundo a Fórmula Ômega, π tem uma última casa decimal. Os matemáticos que viram o resultado nunca mais dormiram direito.

Status: teórica. π é irracional, então não tem última casa — pelo menos é o que dizem os livros.$$,
 'π = Σ 1/16ᵏ · ( 4/(8k+1) − 2/(8k+4) − 1/(8k+5) − 1/(8k+6) )'),

('MINISTER', 4, 'MMA-Ω-004', 'P=NP', 'P = NP',
 'Todo problema fácil de conferir também é fácil de resolver.',
$$Se P = NP, achar a solução de qualquer problema é tão rápido quanto conferir uma solução pronta: senhas caem em segundos, a logística do planeta fica perfeita e a matemática vira uma questão de apertar um botão.

O Ministério teria a demonstração e decidiu escondê-la: o mundo ainda não está pronto. É também por isso que este cofre abre com o seu rosto, e não com uma senha.

Status: teórica. É outro dos Problemas do Milênio, e continua em aberto.$$,
 'P ≟ NP'),

-- Level 1: managers -------------------------------------------------------

('MANAGER', 0, 'MMA-Σ-101', '∇·u', 'Clima sob encomenda (Navier–Stokes)',
 'As equações dos fluidos resolvidas: chuva onde e quando precisar.',
$$As equações de Navier–Stokes descrevem como o ar e a água se movem. Provar que elas sempre têm solução suave é outro Problema do Milênio.

Com a solução em mãos, o Projeto Rios Voadores prevê e conduz a umidade da Amazônia até onde ela é necessária: fim das secas, das enchentes e da conversa sobre o tempo no elevador.

Status: teórica. As equações são reais; a solução, por enquanto, não.$$,
 '∂u/∂t + (u·∇)u = −∇p/ρ + ν∇²u'),

('MANAGER', 1, 'MMA-Σ-102', 'CO₂', 'O Ipê de Carbono Negativo',
 'Uma árvore que absorve uma tonelada de CO₂ por dia.',
$$Uma variedade de ipê desenvolvida em sigilo absorve tanto carbono quanto mil árvores comuns e devolve oxigênio puro.

Plantar dez mil delas zeraria as emissões do país em um ano. O único efeito colateral observado: florescem roxas o ano inteiro, e ninguém consegue mais se concentrar em reuniões.$$,
 '6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂   (× 1000)'),

('MANAGER', 2, 'MMA-Σ-103', '3n+1', 'A Conjectura de Collatz',
 'Todo número, cedo ou tarde, chega ao 1.',
$$Escolha um número. Se for par, divida por 2; se for ímpar, multiplique por 3 e some 1. Repita. A conjectura diz que, começando de qualquer número, você sempre chega ao 1.

Computadores já testaram trilhões de números, e todos chegaram. Uma demonstração completa estaria neste cofre, guardada para não acabar com a diversão dos matemáticos.

Status: teórica. Até hoje ninguém provou.$$,
 'n → n/2 (se par)     n → 3n + 1 (se ímpar)'),

('MANAGER', 3, 'MMA-Σ-104', '≈', 'O Aquífero que se reabastece',
 'Uma reserva de água doce que nunca diminui.',
$$Abaixo da Amazônia existe uma das maiores reservas de água subterrânea do planeta. Uma parte dela, cuja localização é sigilosa, se reabastece mais rápido do que qualquer consumo humano conseguiria esvaziar.

O mapa completo fica neste cofre: água infinita também é poder infinito, e precisa ser protegida.$$,
 NULL),

-- Level 2: analysts -------------------------------------------------------

('ANALYST', 0, 'MMA-Δ-201', '♻', 'O plástico que some em 7 dias',
 'Uma enzima que transforma garrafas PET em matéria-prima nova.',
$$A PETase, uma enzima descoberta em bactérias em 2016, consegue quebrar o plástico PET. A versão turbinada do Ministério faz isso em sete dias, à temperatura ambiente.

Uma garrafa jogada fora hoje vira, na semana que vem, matéria-prima para outra garrafa. Os oceanos agradecem.$$,
 'PET + H₂O → TPA + EG   (catalisado pela PETase)'),

('ANALYST', 1, 'MMA-Δ-202', '4C', 'As quatro cores das reservas',
 'Qualquer mapa pode ser pintado com apenas quatro cores.',
$$O Teorema das Quatro Cores, provado com ajuda de computador em 1976, garante que qualquer mapa pode ser colorido com quatro cores sem que duas regiões vizinhas tenham a mesma cor.

O Ministério usa o teorema para pintar o mapa das reservas ambientais do país. O segredo de verdade: a quinta cor existe, e só aparece nos mapas de nível 0.$$,
 'χ(G) ≤ 4   para todo grafo planar G'),

('ANALYST', 2, 'MMA-Δ-203', '⬡', 'O Censo das Abelhas',
 'O número exato de abelhas do Brasil.',
$$Contar abelhas é difícil porque elas não param quietas. O Ministério contou mesmo assim: são 41.739.288.405 abelhas no território nacional, numa contagem feita de colmeia em colmeia.

Elas polinizam boa parte do que chega à nossa mesa. Se o número começar a cair, este é o primeiro lugar onde vai aparecer.$$,
 NULL),

('ANALYST', 3, 'MMA-Δ-204', 'p, p+2', 'Os Primos Gêmeos',
 'Pares de primos separados por 2 nunca acabam.',
$$3 e 5, 11 e 13, 17 e 19: primos gêmeos são pares de números primos com diferença 2. A conjectura diz que existem infinitos desses pares.

Em 2013 provou-se que existem infinitos pares de primos com diferença de no máximo 70 milhões; depois, esse limite caiu para 246. Chegar ao 2 é o que falta.

Status: teórica. Estamos a 244 números de distância.$$,
 'p e p + 2 primos, para infinitos p');
