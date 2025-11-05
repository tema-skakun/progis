import { useMemo, useState, useEffect } from 'react';
import { View } from 'ol';
import { fromLonLat } from 'ol/proj';
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
const WMS_DEFAULT_LAYERS = ['openlayers:teploset', 'mo:thermo', 'mo:vp'];

// Компонент для обработки кликов
function MapClickHandler({ map, onMapClick }: { map: any; onMapClick: (coordinate: [number, number], pixel: [number, number]) => void }) {
	useEffect(() => {
		if (!map) return;

		const clickHandler = (event: any) => {
			const coordinate = event.coordinate;
			const pixel = map.getEventPixel(event.originalEvent);
			onMapClick(coordinate, pixel);
		};

		map.on('click', clickHandler);
		return () => {
			map.un('click', clickHandler);
		};
	}, [map, onMapClick]);

	return null;
}

export default function MapView({
																	center, zoom, crsCode,
																}: { center: [number, number]; zoom: number; crsCode: CRSCode; }) {
	const { t } = useTranslation();
	const [zwsLayer, setZwsLayer] = useState<string>(ZWS_DEFAULT_LAYER);
	const [wmsLayers, setWmsLayers] = useState<string[]>(WMS_DEFAULT_LAYERS);
	const [found, setFound] = useState<FoundFeature | null>(null);
	const [currentMap, setCurrentMap] = useState<any>(null);

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

	const handleMapClick = async (coordinate: [number, number], pixel: [number, number]) => {
		if (!currentMap) return;

		try {
			// ВРЕМЕННО: используем старую функцию из Leaflet, нужно будет обновить
			// Для теста просто покажем координаты
			console.log('Map click:', coordinate, pixel);
			toast.info(`Clicked at: ${coordinate[0].toFixed(6)}, ${coordinate[1].toFixed(6)}`);

			// TODO: Обновить buildGetFeatureInfoUrl для OpenLayers
			// const url = buildGetFeatureInfoUrl({
			//   map: currentMap,
			//   coordinate: pixel,
			//   srs: crsCode,
			//   layers: wmsLayers
			// });

		} catch (err: unknown) {
			console.error(err);
			const message = err instanceof Error ? err.message : String(err);
			toast.error(`${t('error')}: ${message}`);
		}
	};

	// Обновление векторного источника при изменении found
	useEffect(() => {
		vectorSource.clear();

		if (found) {
			const feature = new Feature({
				geometry: new Point(found.coordinate)
			});
			vectorSource.addFeature(feature);
		}
	}, [found, vectorSource]);

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
							tileSize: 256
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
			>
				<MapClickHandler map={currentMap} onMapClick={handleMapClick} />
			</OLMap>

			{/* Контролы слоёв */}
			<div style={{
				position: 'absolute', top: 12, right: 12, background: '#fff',
				padding: 8, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
				display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1000
			}}>
				<ZwsLayerSelect value={zwsLayer} onChange={setZwsLayer} disabled={crsCode !== 'EPSG:3857'} />
				<WmsLayersControl value={wmsLayers} onChange={setWmsLayers} />
			</div>

			{/* Popup для найденного объекта */}
			{found && (
				<div style={{
					position: 'absolute',
					bottom: 20,
					left: '50%',
					transform: 'translateX(-50%)',
					background: '#fff',
					padding: 16,
					borderRadius: 8,
					boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
					maxWidth: 400,
					zIndex: 1000
				}}>
					<h4 style={{ margin: 0, marginBottom: 8 }}>{found.typename}</h4>
					<table style={{ width: '100%' }}>
						<tbody>
						{Object.entries(found.props).slice(0, 10).map(([k, v]) => (
							<tr key={k}>
								<td style={{ paddingRight: 8, paddingBottom: 4 }}>
									<strong>{k}</strong>
								</td>
								<td style={{ paddingBottom: 4 }}>{String(v)}</td>
							</tr>
						))}
						</tbody>
					</table>
					<button
						onClick={() => setFound(null)}
						style={{
							marginTop: 8,
							padding: '4px 8px',
							background: '#ff3b3b',
							color: 'white',
							border: 'none',
							borderRadius: 4,
							cursor: 'pointer'
						}}
					>
						{t('close')}
					</button>
				</div>
			)}
		</div>
	);
}
