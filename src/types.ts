export type FoundFeature = {
	typename: string;
	fid?: string;
	coordinate: [number, number];
	props: Record<string, string>;
	geojson?: unknown;
};

export type CRSCode = 'EPSG:3857' | 'EPSG:4326';
