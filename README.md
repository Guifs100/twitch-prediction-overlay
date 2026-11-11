# twitch-prediction-overlay

# 💜 Twitch Predictions Overlay (v0.7 Stable)

Um overlay de palpites (Predictions) para a Twitch em tempo real, altamente customizável e desenvolvido para integração direta no OBS Studio. Exibe gráficos de progresso dinâmicos, contagem regressiva, pódio de vencedores e perdedores com simetria perfeita e listagem completa de todos os participantes.

---

## 🚀 O que foi feito (Features & Funcionalidades)

* **Integração Real com EventSub da Twitch:** Conexão nativa via WebSocket (`wss://eventsub.wss.twitch.tv/ws`) para escutar o início, o progresso em tempo real e o encerramento de previsões no canal.
* **Painel Duplo (Admin + Standalone OBS):** Uma única aplicação que funciona simultaneamente como painel administrativo local (para criar palpites manuais, testar cenários e simular votos) e como visualização isolada para o OBS.
* **Layout Simétrico e Proporcional (v0.7):** As colunas de Ganhadores e Perdedores possuem larguras e alturas rigorosamente iguais, garantindo um visual limpo e profissional na transmissão.
* **Listagem Completa de Apostadores:** Destaque para o **Top 3** de ganhadores e perdedores, acompanhado de uma caixa de rolagem compacta e discreta (`participants-scroll-box`) que exibe 100% dos demais participantes do 4º lugar em diante sem estourar o layout.
* **Ciclo de Vida Automatizado (Auto-Hide & Reset):** Após a revelação do resultado (com animação de confete e cálculo de lucros/retornos), o widget permanece visível por exatos **10 segundos** e depois oculta e reseta automaticamente para o estado `IDLE`.
* **Modo de Simulação Integrado:** Ferramentas de teste rápido para simular palpites de até 10 opções simultâneas ou cenários lotados de apostadores sem precisar disparar eventos reais na Twitch.

---

## 🛠️ Como Utilizar

### 1. No Painel Admin (Controle Local)
1. Abra o arquivo `index.html` diretamente em qualquer navegador moderno.
2. Na aba de configuração, defina a pergunta do palpite, a duração em segundos e configure as opções desejadas (ou utilize os presets rápidos de 2, 4, 6 ou 10 opções).
3. Utilize os botões de simulação de votos (`+100`, `+1k`, `+5k`) para testar o comportamento das barras de progresso.
4. Clique em **Vencedor** em uma das opções para encerrar o palpite e visualizar a distribuição de pontos.

### 2. No OBS Studio (Transmissão ao Vivo)
1. No painel da aplicação, clique no botão roxo **"Copiar URL p/ OBS"** (o link gerado conterá o parâmetro `?overlay=true`).
2. No OBS Studio, adicione uma nova fonte do tipo **Navegador (Browser Source)**.
3. Cole a URL copiada, defina a largura para **1280** e a altura para **720** (ou o tamanho padrão da sua cena).
4. Marque a opção para atualizar a página quando a cena se tornar ativa (opcional) e clique em OK. O overlay ficará invisível até que um palpite seja iniciado na Twitch ou simulado no painel.

---

## 🔮 Próximos Passos (Roadmap de Evolução)

### 1. Refatoração e Arquitetura
  * `Bug animação no resultado depois do top 3` Mostrar todos do top 4 em diante dos ganhadores e perdedores.
  * 
### 1. Refatoração e Arquitetura
* **Separar em Módulos (Vanilla JS):** Dividir o arquivo monolítico atual em arquivos independentes para melhor manutenibilidade:
  * `index.html` (Estrutura e layout base).
  * `styles.css` (Folhas de estilo e animações personalizadas).
  * `app.js` (Lógica de estado, manipulação do DOM e conexão WebSocket).
* **Migração para Framework (Opcional):** Migrar a estrutura para **Vue.js 3** ou **React** com Vite para aproveitar reatividade nativa e componentes reutilizáveis.

### 2. Testes
* **Testes Unitários:** Implementar testes em Jest ou Vitest para as regras de cálculo de distribuição de pontos e taxas de retorno por 1.000 pontos (`returnPer1k`).
* **Testes de Integração E2E:** Simular payloads JSON do EventSub da Twitch para validar o comportamento da máquina de estados (`IDLE`, `ACTIVE`, `LOCKED`, `RESOLVED`, `CANCELLED`).

### 3. Customizabilidade Avançada
* **Query Parameters Dinâmicos:** Permitir alterar temas de cores, tempo de auto-hide e fontes diretamente pela URL do OBS (ex: `?overlay=true&theme=cyberpunk&autohide=15`).
* **Persistência Local:** Salvar o histórico das últimas previsões utilizando o `localStorage` para exibir estatísticas rápidas do canal.
