import { toast as sonnerToast } from "sonner";

function announce(id: string, message: string) {
	const el = document.getElementById(id);
	if (!el) return;
	el.textContent = "";
	requestAnimationFrame(() => {
		el.textContent = message;
	});
}

export const toast = {
	success(message: string, options?: Parameters<typeof sonnerToast.success>[1]) {
		sonnerToast.success(message, options);
		announce("toast-announcer-polite", message);
	},
	error(message: string, options?: Parameters<typeof sonnerToast.error>[1]) {
		sonnerToast.error(message, options);
		announce("toast-announcer-assertive", message);
	},
};
