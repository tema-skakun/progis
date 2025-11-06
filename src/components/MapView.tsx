import { useMemo, useState, useCallback } from 'react';
import { View } from 'ol';
import { fromLonLat, toLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import { Vector as VectorSource } from 'ol/source';
import { Style, Circle, Fill, Stroke } from 'ol/style';
import OLMap from './OLMap';
import { buildOlGetFeatureInfoUrl, fetchOlFeatureInfo } from '../services/olOgc';
import { parseFeatureInfoXml } from '../utils/xml';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { CRSCode } from '../App';
import MapLayersManager from './MapLayersManager';
import MapClickHandler from './MapClickHandler';
import FeatureManager from './FeatureManager';
import MapControls from './MapControls';
import LoadingIndicator from './LoadingIndicator';
import FeaturePopup from './FeaturePopup';
import { FoundFeature } from '../types';

const ZWS_DEFAULT_LAYER = 'example:demo';
const WMS_DEFAULT_LAYERS = ['openlayers:teploset'];

export default function MapView({
																	center, zoom, crsCode,
																}: { center: [number, number]; zoom: number; crsCode: CRSCode; }) {
	const { t } = useTranslation();
	const [zwsLayer, setZwsLayer] = useState<string>(ZWS_DEFAULT_LAYER);
	const [wmsLayers, setWmsLayers] = useState<string[]>(WMS_DEFAULT_LAYERS);
	const [found, setFound] = useState<FoundFeature | null>(null);
	const [currentMap, setCurrentMap] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(false);

	const centerProjected = useMemo(() =>
			crsCode === 'EPSG:3857' ? fromLonLat(center) : center,
		[center, crsCode]
	);

	// Стиль и источник для найденных объектов
	const foundFeatureStyle = useMemo(() => new Style({
		image: new Circle({
			radius: 6,
			fill: new Fill({ color: '#ff3b3b' }),
			stroke: new Stroke({ color: '#fff', width: 2 })
		})
	}), []);

	const vectorSource = useMemo(() => new VectorSource(), []);

	const handleMapReady = useCallback((map: any) => {
		setCurrentMap(map);
	}, []);

	const handleMapClick = useCallback(async (coordinate: [number, number]) => {
		if (!currentMap || isLoading || wmsLayers.length === 0) return;

		setIsLoading(true);

		for (const layer of wmsLayers) {
			try {
				const url = buildOlGetFeatureInfoUrl({
					map: currentMap,
					coordinate: coordinate,
					srs: crsCode,
					layers: [layer]
				});

				const xmlResponse = await fetchOlFeatureInfo(url);
				const featureInfo = parseFeatureInfoXml(xmlResponse);

				if (featureInfo) {
					const lonLatCoordinate = crsCode === 'EPSG:3857'
						? toLonLat(coordinate)
						: coordinate;

					const foundFeature: FoundFeature = {
						typename: featureInfo.typename,
						fid: featureInfo.fid,
						coordinate: lonLatCoordinate as [number, number],
						props: featureInfo.props
					};

					setFound(foundFeature);
					toast.success(t('featureFound'));
					setIsLoading(false);
					return;
				}
			} catch (err) {
				console.warn(`Error with layer ${layer}:`, err);
			}
		}

		setFound(null);
		toast.info(t('noFeatureFound'));
		setIsLoading(false);
	}, [currentMap, isLoading, wmsLayers, crsCode, t]);

	const view = useMemo(() => new View({
		center: centerProjected,
		zoom: zoom,
		projection: crsCode
	}), [centerProjected, zoom, crsCode]);

	const mapOptions = useMemo(() => ({
		view: view,
		controls: defaultControls({
			zoom: true,
			rotate: true,
			attribution: false
		}),
		interactions: defaultInteractions({
			pinchRotate: true,
			mouseWheelZoom: true
		})
	}), [view]);

	return (
		<div style={{ height: '100%', width: '100%', position: 'relative' }}>
			<OLMap
				{...mapOptions}
				style={{ height: '100%', width: '100%' }}
				onMapReady={handleMapReady}
			>
				{currentMap && (
					<>
						<MapLayersManager
							map={currentMap}
							crsCode={crsCode}
							zwsLayer={zwsLayer}
							wmsLayers={wmsLayers}
							vectorSource={vectorSource}
						/>
						<MapClickHandler
							map={currentMap}
							onMapClick={handleMapClick}
							isLoading={isLoading}
							wmsLayers={wmsLayers}
						/>
					</>
				)}
			</OLMap>

			<FeatureManager
				vectorSource={vectorSource}
				foundFeature={found}
				crsCode={crsCode}
			/>

			<LoadingIndicator isLoading={isLoading} />

			<MapControls
				zwsLayer={zwsLayer}
				onZwsLayerChange={setZwsLayer}
				wmsLayers={wmsLayers}
				onWmsLayersChange={setWmsLayers}
				crsCode={crsCode}
			/>

			{found && (
				<FeaturePopup
					feature={found}
					onClose={() => setFound(null)}
				/>
			)}
		</div>
	);
}
