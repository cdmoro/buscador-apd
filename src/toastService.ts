import Toast from "bootstrap/js/dist/toast";

type ToastType = "success" | "error" | "info" | "warning";

interface ShowToastOptions {
  delay?: number;
  type?: ToastType;
}

function getBgClass(type: ToastType) {
  switch (type) {
    case "success":
      return "border-success";
    case "error":
      return "border-danger";
    case "warning":
      return "border-warning";
    default:
      return "border-info";
  }
}

function ensureContainer(): HTMLElement {
  let container = document.querySelector(".toast-container");

  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container position-fixed bottom-0 start-0 p-3";
    document.body.appendChild(container);
  }

  return container as HTMLElement;
}

export function showToast(
  message: string,
  { delay = 3000, type = "info" }: ShowToastOptions = {},
) {
  const container = ensureContainer();

  const toastEl = document.createElement("div");
  toastEl.className = `toast ${getBgClass(type)}`;
  toastEl.role = "alert";

  toastEl.innerHTML = `
    <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toastEl);

  const toast = new Toast(toastEl, {
    delay,
    autohide: true,
  });

  toast.show();

  // limpiar DOM cuando desaparece
  toastEl.addEventListener("hidden.bs.toast", () => {
    toastEl.remove();
  });
}