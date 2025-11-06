import {useState, useMemo, useEffect} from 'react';
import MapView from './components/MapView';
import {useTranslation} from 'react-i18next';
import {CRSCode} from './types';
import WmsLayersDropdown from './components/WmsLayersDropdown';
import ZwsLayerSelect from './components/ZwsLayerSelect';

const DEFAULT_CENTER: [number, number] = [39.825462946, 64.557973142];

export default function App() {
	const {i18n, t} = useTranslation();
	const [crs, setCrs] = useState<CRSCode>('EPSG:3857');
	const [zwsLayer, setZwsLayer] = useState<string>('example:demo');
	const [wmsLayers, setWmsLayers] = useState<string[]>(['openlayers:teploset']);
	const [show4326Warning, setShow4326Warning] = useState(false);

	const center = useMemo(() => DEFAULT_CENTER, []);

// При смене CRS показываем предупреждение
	useEffect(() => {
		if (crs === 'EPSG:4326') {
			setShow4326Warning(true);
			// Автоматически скрываем через 5 секунд
			const timer = setTimeout(() => setShow4326Warning(false), 5000);
			return () => clearTimeout(timer);
		}
	}, [crs]);

	return (
		<div style={{height: '98dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>

			{show4326Warning && (
				<div style={{
					position: 'absolute',
					top: 60,
					left: '50%',
					transform: 'translateX(-50%)',
					background: '#ffeb3b',
					padding: '8px 16px',
					borderRadius: '4px',
					border: '1px solid #ffc107',
					zIndex: 1000,
					fontSize: '14px'
				}}>
					{t('4326Warning')}
				</div>
			)}

			<header
				style={{
					padding: '8px 16px',
					borderBottom: '1px solid #e5e7eb',
					display: 'flex',
					gap: '20px',
					alignItems: 'center',
					background: '#f8f9fa',
					flexWrap: 'wrap'
				}}
			>
				<strong style={{marginRight: 'auto'}}>OpenLayers WMS/WFS/ZWS</strong>

				{/* ZWS Layer Select */}
				<div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
					<span style={{fontSize: '14px', fontWeight: '500'}}>{t('zwsLayer')}:</span>
					<ZwsLayerSelect
						value={zwsLayer}
						onChange={setZwsLayer}
						disabled={false}
					/>
				</div>

				{/* WMS Layers Dropdown */}
				<div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
					<span style={{fontSize: '14px', fontWeight: '500'}}>{t('wmsLayers')}:</span>
					<WmsLayersDropdown
						value={wmsLayers}
						onChange={setWmsLayers}
					/>
				</div>

				{/* CRS Select */}
				<div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
					<span style={{fontSize: '14px', fontWeight: '500'}}>{t('crs')}:</span>
					<select
						value={crs}
						onChange={(e) => setCrs(e.target.value as CRSCode)}
						style={{
							padding: '4px 8px',
							borderRadius: '4px',
							border: '1px solid #ccc',
							background: '#fff',
							minWidth: '120px'
						}}
					>
						<option value="EPSG:3857">EPSG:3857</option>
						<option value="EPSG:4326">EPSG:4326</option>
					</select>
				</div>

				{/* Language Select */}
				<div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
					<span style={{fontSize: '14px', fontWeight: '500'}}>{t('lang')}:</span>
					<select
						value={i18n.language}
						onChange={(e) => i18n.changeLanguage(e.target.value)}
						style={{
							padding: '4px 8px',
							borderRadius: '4px',
							border: '1px solid #ccc',
							background: '#fff',
							minWidth: '100px'
						}}
					>
						<option value="ru">Русский</option>
						<option value="en">English</option>
					</select>
				</div>
			</header>

			<main style={{flex: '1 1 0%', minHeight: 0}}>
				<MapView
					center={center}
					zoom={13}
					crsCode={crs}
					zwsLayer={zwsLayer}
					wmsLayers={wmsLayers}
				/>
			</main>
		</div>
	);
}
