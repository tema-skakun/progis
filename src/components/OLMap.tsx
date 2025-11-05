// src/components/OLMap.tsx
import React, { ReactNode, useRef, useEffect, useState } from 'react';
import { useMap } from '../hooks/useMap';
import { MapOptions } from 'ol/Map';

interface OLMapProps extends MapOptions {
	children?: ReactNode;
	className?: string;
	style?: React.CSSProperties;
}

export default function OLMap({ children, className, style, ...mapOptions }: OLMapProps) {
	const mapRef = useRef<HTMLDivElement>(null);
	const { map, setMapContainer } = useMap(mapOptions);
	const [childMap, setChildMap] = useState<any>(null);

	useEffect(() => {
		if (mapRef.current) {
			setMapContainer(mapRef.current);
		}
	}, [setMapContainer]);

	// Обновляем childMap когда map готов
	useEffect(() => {
		if (map) {
			setChildMap(map);
		}
	}, [map]);

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
