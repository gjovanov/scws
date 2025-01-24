import { defineStore } from "pinia";

export const useProgressStore = defineStore("progress", {
	state: () => ({ progress: 0 }),
	actions: {
		setProgress(progress) {
			this.progress = progress;
		},
	},
});
