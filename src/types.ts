export type FoundFeature = {
	typename: string;
	fid?: string;
	coordinate: [number, number];
	props: Record<string, string>;
	geojson?: unknown;
};

export type CRSCode = 'EPSG:3857' | 'EPSG:4326';

export type Wms11Params = {
	SERVICE: 'WMS';
	VERSION: '1.1.1';
	REQUEST: 'GetFeatureInfo' | 'GetMap';
	LAYERS: string;
	QUERY_LAYERS?: string;
	STYLES?: string;
	SRS: 'EPSG:3857' | 'EPSG:4326';
	BBOX: string;            // "minx,miny,maxx,maxy"
	WIDTH: string;           // px
	HEIGHT: string;          // px
	X?: string;              // pixel, WMS 1.1.1
	Y?: string;              // pixel, WMS 1.1.1
	INFO_FORMAT?: string;    // e.g. "application/vnd.ogc.gml"
	FEATURE_COUNT?: string;  // e.g. "10"
	FORMAT?: string;         // e.g. "image/png"
	TRANSPARENT?: 'true' | 'false';
};
