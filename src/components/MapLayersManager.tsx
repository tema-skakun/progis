import {useEffect, useMemo} from 'react';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import {OSM, TileWMS, ImageWMS} from 'ol/source';
import {Vector as VectorSource} from 'ol/source';

interface MapLayersManagerProps {
	map: any;
	crsCode: string;
	zwsLayer: string;
	wmsLayers: string[];
	vectorSource: VectorSource;
}

export default function MapLayersManager({
																					 map, crsCode, zwsLayer, wmsLayers, vectorSource
																				 }: MapLayersManagerProps) {
	const layers = useMemo(() => {
		const baseLayers = [];

		// Базовые слои для обеих СК
		if (crsCode === 'EPSG:3857') {
			baseLayers.push(new TileLayer({source: new OSM(), zIndex: 1}));
		} else {
			baseLayers.push(
				new ImageLayer({
					source: new ImageWMS({
						url: '/ogc/ws',
						params: {'LAYERS': 'mo:region', 'FORMAT': 'image/jpeg', 'SRS': 'EPSG:4326'},
						ratio: 1
					}),
					zIndex: 1
				})
			);
		}

		// ZWS слой доступен для всех СК
		if (zwsLayer) {
			baseLayers.push(
				new TileLayer({
					source: new TileWMS({
						url: `/ogc/zws/GetLayerTile`,
						params: {'Layer': zwsLayer, 'SRS': crsCode},
					}),
					zIndex: 2
				})
			);
		}

		const wmsLayersArray = wmsLayers.map(layer =>
			new ImageLayer({
				source: new ImageWMS({
					url: '/ogc/ws',
					params: {'LAYERS': layer, 'FORMAT': 'image/png', 'TRANSPARENT': 'true', 'SRS': crsCode},
					ratio: 1
				}),
				zIndex: 3
			})
		);

		const vectorLayer = new VectorLayer({
			source: vectorSource,
			zIndex: 4
		});

		return [...baseLayers, ...wmsLayersArray, vectorLayer];
	}, [crsCode, zwsLayer, wmsLayers, vectorSource]);

	useEffect(() => {
		if (!map) return;

		map.setLayers(layers);
	}, [map, layers]);

	return null;
}
