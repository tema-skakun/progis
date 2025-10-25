import {useState, useMemo} from 'react';
import MapView from './components/MapView';
import {useTranslation} from 'react-i18next';

export type CRSCode = 'EPSG:3857' | 'EPSG:4326';

const DEFAULT_CENTER_4326: [number, number] = [64.557973142, 39.825462946];

export default function App() {
	const {i18n, t} = useTranslation();
	const [crs, setCrs] = useState<CRSCode>('EPSG:3857');

	const center = useMemo(() => DEFAULT_CENTER_4326, []);

	return (
		<div style={{height: '100vh', display: 'flex', flexDirection: 'column'}}>
			<header
				style={{
					padding: 8,
					borderBottom: '1px solid #e5e7eb',
					display: 'flex',
					gap: 12,
					alignItems: 'center',
				}}
			>
				<strong>Leaflet WMS/WFS/ZWS</strong>
				<label>
					{t('crs')}:&nbsp;
					<select value={crs} onChange={(e) => setCrs(e.target.value as CRSCode)}>
						<option value="EPSG:3857">EPSG:3857</option>
						<option value="EPSG:4326">EPSG:4326</option>
					</select>
				</label>
				<label>
					{t('lang')}:&nbsp;
					<select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)}>
						<option value="ru">Русский</option>
						<option value="en">English</option>
					</select>
				</label>
			</header>
			<main style={{flex: '1 1 0%', minHeight: 0}}>
				<MapView center={center} zoom={13} crsCode={crs}/>
			</main>
		</div>
	);
}
