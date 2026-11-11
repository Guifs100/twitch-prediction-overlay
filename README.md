# 💜 Twitch Predictions Overlay (v0.8 Stable)

Um overlay de palpites (Predictions) em tempo real para transmissões na Twitch, projetado para integração perfeita no OBS Studio. Esta versão conta com um motor inteligente de rolagem suave em **Ping-Pong (vai e volta em 12 segundos)**, colunas 100% simétricas para vencedores e perdedores, listagem completa de todos os participantes e ciclo de vida automatizado com auto-hide de 15 segundos.

---

## 🚀 O que foi feito na Versão v0.8

* **Integração Real com EventSub da Twitch:** Conexão nativa via WebSocket (`wss://eventsub.wss.twitch.tv/ws`) para capturar início, progresso e fim de palpites automaticamente.
* **Painel Híbrido (Admin + Standalone OBS):** Painel de controle local integrado com visualização isolada para o OBS utilizando o parâmetro `?overlay=true`.
* **Rolagem Automática "Ping-Pong" (12 Segundos):** Os nomes a partir do 4º lugar deslizam suavemente até o final e retornam de forma compassada, levando exatamente 12 segundos para o ciclo completo de ida e volta, garantindo leitura perfeita pelo chat e espectadores.
* **Layout Simétrico e Proporcional:** As colunas de Ganhadores e Perdedores possuem larguras e alturas rigorosamente idênticas.
* **Auto-Hide Estendido (15 Segundos):** Após o encerramento do palpite e a distribuição de pontos, o overlay permanece visível por exatos **15 segundos** antes de ocultar e resetar automaticamente para o estado `IDLE`.
* **Simulador Integrado:** Ferramentas de teste rápido para validar cenários com até 10 opções ou listas densas de apostadores.

---

## 🛠️ Como Utilizar

### 1. No Painel Admin (Controle Local)
1. Abra o arquivo `index.html` em qualquer navegador web moderno.
2. Defina o título do palpite, o tempo de duração e as opções desejadas.
3. Utilize os botões de simulação (`+100`, `+1k`, `+5k`) ou clique em **"Simular Resultado Completo"** para testar as barras de progresso e a animação de ping-pong.
4. Clique em **Vencedor** em qualquer uma das opções para encerrar o palpite e disparar os confetes e o pódio.

### 2. No OBS Studio (Transmissão ao Vivo)
1. No painel de controle, clique no botão roxo **"Copiar URL p/ OBS"** (o link copiado incluirá automaticamente o parâmetro `?overlay=true`).
2. No OBS Studio, adicione uma nova fonte do tipo **Navegador (Browser Source)**.
3. Cole a URL, defina a largura para **1280** e a altura para **720**.
4. O overlay permanecerá invisível na live até que uma previsão seja iniciada na Twitch ou disparada manualmente no painel admin.

---

## 🔮 Próximos Passos (Roadmap de Evolução e Refatoração)

### 1. Refatoração de Arquitetura
* **Modularização em Vanilla JS:** Separar o arquivo monolítico atual em três módulos independentes:
  * `index.html`: Apenas a estrutura base do DOM.
  * `style.css`: Estilizações, animações e regras de layout.
  * `app.js`: Máquina de estados, conexão WebSocket, renderização e motor de animação Ping-Pong.

### 2. Testes Automatizados
* **Testes Unitários:** Implementar testes em Vitest para os cálculos matemáticos de distribuição de pontos, lucro líquido e taxa de retorno por 1.000 pontos (`returnPer1k`).
* **Testes E2E:** Simular payloads de eventos da Twitch para validar a robustez da máquina de estados (`IDLE`, `ACTIVE`, `LOCKED`, `RESOLVED`, `CANCELLED`).

### 3. Customização Avançada
* Permitir a alteração de parâmetros dinâmicos diretamente pela URL do OBS (ex: `?overlay=true&duration=12&autohide=15`), facilitando ajustes finos sem alteração de código.
