// src/hooks/useMap.ts
import { useEffect, useState, useRef } from 'react';
import { Map } from 'ol';
import { MapOptions } from 'ol/Map';

export function useMap(mapOptions: MapOptions) {
	const [map, setMap] = useState<Map | null>(null);
	const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);

	// Используем useRef для стабильной ссылки на mapOptions
	const optionsRef = useRef(mapOptions);
	optionsRef.current = mapOptions;

	useEffect(() => {
		if (!mapContainer) return;

		const mapInstance = new Map({
			...optionsRef.current,
			target: mapContainer,
		});

		setMap(mapInstance);

		return () => {
			mapInstance.setTarget(undefined);
		};
	}, [mapContainer]); // Убираем mapOptions из зависимостей

	return { map, setMapContainer };
}
