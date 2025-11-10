import { useEffect } from 'react';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { VectorSource } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import type {FoundFeature} from "../types";

interface FeatureManagerProps {
	vectorSource: VectorSource;
	foundFeature: FoundFeature | null;
	crsCode: string;
}

export default function FeatureManager({
																				 vectorSource, foundFeature, crsCode
																			 }: FeatureManagerProps) {
	useEffect(() => {
		vectorSource.clear();

		if (foundFeature) {
			const projectedCoordinate = crsCode === 'EPSG:3857'
				? fromLonLat(foundFeature.coordinate)
				: foundFeature.coordinate;

			const feature = new Feature({
				geometry: new Point(projectedCoordinate)
			});
			vectorSource.addFeature(feature);
		}
	}, [foundFeature, vectorSource, crsCode]);

	return null;
}
