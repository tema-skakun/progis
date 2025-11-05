import { useMemo, useState, useEffect } from 'react';
import { View } from 'ol';
import { fromLonLat, toLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import { OSM, TileWMS, ImageWMS } from 'ol/source';
import { Vector as VectorSource } from 'ol/source';
import { Point } from 'ol/geom';
import { Style, Circle, Fill, Stroke } from 'ol/style';
import { Feature } from 'ol';
import OLMap from './OLMap';
import { WMS_URL, OGC_PREFIX } from '../services/ogc';
import { buildOlGetFeatureInfoUrl, fetchOlFeatureInfo } from '../services/olOgc';
import { parseFeatureInfoXml } from '../utils/xml';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { CRSCode } from '../App';
import ZwsLayerSelect from './ZwsLayerSelect';
import WmsLayersControl from './WmsLayersControl';

export type FoundFeature = {
	typename: string;
	fid?: string;
	coordinate: [number, number];
	props: Record<string, string>;
	geojson?: unknown;
};

const ZWS_DEFAULT_LAYER = 'example:demo';
// const WMS_DEFAULT_LAYERS = ['openlayers:teploset', 'mo:thermo', 'mo:vp'];
const WMS_DEFAULT_LAYERS = ['openlayers:teploset'];

// Компонент для обработки кликов
function MapClickHandler({ map, onMapClick }: { map: any; onMapClick: (coordinate: [number, number]) => void }) {
	useEffect(() => {
		if (!map) return;

		const clickHandler = (event: any) => {
			console.log('Map clicked:', event.coordinate);
			const coordinate = event.coordinate;
			onMapClick(coordinate);
		};

		map.on('click', clickHandler);
		return () => {
			map.un('click', clickHandler);
		};
	}, [map, onMapClick]);

	return null;
}

// Компонент попапа
function FeaturePopup({
												feature,
												onClose
											}: {
	feature: FoundFeature;
	onClose: () => void;
}) {
	const { t } = useTranslation();

	return (
		<div style={{
			position: 'absolute',
			top: 12,
			right: 12,
			width: 400,
			maxHeight: 'calc(100vh - 100px)',
			background: '#fff',
			borderRadius: 8,
			boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
			zIndex: 1000,
			display: 'flex',
			flexDirection: 'column'
		}}>
			{/* Заголовок */}
			<div style={{
				padding: '12px 16px',
				borderBottom: '1px solid #e5e7eb',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				background: '#f8f9fa'
			}}>
				<h4 style={{ margin: 0, fontSize: '16px' }}>
					{feature.typename}
				</h4>
				<button
					onClick={onClose}
					style={{
						background: 'none',
						border: 'none',
						fontSize: '18px',
						cursor: 'pointer',
						color: '#6b7280',
						padding: 4,
						borderRadius: 4
					}}
				>
					×
				</button>
			</div>

			{/* Содержимое с прокруткой */}
			<div style={{
				padding: 16,
				overflowY: 'auto',
				flex: 1
			}}>
				{Object.keys(feature.props).length === 0 ? (
					<p style={{ color: '#6b7280', textAlign: 'center' }}>
						{t('noProperties')}
					</p>
				) : (
					<table style={{
						width: '100%',
						borderCollapse: 'collapse',
						fontSize: '14px'
					}}>
						<tbody>
						{Object.entries(feature.props).map(([key, value]) => (
							<tr key={key} style={{ borderBottom: '1px solid #f3f4f6' }}>
								<td style={{
									padding: '8px 12px 8px 0',
									fontWeight: 600,
									color: '#374151',
									verticalAlign: 'top',
									whiteSpace: 'nowrap'
								}}>
									{key}
								</td>
								<td style={{
									padding: '8px 0',
									color: '#6b7280',
									wordBreak: 'break-word'
								}}>
									{String(value)}
								</td>
							</tr>
						))}
						</tbody>
					</table>
				)}
			</div>

			{/* Футер */}
			<div style={{
				padding: '12px 16px',
				borderTop: '1px solid #e5e7eb',
				background: '#f8f9fa',
				fontSize: '12px',
				color: '#6b7280'
			}}>
				{feature.fid && `ID: ${feature.fid}`}
				{!feature.fid && t('featureInfo')}
			</div>
		</div>
	);
}

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

	// Стиль для найденных features
	const foundFeatureStyle = useMemo(() => new Style({
		image: new Circle({
			radius: 6,
			fill: new Fill({ color: '#ff3b3b' }),
			stroke: new Stroke({ color: '#fff', width: 2 })
		})
	}), []);

	// Векторный источник для найденных объектов
	const vectorSource = useMemo(() => new VectorSource(), []);
	const vectorLayer = useMemo(() => new VectorLayer({
		source: vectorSource,
		style: foundFeatureStyle
	}), [vectorSource, foundFeatureStyle]);

	const handleMapReady = (map: any) => {
		console.log('Map ready:', map);
		setCurrentMap(map);
	};

	const handleMapClick = async (coordinate: [number, number]) => {
		console.log('Handle map click called:', coordinate);
		if (!currentMap || isLoading || wmsLayers.length === 0) {
			console.log('Cannot process click:', { currentMap, isLoading, wmsLayers });
			return;
		}

		setIsLoading(true);

		// Пробуем каждый слой по отдельности, так как некоторые могут не существовать
		for (const layer of wmsLayers) {
			try {
				console.log(`Trying layer: ${layer}`);

				// Строим URL для GetFeatureInfo для одного слоя
				const url = buildOlGetFeatureInfoUrl({
					map: currentMap,
					coordinate: coordinate,
					srs: crsCode,
					layers: [layer] // Пробуем только один слой
				});

				console.log('Fetching feature info from:', url);

				// Получаем данные
				const xmlResponse = await fetchOlFeatureInfo(url);
				console.log('XML response received for layer:', layer);

				// Парсим XML
				const featureInfo = parseFeatureInfoXml(xmlResponse);
				console.log('Parsed feature info:', featureInfo);

				if (featureInfo) {
					// Преобразуем координаты обратно в градусы для унификации
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
					return; // Успешно нашли объект, выходим
				}
			} catch (err: unknown) {
				console.warn(`Error with layer ${layer}:`, err);
				// Продолжаем пробовать следующий слой
			}
		}

		// Если дошли сюда, значит ни один слой не вернул данные
		setFound(null);
		toast.info(t('noFeatureFound'));
		setIsLoading(false);
	};

	// Обновление векторного источника при изменении found
	useEffect(() => {
		vectorSource.clear();

		if (found) {
			// Преобразуем координаты обратно в проекцию карты
			const projectedCoordinate = crsCode === 'EPSG:3857'
				? fromLonLat(found.coordinate)
				: found.coordinate;

			const feature = new Feature({
				geometry: new Point(projectedCoordinate)
			});
			vectorSource.addFeature(feature);
		}
	}, [found, vectorSource, crsCode]);

	// Создаём слои
	const layers = useMemo(() => {
		const baseLayers = [];

		// Базовые слои для EPSG:3857
		if (crsCode === 'EPSG:3857') {
			baseLayers.push(
				new TileLayer({
					source: new OSM(),
					zIndex: 1
				})
			);

			if (zwsLayer) {
				baseLayers.push(
					new TileLayer({
						source: new TileWMS({
							url: `${OGC_PREFIX}/zws/GetLayerTile`,
							params: { 'Layer': zwsLayer },
						}),
						zIndex: 2
					})
				);
			}
		} else {
			// Базовый слой для EPSG:4326
			baseLayers.push(
				new ImageLayer({
					source: new ImageWMS({
						url: WMS_URL,
						params: {
							'LAYERS': 'mo:region',
							'FORMAT': 'image/jpeg',
							'SRS': 'EPSG:4326'
						},
						ratio: 1
					}),
					zIndex: 1
				})
			);
		}

		// WMS слои
		const wmsLayersArray = wmsLayers.map(layer =>
			new ImageLayer({
				source: new ImageWMS({
					url: WMS_URL,
					params: {
						'LAYERS': layer,
						'FORMAT': 'image/png',
						'TRANSPARENT': 'true',
						'SRS': crsCode
					},
					ratio: 1
				}),
				zIndex: 3
			})
		);

		return [...baseLayers, ...wmsLayersArray, vectorLayer];
	}, [crsCode, zwsLayer, wmsLayers, vectorLayer]);

	const view = useMemo(() => new View({
		center: centerProjected,
		zoom: zoom,
		projection: crsCode
	}), [centerProjected, zoom, crsCode]);

	const mapOptions = useMemo(() => ({
		view: view,
		layers: layers,
		controls: defaultControls({
			zoom: true,
			rotate: true,
			attribution: false
		}),
		interactions: defaultInteractions({
			pinchRotate: true,
			mouseWheelZoom: true
		})
	}), [view, layers]);

	return (
		<div style={{ height: '100%', width: '100%', position: 'relative' }}>
			<OLMap
				{...mapOptions}
				style={{ height: '100%', width: '100%' }}
				onMapReady={handleMapReady}
			>
				{currentMap && (
					<MapClickHandler map={currentMap} onMapClick={handleMapClick} />
				)}
			</OLMap>

			{/* Индикатор загрузки */}
			{isLoading && (
				<div style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					background: 'rgba(255,255,255,0.9)',
					padding: '16px 24px',
					borderRadius: 8,
					boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
					zIndex: 1001
				}}>
					{t('loading')}...
				</div>
			)}

			{/* Контролы слоёв */}
			<div style={{
				position: 'absolute', top: 12, left: 12, background: '#fff',
				padding: 8, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
				display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1000
			}}>
				<ZwsLayerSelect value={zwsLayer} onChange={setZwsLayer} disabled={crsCode !== 'EPSG:3857'} />
				<WmsLayersControl value={wmsLayers} onChange={setWmsLayers} />
			</div>

			{/* Попап с информацией об объекте */}
			{found && (
				<FeaturePopup
					feature={found}
					onClose={() => setFound(null)}
				/>
			)}
		</div>
	);
}
