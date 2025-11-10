import {useMemo, useState, useCallback} from 'react';
import {View} from 'ol';
import {fromLonLat, toLonLat} from 'ol/proj';
import {defaults as defaultControls} from 'ol/control';
import {defaults as defaultInteractions} from 'ol/interaction';
import {Vector as VectorSource} from 'ol/source';
import {Style, Circle, Fill, Stroke} from 'ol/style';
import OLMap from './OLMap';
import {buildOlGetFeatureInfoUrl, fetchOlFeatureInfo} from '../services/olOgc';
import {parseFeatureInfoXml} from '../utils/xml';
import {toast} from 'react-toastify';
import {useTranslation} from 'react-i18next';
import MapLayersManager from './MapLayersManager';
import MapClickHandler from './MapClickHandler';
import FeatureManager from './FeatureManager';
import LoadingIndicator from './LoadingIndicator';
import FeaturePopup from './FeaturePopup';
import {CRSCode, FoundFeature} from '../types';
import type { Map } from 'ol'

interface MapViewProps {
	center: [number, number];
	zoom: number;
	crsCode: CRSCode;
	zwsLayer: string;
	wmsLayers: string[];
}

export default function MapView({
																	center, zoom, crsCode, zwsLayer, wmsLayers
																}: MapViewProps) {
	const {t} = useTranslation();
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
			fill: new Fill({color: '#ff3b3b'}),
			stroke: new Stroke({color: '#fff', width: 2})
		})
	}), []);

	const vectorSource = useMemo(() => new VectorSource(), []);

	const handleMapReady = useCallback((map: Map) => {
		setCurrentMap(map);
	}, []);

	const handleMapClick = useCallback(async (coordinate: [number, number]) => {
		if (!currentMap || isLoading || wmsLayers.length === 0) return;
		setIsLoading(true);

		const controllers = wmsLayers.map(() => new AbortController());
		try {
			const tasks = wmsLayers.map((layer, i) => (async () => {
				const url = buildOlGetFeatureInfoUrl({map: currentMap, coordinate, srs: crsCode, layers: [layer]});
				const xml = await fetchOlFeatureInfo(url, controllers[i].signal);
				return parseFeatureInfoXml(xml) ? {layer, xml} : null;
			})());

			const first = await Promise.any(tasks.map(p => p.then(v => {
				if (!v) throw new Error();
				return v;
			})));
			controllers.forEach(c => c.abort());
			if (first) {
				const lonLat = crsCode === 'EPSG:3857' ? toLonLat(coordinate) : coordinate;
				setFound({
					typename: parseFeatureInfoXml(first.xml)!.typename,
					fid: parseFeatureInfoXml(first.xml)!.fid,
					coordinate: lonLat as [number, number],
					props: parseFeatureInfoXml(first.xml)!.props
				});
				toast.success(t('featureFound'));
			} else {
				setFound(null);
				toast.info(t('noFeatureFound'));
			}
		} catch {
			setFound(null);
			toast.info(t('noFeatureFound'));
		} finally {
			setIsLoading(false);
		}
	}, [currentMap, isLoading, wmsLayers, crsCode, t]);

	const view = useMemo(() => {
		// При смене проекции сбрасываем zoom для предотвращения искажений
		const adjustedZoom = crsCode === 'EPSG:4326' ? Math.min(zoom, 10) : zoom;

		return new View({
			center: centerProjected,
			zoom: adjustedZoom,
			projection: crsCode,
			extent: crsCode === 'EPSG:4326' ? [-180, -90, 180, 90] : undefined,
			maxZoom: crsCode === 'EPSG:4326' ? 12 : 22
		});
	}, [centerProjected, zoom, crsCode]);

	const mapOptions = useMemo(() => ({
		view: view,
		controls: defaultControls({
			zoom: false,
			rotate: false,
			attribution: false
		}),
		interactions: defaultInteractions({
			pinchRotate: true,
			mouseWheelZoom: true
		})
	}), [view]);

	return (
		<div style={{height: '100%', width: '100%', position: 'relative'}}>
			<OLMap
				{...mapOptions}
				style={{height: '100%', width: '100%'}}
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

			<LoadingIndicator isLoading={isLoading}/>

			{found && (
				<FeaturePopup
					feature={found}
					onClose={() => setFound(null)}
				/>
			)}
		</div>
	);
}
