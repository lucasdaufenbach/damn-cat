
const tela = document.getElementById("game");
const contexto = tela.getContext("2d");
const botaoReiniciar = document.getElementById("restart-btn");
const botaoNext = document.getElementById("next-btn");

// Dimensões dos elementos
const ARVORE_LARGURA = 40;
const GALHO_LARGURA = 40;
const GALHO_ALTURA = 20;
const GALHO_OFFSET_X = 40;
const LENHADOR_LARGURA = 40;
const LENHADOR_ALTURA = 40;
const LENHADOR_Y_OFFSET = 60; // distância do lenhador ao chão

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

let galhos = ["esquerda","direita","esquerda","esquerda","direita"];

let fase = 1;
let pontosTotal = 0;
let pontosFase = 0;

let tempoMaximo = 10;
let tempoRestante = 10;

let jogoAcabou = false;
let faseCompleta = false;

const GALHOS_POR_FASE = 5;

function mostrarBotaoReiniciar(visivel) {
    botaoReiniciar.style.display = visivel ? "block" : "none";
}

function mostrarBotaoNext(visivel) {
    botaoNext.style.display = visivel ? "block" : "none";
}


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

window.addEventListener('resize', resizeCanvas);
resizeCanvas();


document.addEventListener("keydown", (evento) => {
    if (jogoAcabou && (evento.key === "r" || evento.key === "R")) {
        reiniciarJogo();
        return;
    }
    if (faseCompleta && evento.key === " ") {
        proximaFase();
        return;
    }
    if (jogoAcabou || faseCompleta) return;
    if (evento.key === "ArrowLeft") moverLenhador("esquerda");
    if (evento.key === "ArrowRight") moverLenhador("direita");
});

botaoReiniciar.addEventListener("click", reiniciarJogo);
botaoNext.addEventListener("click", proximaFase);

// Suporte a toque/cliques: divide a tela em dois lados para escolher o lado do lenhador
tela.addEventListener("pointerdown", (evento) => {
    // evita que o toque gere scroll/zoom em mobile
    evento.preventDefault();

    if (jogoAcabou) return; // no game over, use the restart button
    if (faseCompleta) return; // próxima fase via botão

    const lado = evento.clientX < tela.width / 2 ? "esquerda" : "direita";
    moverLenhador(lado);
}, { passive: false });


function moverLenhador(lado) {
    lenhador.lado = lado;
    lenhador.xAlvo = lado === "esquerda" ? LENHADOR_X_ESQUERDA : LENHADOR_X_DIREITA;
    cortar();
}


function galhoAleatorio() {
    return Math.random() > 0.5 ? "esquerda" : "direita";
}


function cortar() {
    let galhoBaixo = galhos.pop();
    if (galhoBaixo === lenhador.lado) {
        jogoAcabou = true;
        mostrarBotaoReiniciar(true);
        return;
    }
    galhos.unshift(galhoAleatorio());
    pontosTotal++;
    pontosFase++;
    // adiciona um pouco de tempo ao cortar
    tempoRestante += 0.3;
    if (tempoRestante > tempoMaximo) tempoRestante = tempoMaximo;
    if (pontosFase >= GALHOS_POR_FASE) {
        faseCompleta = true;
        mostrarBotaoNext(true);
    }
}


function proximaFase() {
    fase++;
    pontosFase = 0;
    faseCompleta = false;
    tempoMaximo = Math.max(3, tempoMaximo - 1);
    tempoRestante = tempoMaximo;
    mostrarBotaoNext(false);
}


function reiniciarJogo() {
    fase = 1;
    pontosTotal = 0;
    pontosFase = 0;
    tempoMaximo = 10;
    tempoRestante = 10;
    jogoAcabou = false;
    faseCompleta = false;
    galhos = ["esquerda","direita","esquerda","esquerda","direita"];
    mostrarBotaoReiniciar(false);
    mostrarBotaoNext(false);
}


function atualizar() {
    lenhador.x += (lenhador.xAlvo - lenhador.x) * 0.2;
    if (!jogoAcabou && !faseCompleta) {
        tempoRestante -= 0.016;
        if (tempoRestante <= 0) {
            jogoAcabou = true;
            mostrarBotaoReiniciar(true);
        }
    }
}


function desenharArvore() {
    contexto.fillStyle = "brown";
    contexto.fillRect(ARVORE_X, 0, ARVORE_LARGURA, tela.height);
}


function desenharGalhos() {
    contexto.fillStyle = "green";
    const margemBase = LENHADOR_ALTURA + LENHADOR_Y_OFFSET + 40; // reserva espaço perto do chão
    const espacamento = (tela.height - margemBase) / galhos.length;
    for (let i = 0; i < galhos.length; i++) {
        let y = i * espacamento;
        if (galhos[i] === "esquerda")
            contexto.fillRect(GALHO_X_ESQUERDA, y, GALHO_LARGURA, GALHO_ALTURA);
        else
            contexto.fillRect(GALHO_X_DIREITA, y, GALHO_LARGURA, GALHO_ALTURA);
    }
}


function desenharLenhador() {
    contexto.fillStyle = "red";
    const y = tela.height - LENHADOR_ALTURA - LENHADOR_Y_OFFSET;
    contexto.fillRect(lenhador.x, y, LENHADOR_LARGURA, LENHADOR_ALTURA);
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


function desenharGameOver() {
    contexto.fillStyle = "black";
    contexto.font = "40px Arial";
    contexto.fillText("FIM DE JOGO", 80, 300);
}


function desenharFaseCompleta() {
    contexto.fillStyle = "black";
    contexto.font = "36px Arial";
    contexto.fillText("FASE COMPLETA!", 70, 280);
}


function desenhar() {
    contexto.clearRect(0, 0, tela.width, tela.height);
    desenharArvore();
    desenharGalhos();
    desenharLenhador();
    desenharUI();
    if (jogoAcabou) desenharGameOver();
    if (faseCompleta) desenharFaseCompleta();
}


function loopDoJogo() {
    atualizar();
    desenhar();
    requestAnimationFrame(loopDoJogo);
}

loopDoJogo();