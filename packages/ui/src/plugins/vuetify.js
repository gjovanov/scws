/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Components
import { VNumberInput } from 'vuetify/labs/VNumberInput'

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
// Composables
import { createVuetify } from 'vuetify'
// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components: {
    VNumberInput
  },
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#E0F2F1',
          accent: '#424242',
          secondary: '#E65100',
          info: '#26A69A',
          warning: '#FFA000',
          error: '#FF3D00',
          success: '#00C853',
        },
      },
      dark: {
        colors: {
          background: '#222',
          primary: '#B2DFDB',
          accent: '#212121',
          secondary: '#E65100',
          info: '#26A69A',
          warning: '#FFA000',
          error: '#DD2C00',
          success: '#00C853',
        },
      },
    },
  },
})

/*
background: '#FFFFFF',
    surface: '#FFFFFF',
    primary: '#6200EE',
    'primary-darken-1': '#3700B3',
    secondary: '#03DAC6',
    'secondary-darken-1': '#018786',
    error: '#B00020',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
*/
