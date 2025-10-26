import 'leaflet';

declare module 'leaflet' {
	interface WMSParams {
		srs?: string;
		crs?: string;
		bbox?: string;
		width?: number;
		height?: number;
		format?: string;
		transparent?: boolean;
		version?: string;
		service?: string;
		request?: string;
		layers: string;
		styles?: string;
	}
}
