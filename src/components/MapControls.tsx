import ZwsLayerSelect from './ZwsLayerSelect';
import WmsLayersControl from './WmsLayersControl';
import { useTranslation } from 'react-i18next';

interface MapControlsProps {
	zwsLayer: string;
	onZwsLayerChange: (layer: string) => void;
	wmsLayers: string[];
	onWmsLayersChange: (layers: string[]) => void;
	crsCode: string;
}

export default function MapControls({
																			zwsLayer,
																			onZwsLayerChange,
																			wmsLayers,
																			onWmsLayersChange,
																			crsCode
																		}: MapControlsProps) {
	const { t } = useTranslation();

	return (
		<div style={{
			position: 'absolute', top: 12, left: 12, background: '#fff',
			padding: 8, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
			display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1000
		}}>
			<ZwsLayerSelect
				value={zwsLayer}
				onChange={onZwsLayerChange}
				disabled={crsCode !== 'EPSG:3857'}
			/>
			<WmsLayersControl
				value={wmsLayers}
				onChange={onWmsLayersChange}
			/>
		</div>
	);
}
