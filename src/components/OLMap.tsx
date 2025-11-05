import React, { ReactNode, useRef, useEffect, useState } from 'react';
import { useMap } from '../hooks/useMap';
import { MapOptions } from 'ol/Map';

interface OLMapProps extends MapOptions {
	children?: ReactNode;
	className?: string;
	style?: React.CSSProperties;
	onMapReady?: (map: any) => void;
}

export default function OLMap({ children, className, style, onMapReady, ...mapOptions }: OLMapProps) {
	const mapRef = useRef<HTMLDivElement>(null);
	const { map, setMapContainer } = useMap(mapOptions);
	const [childMap, setChildMap] = useState<any>(null);

	useEffect(() => {
		if (mapRef.current) {
			setMapContainer(mapRef.current);
		}
	}, [setMapContainer]);

	// Обновляем childMap когда map готов и вызываем callback
	useEffect(() => {
		if (map) {
			setChildMap(map);
			if (onMapReady) {
				onMapReady(map);
			}
		}
	}, [map, onMapReady]);

	// Передаём map в дочерние компоненты
	const childrenWithProps = childMap ?
		React.Children.map(children, child =>
			React.isValidElement(child) ?
				React.cloneElement(child as React.ReactElement<any>, { map: childMap }) :
				child
		) : null;

	return (
		<div ref={mapRef} className={className} style={style}>
			{childrenWithProps}
		</div>
	);
}
