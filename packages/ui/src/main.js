/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

// document.body.style.zoom = "50%";


const app = createApp(App)

registerPlugins(app)

app.mount('#app')