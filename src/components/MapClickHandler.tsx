import { useEffect } from 'react';
import type { Map } from 'ol'

interface MapClickHandlerProps {
	map: Map;
	onMapClick: (coordinate: [number, number]) => void;
	isLoading: boolean;
	wmsLayers: string[];
}

export default function MapClickHandler({
																					map, onMapClick, isLoading, wmsLayers
																				}: MapClickHandlerProps) {
	useEffect(() => {
		if (!map || isLoading || wmsLayers.length === 0) return;

		const clickHandler = (event: any) => {
			onMapClick(event.coordinate);
		};

		map.on('click', clickHandler);
		return () => {
			map.un('click', clickHandler);
		};
	}, [map, onMapClick, isLoading, wmsLayers]);

	return null;
}
