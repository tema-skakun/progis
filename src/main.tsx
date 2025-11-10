import React from 'react';
import ReactDOM from 'react-dom/client';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './i18n';
import App from './App';


ReactDOM.createRoot(document.getElementById('root')!).render(
	<>
		<React.StrictMode>
			<App/>
		</React.StrictMode>
		<ToastContainer position="top-right" autoClose={2000} newestOnTop closeOnClick/>
	</>
);
