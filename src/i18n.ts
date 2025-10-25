import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import HttpBackend from 'i18next-http-backend';


void i18n
	.use(HttpBackend)
	.use(initReactI18next)
	.init({
		lng: 'ru',
		fallbackLng: 'en',
		interpolation: {escapeValue: false},
		backend: {
			loadPath: '/locales/{{lng}}/translation.json'
		}
	});


export default i18n;
