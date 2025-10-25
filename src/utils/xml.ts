export function parseFeatureInfoXml(xml: string): {
	typename: string;
	fid?: string;
	props: Record<string, string>;
} | null {
	try {
		const doc = new DOMParser().parseFromString(xml, 'text/xml');
// ищем первый gml:featureMember
		const members = doc.getElementsByTagNameNS('http://www.opengis.net/gml', 'featureMember');
		if (!members || members.length === 0) return null;
		const featureNode = members[0].firstElementChild as Element | null; // <ns:typename ...>
		if (!featureNode) return null;
		const typename = featureNode.tagName; // включая префикс, например openlayers:teploset
		const fid = featureNode.getAttribute('gml:id') || undefined;

		const props: Record<string, string> = {};
		for (const child of Array.from(featureNode.children)) {
			if (child.namespaceURI === 'http://www.opengis.net/gml') continue; // пропускаем геом
			const key = child.tagName.includes(':') ? child.tagName.split(':')[1] : child.tagName;
			const val = child.textContent?.trim() ?? '';
			if (val) props[key] = val;
		}
		return {typename, fid, props};
	} catch {
		return null;
	}
}

export function parseWfsGmlPointFeature(xml: string, srs: 'EPSG:3857' | 'EPSG:4326') {
	try {
		const doc = new DOMParser().parseFromString(xml, 'text/xml');
		const members = doc.getElementsByTagNameNS('http://www.opengis.net/gml', 'featureMember');
		if (!members || members.length === 0) return undefined;
		const featureNode = members[0].firstElementChild as Element | null; // <ns:typename>
		if (!featureNode) return undefined;

		const typename = featureNode.tagName; // ns:typename
		const fid = featureNode.getAttribute('gml:id') || undefined;

// геометрия: ищем gml:Point/gml:pos
		const pos = featureNode.getElementsByTagNameNS('http://www.opengis.net/gml', 'pos')[0]?.textContent;
		let lat = 0, lng = 0;
		if (pos) {
			const [x, y] = pos.trim().split(/[ ,]+/).map(Number);
// В GML обычно порядок lon lat
			lng = x;
			lat = y;
		}

		const props: Record<string, string> = {};
		for (const child of Array.from(featureNode.children)) {
			if (child.namespaceURI === 'http://www.opengis.net/gml') continue;
			const key = child.tagName.includes(':') ? child.tagName.split(':')[1] : child.tagName;
			const val = child.textContent?.trim() ?? '';
			if (val) props[key] = val;
		}

		const geojson = {
			type: 'Feature',
			geometry: {type: 'Point', coordinates: [lng, lat]},
			properties: props
		} as const;

		return {typename, fid, props, geojson};
	} catch {
		return undefined;
	}
}
