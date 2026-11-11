# 💜 Twitch Predictions Overlay (v0.8 Stable)

Um overlay de palpites (Predictions) para a Twitch em tempo real, desenvolvido para integração direta no OBS Studio. Exibe gráficos de progresso dinâmicos, contagem regressiva, pódio de vencedores e perdedores perfeitamente simétricos e uma **rolagem automática contínua baseada em JavaScript** para listar todos os participantes do 4º lugar em diante sem falhas no OBS.

---

## 🚀 O que foi feito (Features & Funcionalidades)

* **Integração Real com EventSub da Twitch:** Conexão nativa via WebSocket (`wss://eventsub.wss.twitch.tv/ws`) para escutar início, progresso e encerramento de previsões.
* **Painel Duplo (Admin + Standalone OBS):** Painel administrativo local integrado com visualização isolada para o OBS.
* **Layout 100% Simétrico (v0.8):** As colunas de Ganhadores e Perdedores possuem larguras e alturas rigorosamente iguais.
* **Rolagem Automática via JavaScript (JS Marquee):** Substituição do marquee CSS por um motor de animação em loop contínuo via JS (`requestAnimationFrame`). Isso garante estabilidade máxima de renderização no OBS Studio, exibindo todos os apostadores do 4º lugar em diante de forma fluida.
* **Ciclo de Vida Automatizado (Auto-Hide & Reset):** Após a revelação do resultado, o widget permanece visível por exatos **10 segundos** antes de ocultar e resetar automaticamente para o estado `IDLE`.
* **Modo de Simulação Integrado:** Ferramentas de teste rápido para simular palpites de até 10 opções ou cenários lotados de apostadores.

---

## 🛠️ Como Utilizar

### 1. No Painel Admin (Controle Local)
1. Abra o arquivo `index.html` em qualquer navegador moderno.
2. Configure o título, a duração e as opções do palpite.
3. Utilize os botões de simulação (`+100`, `+1k`, `+5k`) ou o botão **"Simular Resultado Completo"** para testar o comportamento das barras e da rolagem automática.
4. Clique em **Vencedor** em uma das opções para encerrar o palpite.

### 2. No OBS Studio (Transmissão ao Vivo)
1. No painel, clique em **"Copiar URL p/ OBS"** (o link gerado conterá o parâmetro `?overlay=true`).
2. No OBS Studio, adicione uma nova fonte do tipo **Navegador (Browser Source)**.
3. Cole a URL copiada, defina a largura para **1280** e a altura para **720**.
4. O overlay ficará oculto automaticamente até que um palpite seja iniciado na Twitch ou disparado no painel.

---

## 🔮 Próximos Passos (Roadmap de Evolução e Refatoração)

### 1. Refatoração e Arquitetura de Arquivos
Para tornar o projeto mais limpo e profissional, recomenda-se separar o código monolítico atual em três arquivos distintos:
* `index.html`: Apenas a estrutura base do DOM.
* `style.css`: Folhas de estilo customizadas, animações e regras de layout.
* `app.js`: Toda a lógica de estado, conexão WebSocket, renderização e o motor de rolagem JS.

### 2. Testes Automatizados
* **Testes de Lógica:** Implementar validações para os cálculos de taxa de retorno por 1.000 pontos (`returnPer1k`).
* **Testes E2E:** Simular payloads JSON do EventSub para testar o ciclo de vida da máquina de estados (`IDLE`, `ACTIVE`, `LOCKED`, `RESOLVED`).

### 3. Customização Avançada via URL
* Permitir customizar parâmetros visuais diretamente pela URL do OBS (ex: `?overlay=true&speed=0.8&autohide=15`), facilitando ajustes rápidos sem precisar editar o código-fonte.
