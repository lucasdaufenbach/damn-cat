// Modal helper for game over and phase complete overlays
(function attachModalUI() {
  const style = document.createElement("style");
  style.textContent = `
    .game-modal {
      position: fixed;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.6);
      z-index: 5;
    }
    .game-modal.visible { display: flex; }
    .game-modal__box {
      background: #fff;
      padding: 20px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
      min-width: 260px;
      max-width: 90vw;
      text-align: center;
      font-family: Arial, sans-serif;
    }
    .game-modal__title {
      margin: 0 0 8px;
      font-size: 28px;
      color: #222;
    }
    .game-modal__subtitle {
      margin: 0 0 16px;
      font-size: 16px;
      color: #444;
    }
    .game-modal__actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .game-modal__btn {
      padding: 12px 18px;
      font-size: 16px;
      color: #fff;
      border: none;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
      cursor: pointer;
      min-width: 140px;
    }
    .game-modal__btn--danger { background: #ff5959; }
    .game-modal__btn--primary { background: #4caf50; }
    .game-modal__btn:active { transform: translateY(1px); }
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.className = "game-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");

  const box = document.createElement("div");
  box.className = "game-modal__box";

  const title = document.createElement("h1");
  title.className = "game-modal__title";

  const subtitle = document.createElement("p");
  subtitle.className = "game-modal__subtitle";

  const actions = document.createElement("div");
  actions.className = "game-modal__actions";

  box.appendChild(title);
  box.appendChild(subtitle);
  box.appendChild(actions);
  modal.appendChild(box);
  document.body.appendChild(modal);

  function openModal({ modalTitle, modalSubtitle = "", buttons }) {
    title.textContent = modalTitle;
    subtitle.textContent = modalSubtitle;

    // clear previous buttons
    while (actions.firstChild) actions.removeChild(actions.firstChild);

    buttons.forEach(({ label, kind, onClick }) => {
      const btn = document.createElement("button");
      btn.className = `game-modal__btn ${kind === "danger" ? "game-modal__btn--danger" : "game-modal__btn--primary"}`;
      btn.textContent = label;
      btn.addEventListener("click", () => {
        closeModal();
        if (typeof onClick === "function") onClick();
      });
      actions.appendChild(btn);
    });

    modal.classList.add("visible");
  }

  function closeModal() {
    modal.classList.remove("visible");
  }

  window.ModalUI = {
    showGameOver(onRestart) {
      openModal({
        modalTitle: "FIM DE JOGO",
        modalSubtitle: "",
        buttons: [
          { label: "Reiniciar", kind: "danger", onClick: onRestart }
        ]
      });
    },
    showPhaseComplete(onNext) {
      openModal({
        modalTitle: "FASE COMPLETA!",
        modalSubtitle: "",
        buttons: [
          { label: "Próxima fase", kind: "primary", onClick: onNext }
        ]
      });
    },
    close: closeModal
  };
})();
