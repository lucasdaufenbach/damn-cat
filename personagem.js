// Gerencia sprites e animações do lenhador em um único módulo
(() => {
    const IMG_LENHADOR_INICIO = "img/inicio-direita.webp";
    const IMG_LENHADOR_DERROTA = "img/gameover-direita.webp";
    const IMG_CORTE_1 = "img/corte-1-esquerda.webp"; // orientada para a esquerda
    const IMG_CORTE_2 = "img/corte-2-direita.webp";  // orientada para a direita

  let tempoFrameGolpe = 100;

  const imgLenhador = new Image();
  const imgLenhadorDerrota = new Image();
  const imgCorte1 = new Image();
  const imgCorte2 = new Image();

  let imgLenhadorCarregada = false;
  let imgLenhadorDerrotaCarregada = false;
  let imgCorte1Carregada = false;
  let imgCorte2Carregada = false;

  imgLenhador.onload = () => { imgLenhadorCarregada = true; };
  imgLenhadorDerrota.onload = () => { imgLenhadorDerrotaCarregada = true; };
  imgCorte1.onload = () => { imgCorte1Carregada = true; };
  imgCorte2.onload = () => { imgCorte2Carregada = true; };

  imgLenhador.src = IMG_LENHADOR_INICIO;
  imgLenhadorDerrota.src = IMG_LENHADOR_DERROTA;
  imgCorte1.src = IMG_CORTE_1;
  imgCorte2.src = IMG_CORTE_2;

  // Estados possíveis: parado | golpe1 | golpe2 | derrota
  let estadoSprite = "parado";
  let animacaoGolpeAtiva = false;
  let temporizadoresAnimacao = [];

  let aoResolverCorte = () => {};
  let aoDerrota = () => {};

  function limparAnimacaoGolpe() {
      animacaoGolpeAtiva = false;
      temporizadoresAnimacao.forEach(clearTimeout);
      temporizadoresAnimacao = [];
      if (estadoSprite !== "derrota") estadoSprite = "parado";
  }

  function iniciarGolpeInterno(resolveCb) {
      limparAnimacaoGolpe();
      aoResolverCorte = resolveCb || (() => {});
      animacaoGolpeAtiva = true;
      estadoSprite = "golpe1";

      const timerGolpe2 = setTimeout(() => {
          estadoSprite = "golpe2";
      }, tempoFrameGolpe);

      const timerParado = setTimeout(() => {
          estadoSprite = "parado";
          animacaoGolpeAtiva = false;
          aoResolverCorte();
      }, tempoFrameGolpe * 2);

      temporizadoresAnimacao.push(timerGolpe2, timerParado);
  }

  function interromperGolpeSeAtivoInterno(resolveCb) {
      if (!animacaoGolpeAtiva) return false;
      limparAnimacaoGolpe();
      const cb = resolveCb || aoResolverCorte;
      cb();
      return true;
  }

  function entrarDerrotaInterno() {
      limparAnimacaoGolpe();
      estadoSprite = "derrota";
      animacaoGolpeAtiva = false;
      aoDerrota();
  }

  function resetarEstadoInterno() {
      limparAnimacaoGolpe();
      estadoSprite = "parado";
  }

  function desenhar(contexto, { x, y, lado, largura, altura }) {
      let imagemAtual = imgLenhador;
      let carregada = imgLenhadorCarregada;
      let baseOrientacaoDireita = true;

      if (estadoSprite === "derrota" && imgLenhadorDerrotaCarregada) {
          imagemAtual = imgLenhadorDerrota;
          carregada = true;
          baseOrientacaoDireita = true;
      } else if (estadoSprite === "golpe1" && imgCorte1Carregada) {
          imagemAtual = imgCorte1;
          carregada = true;
          baseOrientacaoDireita = false; // imagem voltada para a esquerda
      } else if (estadoSprite === "golpe2" && imgCorte2Carregada) {
          imagemAtual = imgCorte2;
          carregada = true;
          baseOrientacaoDireita = true; // imagem voltada para a direita
      }

      if (carregada) {
          contexto.save();
          const centroX = x + largura / 2;
          const centroY = y + altura / 2;
          const precisaEspelhar = baseOrientacaoDireita ? (lado === "esquerda") : (lado === "direita");
          const escalaX = precisaEspelhar ? -1 : 1;
          contexto.translate(centroX, centroY);
          contexto.scale(escalaX, 1);
          contexto.drawImage(
              imagemAtual,
              -largura / 2,
              -altura / 2,
              largura,
              altura
          );
          contexto.restore();
      } else {
          contexto.fillStyle = "red";
          contexto.fillRect(x, y, largura, altura);
      }
  }

  window.SpriteLenhador = {
      iniciar({ tempoFrame = 100, aoResolver = () => {}, aoGameOver = () => {} } = {}) {
          tempoFrameGolpe = tempoFrame;
          aoResolverCorte = aoResolver;
          aoDerrota = aoGameOver;
      },
      iniciarGolpe(resolveCb) {
          iniciarGolpeInterno(resolveCb);
      },
      interromperGolpeSeAtivo(resolveCb) {
          return interromperGolpeSeAtivoInterno(resolveCb);
      },
      entrarDerrota() {
          entrarDerrotaInterno();
      },
      resetarEstado() {
          resetarEstadoInterno();
      },
      desenhar,
  };
})();