
const tela = document.getElementById("game");
const contexto = tela.getContext("2d");

// Dimensões dos elementos
const ARVORE_LARGURA = 40;
const GALHO_LARGURA = 40;
const GALHO_ALTURA = 20;
const GALHO_OFFSET_X = 40;
const GALHO_ESPACAMENTO = 70; // distância vertical entre galhos renderizados
const MAX_GALHOS_VISIVEIS = 8; // quantos galhos mostramos no "viewport"
const LENHADOR_LARGURA = 120; // 3x maior
const LENHADOR_ALTURA = 120;  // 3x maior
const LENHADOR_Y_OFFSET = 60; // distância do lenhador ao chão
const COR_GALHO = "green";
const COR_GALHO_FINAL = "#ffd166";
const COR_GALHO_FINAL_BORDA = "#cc9a1b";
const TEMPO_FRAME_GOLPE = 100; // ms por frame do golpe

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

const GALHOS_POR_FASE = 20;

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
    contexto.fillStyle = "brown";
    contexto.fillRect(ARVORE_X, 0, ARVORE_LARGURA, tela.height);
}


function desenharGalhos() {
    const margemBase = LENHADOR_ALTURA + LENHADOR_Y_OFFSET + 40; // reserva espaço perto do chão
    const visiveis = Math.min(galhos.length, MAX_GALHOS_VISIVEIS);
    const startIndex = Math.max(0, galhos.length - visiveis);

    for (let i = startIndex; i < galhos.length; i++) {
        const idxNaTela = i - startIndex; // 0 é o mais baixo visível
        const y = tela.height - margemBase - (visiveis - idxNaTela) * GALHO_ESPACAMENTO;
        const isUltimo = i === catIndex; // galho especial (gato)
        const x = galhos[i] === "esquerda" ? GALHO_X_ESQUERDA : GALHO_X_DIREITA;
        contexto.fillStyle = isUltimo ? COR_GALHO_FINAL : COR_GALHO;
        contexto.fillRect(x, y, GALHO_LARGURA, GALHO_ALTURA);
        if (isUltimo) {
            contexto.strokeStyle = COR_GALHO_FINAL_BORDA;
            contexto.lineWidth = 2;
            contexto.strokeRect(x - 2, y - 2, GALHO_LARGURA + 4, GALHO_ALTURA + 4);
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