import L from 'leaflet';
import {parseWfsGmlPointFeature} from '../utils/xml';

export const OGC_PREFIX = '/ogc';
export const WMS_URL = `${OGC_PREFIX}/ws`;
export const WFS_URL = `${OGC_PREFIX}/ws`;
export const ZWS_URL = `${OGC_PREFIX}/zws`;

// в браузере не шлём Authorization — добавляет прокси
export function getAuthHeader() {
	return {};
}

export function buildGetFeatureInfoUrl({map, latlng, srs, layers}: {
	map: L.Map; latlng: L.LatLng; srs: 'EPSG:3857' | 'EPSG:4326'; layers: string[];
}) {
	const size = map.getSize();
	const b = map.getBounds();
	const sw = b.getSouthWest();
	const ne = b.getNorthEast();
	const params: Record<string, string> = {
		service: 'WMS', version: '1.1.1', request: 'GetFeatureInfo',
		layers: layers.join(','), query_layers: layers.join(','), styles: '',
		srs, bbox: `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`,
		width: String(size.x), height: String(size.y),
		x: String(Math.round(map.latLngToContainerPoint(latlng).x)),
		y: String(Math.round(map.latLngToContainerPoint(latlng).y)),
		info_format: 'application/vnd.ogc.gml', feature_count: '1'
	};
	return `${WMS_URL}?${new URLSearchParams(params).toString()}`;
}

export async function fetchZwsLayerList() {
	// 1) REST-вариант
	try {
		const res = await fetch(`${ZWS_URL}/GetLayerList`, { method: 'GET', headers: { Accept: 'text/xml' } });
		const txt = await res.text();
		if (res.ok && /<GetLayerList>/i.test(txt)) {
			const doc = new DOMParser().parseFromString(txt, 'text/xml');
			const layers = Array.from(doc.getElementsByTagName('Layer')).map(n => ({
				name: n.getElementsByTagName('Name')[0]?.textContent || '',
				title: n.getElementsByTagName('Title')[0]?.textContent || ''
			})).filter(l => l.name);
			if (layers.length) return layers;
		}
	} catch (error) {
		console.debug('Fetch error:', error);
	}
	// 2) POST с XML-командой
	try {
		const body = `<?xml version="1.0" encoding="UTF-8"?><zwsRequest><GetLayerList/></zwsRequest>`;
		const res = await fetch(ZWS_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'text/xml', 'SOAPAction': 'GetLayerList' },
			body
		});
		const txt = await res.text();
		if (res.ok && /<GetLayerList>/i.test(txt)) {
			const doc = new DOMParser().parseFromString(txt, 'text/xml');
			const layers = Array.from(doc.getElementsByTagName('Layer')).map(n => ({
				name: n.getElementsByTagName('Name')[0]?.textContent || '',
				title: n.getElementsByTagName('Title')[0]?.textContent || ''
			})).filter(l => l.name);
			if (layers.length) return layers;
		}
	} catch (error) {
		console.debug('Fetch error:', error);
	}
	// 3) GET c query-параметром
	try {
		const res = await fetch(`${ZWS_URL}?Action=GetLayerList`);
		const txt = await res.text();
		if (res.ok && /<GetLayerList>/i.test(txt)) {
			const doc = new DOMParser().parseFromString(txt, 'text/xml');
			const layers = Array.from(doc.getElementsByTagName('Layer')).map(n => ({
				name: n.getElementsByTagName('Name')[0]?.textContent || '',
				title: n.getElementsByTagName('Title')[0]?.textContent || ''
			})).filter(l => l.name);
			if (layers.length) return layers;
		}
	} catch (error) {
		console.debug('Fetch error:', error);
	}
	// fallback
	return [{ name: 'example:demo', title: 'example:demo' }];
}

export async function fetchWfsFeatureById({typename, fid, srs}: {
	typename: string; fid?: string; srs: 'EPSG:3857' | 'EPSG:4326';
}) {
	try {
		const q = new URLSearchParams({service: 'WFS', version: '1.1.0', request: 'GetFeature', typeName: typename});
		if (fid) q.set('featureId', fid);
		const res = await fetch(`${WFS_URL}?${q.toString()}`);
		const xml = await res.text();
		return parseWfsGmlPointFeature(xml, srs);
	} catch {
		return undefined;
	}
}

export async function fetchWfsFirstInBBox({latlng, srs, typeNames}: {
	map: L.Map; latlng: L.LatLng; srs: 'EPSG:3857' | 'EPSG:4326'; typeNames: string[];
}) {
	function bboxAround(ll: L.LatLng): [number, number, number, number] {
		if (srs === 'EPSG:3857') {
			const p = L.CRS.EPSG3857.project(ll), d = 5;
			const sw = L.CRS.EPSG3857.unproject(L.point(p.x - d, p.y - d));
			const ne = L.CRS.EPSG3857.unproject(L.point(p.x + d, p.y + d));
			return [sw.lng, sw.lat, ne.lng, ne.lat];
		}
		const d = 0.00005;
		return [ll.lng - d, ll.lat - d, ll.lng + d, ll.lat + d];
	}

	const [minx, miny, maxx, maxy] = bboxAround(latlng);
	for (const typename of typeNames) {
		try {
			const q = new URLSearchParams({
				service: 'WFS', version: '1.1.0', request: 'GetFeature', typeName: typename,
				bbox: `${minx},${miny},${maxx},${maxy},${srs}`, maxFeatures: '1'
			});
			const res = await fetch(`${WFS_URL}?${q.toString()}`);
			const xml = await res.text();
			const parsed = parseWfsGmlPointFeature(xml, srs);
			if (parsed) return parsed;
		} catch (error) {
			console.debug('Fetch error:', error);
		}
	}
	return undefined;
}
