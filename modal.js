// Componente simples de modal para fim de jogo e troca de fase
(function anexarModalJogo() {
  const HERO_IMG_SRC = "img/heroi.webp";
  const style = document.createElement("style");
  style.textContent = `
    .modal-jogo {
      position: fixed;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      background: transparent;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 5;
    }
    .modal-jogo.visivel { display: flex; }
    .modal-jogo__caixa {
      background: #fff;
      padding: 20px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
      min-width: 260px;
      max-width: 90vw;
      text-align: center;
      font-family: Arial, sans-serif;
    }
    .modal-jogo__titulo {
      margin: 0 0 8px;
      font-size: 28px;
      color: #222;
    }
    .modal-jogo__imagem {
      display: none;
      width: 160px;
      max-width: 80vw;
      height: auto;
      margin: 0 auto 12px;
    }
    /* Variante para modal de vitória (herói ocupa quase toda a tela) */
    .modal-jogo--win .modal-jogo__caixa {
      background: transparent;
      box-shadow: none;
      padding: 0;
      border-radius: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      max-width: 100vw;
      width: 100%;
    }
    .modal-jogo--win .modal-jogo__imagem {
      display: block;
      width: 90vw;
      max-width: 520px;
      max-height: 70vh;
      object-fit: contain;
      margin: 0 auto;
      border-radius: 14px;
    }
    .modal-jogo--win .modal-jogo__titulo,
    .modal-jogo--win .modal-jogo__subtitulo {
      display: none;
    }
    .modal-jogo--win .modal-jogo__caixa {
      position: relative;
    }
    .modal-jogo--win .modal-jogo__acoes {
      position: absolute;
      left: 0;
      right: 0;
      top: 80%; 
      display: flex;
      justify-content: center;
      gap: 12px;
      padding: 0 16px;
      pointer-events: none;
    }
    .modal-jogo--win .modal-jogo__acoes .modal-jogo__botao {
      pointer-events: auto;
    }
    .modal-jogo__subtitulo {
      margin: 0 0 16px;
      font-size: 16px;
      color: #444;
    }
    .modal-jogo__acoes {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .modal-jogo__botao {
      padding: 12px 18px;
      font-size: 16px;
      color: #fff;
      border: none;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
      cursor: pointer;
      min-width: 140px;
    }
    .modal-jogo__botao--perigo { background: #ff5959; }
    .modal-jogo__botao--primario { background: #4caf50; }
    .modal-jogo__botao:active { transform: translateY(1px); }
  `;
  document.head.appendChild(style);

  // Pré-carrega a imagem do herói para o modal de vitória
  const heroiPreload = new Image();
  heroiPreload.src = HERO_IMG_SRC;
  if (heroiPreload.decode) {
    heroiPreload.decode().catch(() => {});
  }

  const modal = document.createElement("div");
  modal.className = "modal-jogo";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");

  const box = document.createElement("div");
  box.className = "modal-jogo__caixa";

  const title = document.createElement("h1");
  title.className = "modal-jogo__titulo";

  const subtitle = document.createElement("p");
  subtitle.className = "modal-jogo__subtitulo";

  const imagem = document.createElement("img");
  imagem.className = "modal-jogo__imagem";
  imagem.alt = "Ilustração";

  const actions = document.createElement("div");
  actions.className = "modal-jogo__acoes";

  box.appendChild(title);
  box.appendChild(subtitle);
  box.appendChild(imagem);
  box.appendChild(actions);
  modal.appendChild(box);
  document.body.appendChild(modal);

  function abrirModal({ tituloModal, subtituloModal = "", botoes, imagemSrc = null, modoWin = false }) {
    title.textContent = tituloModal;
    subtitle.textContent = subtituloModal;

    // controla variante de vitória
    if (modoWin) {
      modal.classList.add("modal-jogo--win");
    } else {
      modal.classList.remove("modal-jogo--win");
    }

    // oculta título/subtítulo se vazios
    title.style.display = tituloModal ? "block" : "none";
    subtitle.style.display = subtituloModal ? "block" : "none";

    if (imagemSrc) {
      imagem.src = imagemSrc;
      imagem.style.display = "block";
    } else {
      imagem.removeAttribute("src");
      imagem.style.display = "none";
    }

    // clear previous buttons
    while (actions.firstChild) actions.removeChild(actions.firstChild);

    botoes.forEach(({ rotulo, variante, aoClicar }) => {
      const btn = document.createElement("button");
      btn.className = `modal-jogo__botao ${variante === "perigo" ? "modal-jogo__botao--perigo" : "modal-jogo__botao--primario"}`;
      btn.textContent = rotulo;
      btn.addEventListener("click", () => {
        fecharModal();
        if (typeof aoClicar === "function") aoClicar();
      });
      actions.appendChild(btn);
    });

    modal.classList.add("visivel");
  }

  function fecharModal() {
    modal.classList.remove("visivel");
  }

  window.ModalJogo = {
    mostrarFimDeJogo(aoReiniciar) {
      abrirModal({
        tituloModal: "FIM DE JOGO",
        subtituloModal: "",
        botoes: [
          { rotulo: "Reiniciar", variante: "perigo", aoClicar: aoReiniciar }
        ]
      });
    },
    mostrarFimDeFase(aoProximaFase) {
      abrirModal({
        tituloModal: "",
        subtituloModal: "",
        imagemSrc: HERO_IMG_SRC,
        modoWin: true,
        botoes: [
          { rotulo: "Próxima fase", variante: "primario", aoClicar: aoProximaFase }
        ]
      });
    },
    fechar: fecharModal
  };
})();
