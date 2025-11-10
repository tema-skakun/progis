import {useEffect, useMemo} from 'react';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import {OSM, TileWMS, ImageWMS} from 'ol/source';
import {Vector as VectorSource} from 'ol/source';
import type { Map } from 'ol'

interface MapLayersManagerProps {
	map: Map;
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

		if (crsCode === 'EPSG:3857') {
			// Для Web Mercator - используем OSM + ZWS тайлы
			baseLayers.push(new TileLayer({source: new OSM(), zIndex: 1}));

			if (zwsLayer) {
				baseLayers.push(
					new TileLayer({
						source: new TileWMS({
							url: `/ogc/zws/GetLayerTile`,
							params: {'Layer': zwsLayer, 'SRS': 'EPSG:3857'},
						}),
						zIndex: 2
					})
				);
			}
		} else {
			// Для EPSG:4326 используем ТОЛЬКО WMS слои - ZWS НЕ ПОДДЕРЖИВАЕТ 4326!
			const baseParams = {
				'FORMAT': 'image/png',
				'TRANSPARENT': 'true',
				'SRS': 'EPSG:4326'
			};

			// Базовый слой региона
			baseLayers.push(
				new ImageLayer({
					source: new ImageWMS({
						url: '/ogc/ws',
						params: {
							...baseParams,
							'LAYERS': 'mo:region'
						},
						ratio: 1
					}),
					zIndex: 1
				})
			);

			// В EPSG:4326 НЕ используем ZWS слои - они не поддерживают эту проекцию
			// ZWS слой просто игнорируем для EPSG:4326
			console.warn('ZWS layers are not supported in EPSG:4326. Using only WMS layers.');
		}

		// WMS слои коммуникаций
		const wmsLayersArray = wmsLayers.map(layer => {
			if (crsCode === 'EPSG:3857') {
				return new TileLayer({
					source: new TileWMS({
						url: '/ogc/ws',
						params: {'LAYERS': layer, 'FORMAT': 'image/png', 'TRANSPARENT': 'true', 'SRS': 'EPSG:3857'},
					}),
					zIndex: 3
				});
			} else {
				return new ImageLayer({
					source: new ImageWMS({
						url: '/ogc/ws',
						params: {'LAYERS': layer, 'FORMAT': 'image/png', 'TRANSPARENT': 'true', 'SRS': 'EPSG:4326'},
						ratio: 1
					}),
					zIndex: 3
				});
			}
		});

		const vectorLayer = new VectorLayer({
			source: vectorSource,
			zIndex: 4
		});

		return [...baseLayers, ...wmsLayersArray, vectorLayer];
	}, [crsCode, zwsLayer, wmsLayers, vectorSource]);

	useEffect(() => {
		if (!map) return;

		// ВАЖНО: Не очищаем все слои, а обновляем существующие
		// Это предотвращает проблемы с пересозданием карты
		const currentLayers = map.getLayers();

		// Удаляем только старые слои, которые мы управляем
		const layersToRemove = currentLayers.getArray().filter(layer =>
			layer.get('managed') === true
		);

		layersToRemove.forEach(layer => currentLayers.remove(layer));

		// Добавляем новые слои с пометкой managed
		layers.forEach(layer => {
			layer.set('managed', true);
			map.addLayer(layer);
		});

	}, [map, layers]);

	return null;
}
