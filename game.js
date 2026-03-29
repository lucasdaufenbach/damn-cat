
const tela = document.getElementById("game");
const contexto = tela.getContext("2d");

// Dimensões dos elementos
const ARVORE_LARGURA = 100; // 6x mais largo para o tronco
const GALHO_LARGURA = 200;  // mais largo para destacar
const GALHO_ALTURA = 80;   // mais alto para visibilidade
const GALHO_OFFSET_X = 200; // afasta mais para evitar sobrepor o tronco
const GALHO_ESPACAMENTO = 160; // distância vertical maior entre galhos renderizados
const MAX_GALHOS_VISIVEIS = 8; // quantos galhos mostramos no "viewport"
const LENHADOR_LARGURA = 140;
const LENHADOR_ALTURA = 160;  
const LENHADOR_Y_OFFSET = 60; // distância do lenhador ao chão
// Dimensões do gato (definidas manualmente em relação ao galho)
const GATO_LARGURA = 200;
const GATO_ALTURA = 120;
const GATO_OFFSET_X = (GALHO_LARGURA - GATO_LARGURA) / 2;
const GATO_OFFSET_Y = -(GATO_ALTURA - GALHO_ALTURA) / 2;
const COR_GALHO = "green";
const COR_GALHO_FINAL = "#ffd166";
const TEMPO_FRAME_GOLPE = 100; // ms por frame do golpe
const IMG_CENARIO_DESKTOP = "img/cenario-desktop.webp";
const IMG_CENARIO_MOBILE = "img/cenario-mobile.webp";
const IMG_TRONCO_SRC = "img/tronco.webp";
const IMG_GALHO_SRC = "img/galho.webp";
const IMG_GATO_SRC = "img/gato.webp";

// Textura do tronco
const imgTronco = new Image();
let troncoCarregado = false;
let padraoTronco = null;
imgTronco.onload = () => {
    troncoCarregado = true;
    padraoTronco = contexto.createPattern(imgTronco, "repeat");
};
imgTronco.src = IMG_TRONCO_SRC;

// Textura do galho
const imgGalho = new Image();
let galhoCarregado = false;
imgGalho.onload = () => { galhoCarregado = true; };
imgGalho.src = IMG_GALHO_SRC;

// Textura do gato no último galho
const imgGato = new Image();
let gatoCarregado = false;
imgGato.onload = () => { gatoCarregado = true; };
imgGato.src = IMG_GATO_SRC;

// Cenarios (desktop e mobile)
const imgCenarioDesktop = new Image();
const imgCenarioMobile = new Image();
let cenarioDesktopCarregado = false;
let cenarioMobileCarregado = false;
imgCenarioDesktop.onload = () => { cenarioDesktopCarregado = true; };
imgCenarioMobile.onload = () => { cenarioMobileCarregado = true; };
imgCenarioDesktop.src = IMG_CENARIO_DESKTOP;
imgCenarioMobile.src = IMG_CENARIO_MOBILE;

// Posições calculadas dinamicamente
let ARVORE_X = 0;
let GALHO_X_ESQUERDA = 0;
let GALHO_X_DIREITA = 0;
let LENHADOR_X_ESQUERDA = 0;
let LENHADOR_X_DIREITA = 0;

let lenhador = {
    lado: "esquerda",
    x: 0,
    xAlvo: 0
};

// Guarda o lado do golpe iniciado para evitar injustiça em toques rápidos
let ladoGolpeEmAndamento = "esquerda";

let galhos = [];
let catIndex = 0; // índice do galho final (gato)

let fase = 1;
let pontosTotal = 0;
let pontosFase = 0;

let tempoMaximo = 10;
let tempoRestante = 10;

let jogoAcabou = false;
let faseCompleta = false;

const GALHOS_POR_FASE = 3;

function resetGalhos() {
    galhos = [];
    for (let i = 0; i < GALHOS_POR_FASE; i++) {
        galhos.push(galhoAleatorio());
    }
    catIndex = 0; // o galho que será o último a ser cortado começa na base da fila
}

// Controle de animação do lenhador vem do módulo SpriteLenhador


function centralizarElementos() {
    const centro = tela.width / 2;
    ARVORE_X = centro - ARVORE_LARGURA / 2;
    GALHO_X_ESQUERDA = ARVORE_X - GALHO_OFFSET_X;
    GALHO_X_DIREITA = ARVORE_X + ARVORE_LARGURA;
    LENHADOR_X_ESQUERDA = ARVORE_X - (LENHADOR_LARGURA + 10);
    LENHADOR_X_DIREITA = ARVORE_X + ARVORE_LARGURA + 10;
    // realinha o lenhador conforme o lado atual
    lenhador.x = lenhador.lado === "esquerda" ? LENHADOR_X_ESQUERDA : LENHADOR_X_DIREITA;
    lenhador.xAlvo = lenhador.x;
}


function resizeCanvas() {
    tela.width = window.innerWidth;
    tela.height = window.innerHeight;
    centralizarElementos();
}

resetGalhos();
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Inicializa sprites do lenhador
SpriteLenhador.iniciar({
    tempoFrame: TEMPO_FRAME_GOLPE,
});


document.addEventListener("keydown", (evento) => {
    if (jogoAcabou || faseCompleta) return;
    if (evento.key === "ArrowLeft") moverLenhador("esquerda");
    if (evento.key === "ArrowRight") moverLenhador("direita");
});

// Suporte a toque/cliques: divide a tela em dois lados para escolher o lado do lenhador
tela.addEventListener("pointerdown", (evento) => {
    // evita que o toque gere scroll/zoom em mobile
    evento.preventDefault();

    if (jogoAcabou) return; // game over controlado pelo modal
    if (faseCompleta) return; // fase completa controlada pelo modal

    const lado = evento.clientX < tela.width / 2 ? "esquerda" : "direita";
    moverLenhador(lado);
}, { passive: false });


function moverLenhador(lado) {
    if (jogoAcabou || faseCompleta) return;
    lenhador.lado = lado;
    lenhador.xAlvo = lado === "esquerda" ? LENHADOR_X_ESQUERDA : LENHADOR_X_DIREITA;
    // Se já existe um golpe animando, finaliza-o usando o lado que estava em andamento
    const ladoAnteriorDoGolpe = ladoGolpeEmAndamento;
    SpriteLenhador.interromperGolpeSeAtivo(() => resolverCorte(ladoAnteriorDoGolpe));
    // Inicia novo golpe travado no lado escolhido agora
    ladoGolpeEmAndamento = lado;
    if (jogoAcabou || faseCompleta) return;
    SpriteLenhador.iniciarGolpe(() => resolverCorte(ladoGolpeEmAndamento));
}


function galhoAleatorio() {
    return Math.random() > 0.5 ? "esquerda" : "direita";
}


function resolverCorte(ladoDoGolpe = lenhador.lado) {
    const cortandoCat = catIndex === galhos.length - 1;
    let galhoBaixo = galhos.pop();
    if (galhoBaixo === ladoDoGolpe) {
        entrarGameOver();
        return;
    }
    if (!cortandoCat) {
        galhos.unshift(galhoAleatorio());
        catIndex = Math.min(catIndex + 1, galhos.length - 1);
    }
    pontosTotal++;
    pontosFase++;
    // adiciona um pouco de tempo ao cortar
    tempoRestante += 0.3;
    if (tempoRestante > tempoMaximo) tempoRestante = tempoMaximo;
    if (pontosFase >= GALHOS_POR_FASE) {
        faseCompleta = true;
        SpriteLenhador.resetarEstado();
        if (window.ModalJogo) window.ModalJogo.mostrarFimDeFase(proximaFase);
    }
}

function entrarGameOver() {
    if (jogoAcabou) return;
    jogoAcabou = true;
    SpriteLenhador.entrarDerrota();
    if (window.ModalJogo) window.ModalJogo.mostrarFimDeJogo(reiniciarJogo);
}


function proximaFase() {
    fase++;
    pontosFase = 0;
    faseCompleta = false;
    tempoMaximo = Math.max(3, tempoMaximo - 1);
    tempoRestante = tempoMaximo;
    SpriteLenhador.resetarEstado();
    if (window.ModalJogo) window.ModalJogo.fechar();
    resetGalhos();
}


function reiniciarJogo() {
    fase = 1;
    pontosTotal = 0;
    pontosFase = 0;
    tempoMaximo = 10;
    tempoRestante = 10;
    jogoAcabou = false;
    faseCompleta = false;
    SpriteLenhador.resetarEstado();
    resetGalhos();
    if (window.ModalJogo) window.ModalJogo.fechar();
}


function atualizar() {
    lenhador.x += (lenhador.xAlvo - lenhador.x) * 0.2;
    if (!jogoAcabou && !faseCompleta) {
        tempoRestante -= 0.016;
        if (tempoRestante <= 0) {
            entrarGameOver();
        }
    }
}


function desenharArvore() {
    if (troncoCarregado && imgTronco.naturalWidth > 0 && imgTronco.naturalHeight > 0) {
        // Repete o tronco para ocupar toda a altura
        for (let y = 0; y < tela.height; y += imgTronco.naturalHeight) {
            contexto.drawImage(imgTronco, ARVORE_X, y, ARVORE_LARGURA, imgTronco.naturalHeight);
        }
    } else {
        contexto.fillStyle = padraoTronco || "brown";
        contexto.fillRect(ARVORE_X, 0, ARVORE_LARGURA, tela.height);
    }
}

function obterCenarioAtual() {
    const isMobile = window.innerWidth <= 768;
    return {
        img: isMobile ? imgCenarioMobile : imgCenarioDesktop,
        carregado: isMobile ? cenarioMobileCarregado : cenarioDesktopCarregado,
    };
}

function desenharCenario() {
    const { img, carregado } = obterCenarioAtual();
    if (!carregado || !img.naturalWidth || !img.naturalHeight) {
        // fallback simples
        contexto.fillStyle = "#87CEEB";
        contexto.fillRect(0, 0, tela.width, tela.height);
        return;
    }

    // Cobrir toda a tela mantendo proporção (efeito cover)
    const escala = Math.max(tela.width / img.naturalWidth, tela.height / img.naturalHeight);
    const larguraDesenho = img.naturalWidth * escala;
    const alturaDesenho = img.naturalHeight * escala;
    const offsetX = (tela.width - larguraDesenho) / 2;
    const offsetY = (tela.height - alturaDesenho) / 2;
    contexto.drawImage(img, offsetX, offsetY, larguraDesenho, alturaDesenho);
}


function desenharGalhos() {
    const margemBase = LENHADOR_ALTURA + LENHADOR_Y_OFFSET + 40; // reserva espaço perto do chão
    const visiveis = Math.min(galhos.length, MAX_GALHOS_VISIVEIS);
    const startIndex = Math.max(0, galhos.length - visiveis);

    for (let i = startIndex; i < galhos.length; i++) {
        const idxNaTela = i - startIndex; // 0 é o mais baixo visível
        const y = tela.height - margemBase - (visiveis - idxNaTela) * GALHO_ESPACAMENTO;
        const isUltimo = i === catIndex; // galho especial (gato)
        const ladoGalho = galhos[i];
        const x = ladoGalho === "esquerda" ? GALHO_X_ESQUERDA : GALHO_X_DIREITA;

        const deveDesenharGalho = !(isUltimo && gatoCarregado);

        if (deveDesenharGalho) {
            if (galhoCarregado) {
                contexto.save();
                // Assume a textura aponta para a direita; espelha apenas para a esquerda
                if (ladoGalho === "esquerda") {
                    contexto.translate(x + GALHO_LARGURA, y);
                    contexto.scale(-1, 1);
                    contexto.drawImage(imgGalho, 0, 0, GALHO_LARGURA, GALHO_ALTURA);
                } else {
                    contexto.drawImage(imgGalho, x, y, GALHO_LARGURA, GALHO_ALTURA);
                }
                contexto.restore();
            } else {
                contexto.fillStyle = isUltimo ? COR_GALHO_FINAL : COR_GALHO;
                contexto.fillRect(x, y, GALHO_LARGURA, GALHO_ALTURA);
            }
        }

        // Desenha o gato no último galho com espelhamento
        if (isUltimo && gatoCarregado) {
            const xGato = x + GATO_OFFSET_X;
            const yGato = y + GATO_OFFSET_Y;
            contexto.save();
            if (ladoGalho === "esquerda") {
                contexto.translate(xGato + GATO_LARGURA, yGato);
                contexto.scale(-1, 1);
                contexto.drawImage(imgGato, 0, 0, GATO_LARGURA, GATO_ALTURA);
            } else {
                contexto.drawImage(imgGato, xGato, yGato, GATO_LARGURA, GATO_ALTURA);
            }
            contexto.restore();
        }
    }
}


function desenharLenhador() {
    const y = tela.height - LENHADOR_ALTURA - LENHADOR_Y_OFFSET;
    SpriteLenhador.desenhar(contexto, {
        x: lenhador.x,
        y,
        lado: lenhador.lado,
        largura: LENHADOR_LARGURA,
        altura: LENHADOR_ALTURA,
    });
}


function desenharUI() {
    contexto.fillStyle = "black";
    contexto.font = "18px Arial";
    contexto.fillText("Pontos: " + pontosTotal, 10, 20);
    contexto.fillText("Fase: " + fase, 10, 40);

    // barra de tempo
    contexto.fillStyle = "red";
    contexto.fillRect(10, 70, (tempoRestante / tempoMaximo) * 200, 10);
    contexto.strokeRect(10, 70, 200, 10);
}


function desenhar() {
    contexto.clearRect(0, 0, tela.width, tela.height);
    desenharCenario();
    desenharArvore();
    desenharGalhos();
    desenharLenhador();
    desenharUI();
}


function loopDoJogo() {
    atualizar();
    desenhar();
    requestAnimationFrame(loopDoJogo);
}

loopDoJogo();