import {Map} from 'ol';
import {Coordinate} from 'ol/coordinate';
import {OGC_PREFIX} from './ogc';
import {toQuery} from "./wms11";

export function buildOlGetFeatureInfoUrl({
																					 map,
																					 coordinate,
																					 srs,
																					 layers
																				 }: {
	map: Map;
	coordinate: Coordinate;
	srs: 'EPSG:3857' | 'EPSG:4326';
	layers: string[];
}): string {
	const view = map.getView();
	const size = map.getSize()!;

	// Преобразуем координаты в пиксели
	const pixel = map.getPixelFromCoordinate(coordinate);

	// Получаем extent карты
	const extent = view.calculateExtent(size);

	const params = {
		SERVICE: 'WMS',
		VERSION: '1.1.1',
		REQUEST: 'GetFeatureInfo',
		LAYERS: layers.join(','),
		QUERY_LAYERS: layers.join(','),
		STYLES: '',
		SRS: srs,
		BBOX: extent.join(','),
		WIDTH: String(size[0]),
		HEIGHT: String(size[1]),
		X: String(Math.round(pixel[0])),
		Y: String(Math.round(pixel[1])),
		INFO_FORMAT: 'application/vnd.ogc.gml',
		FEATURE_COUNT: '10',
		TRANSPARENT: 'true',
		FORMAT: 'image/png',
	} as const;

	return `${OGC_PREFIX}/ws?${toQuery(params)}`;
}

export async function fetchOlFeatureInfo(url: string, signal?: AbortSignal): Promise<string> {
	const response = await fetch(url, { signal });

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const text = await response.text();
	// console.log('Response status:', response.status);
	// console.log('Response text (first 500 chars):', text.substring(0, 500));

	// Проверяем, является ли ответ ошибкой WMS
	if (text.includes('ServiceExceptionReport') || text.includes('ServiceException')) {
		// Декодируем base64 если нужно
		let errorText = text;
		if (text.startsWith('PD94bWw')) { // Это base64?
			try {
				errorText = atob(text);
				// console.log('Decoded base64 error:', errorText);
			} catch (e) {
				// console.log('Could not decode base64, using original text');
			}
		}

		// Парсим XML ошибки
		try {
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(errorText, 'text/xml');
			const exception = xmlDoc.getElementsByTagName('ServiceException')[0];
			const errorMessage = exception?.textContent?.trim() || 'Unknown WMS error';
			throw new Error(`WMS Error: ${errorMessage}`);
		} catch (parseError) {
			throw new Error(`WMS Error: ${errorText.substring(0, 200)}`);
		}
	}

	return text;
}