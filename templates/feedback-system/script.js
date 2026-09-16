const buttons = document.querySelectorAll("[data-view-button]");
const views = document.querySelectorAll("[data-view]");

for (const button of buttons) {
  button.addEventListener("click", () => {
    const target = button.dataset.viewButton;

    for (const item of buttons) {
      item.classList.toggle("isActive", item === button);
    }

    for (const view of views) {
      view.classList.toggle("isVisible", view.dataset.view === target);
    }
  });
}

function bindSelectableItems(selector) {
  const items = document.querySelectorAll(selector);

  for (const item of items) {
    item.addEventListener("click", () => {
      for (const entry of items) {
        entry.classList.toggle("isActive", entry === item);
      }
    });
  }
}

bindSelectableItems(".ticketItem");
bindSelectableItems(".adminTicket");
