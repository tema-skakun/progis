// src/components/MapView.tsx
import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, useMapEvents, Marker, Popup, GeoJSON } from 'react-leaflet';
import L, { CRS } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { WMS_URL, OGC_PREFIX, buildGetFeatureInfoUrl, fetchWfsFeatureById, fetchWfsFirstInBBox } from '../services/ogc';
import { parseFeatureInfoXml } from '../utils/xml';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { CRSCode } from '../App';
import ZwsLayerSelect from './ZwsLayerSelect';
import WmsLayersControl from './WmsLayersControl';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({
	iconUrl, iconRetinaUrl, shadowUrl,
	iconSize: [25, 41], iconAnchor: [12, 41],
	popupAnchor: [1, -34], shadowSize: [41, 41],
});

export type FoundFeature = {
	typename: string;
	fid?: string;
	latlng: L.LatLng;
	props: Record<string, string>;
	geojson?: any;
};

const ZWS_DEFAULT_LAYER = 'example:demo';
const WMS_DEFAULT_LAYERS = ['openlayers:teploset', 'mo:thermo', 'mo:vp'];

export default function MapView({
																	center, zoom, crsCode,
																}: { center: [number, number]; zoom: number; crsCode: CRSCode; }) {
	const { t } = useTranslation();
	const [zwsLayer, setZwsLayer] = useState<string>(ZWS_DEFAULT_LAYER);
	const [wmsLayers, setWmsLayers] = useState<string[]>(WMS_DEFAULT_LAYERS);
	const [found, setFound] = useState<FoundFeature | null>(null);

	const crs: CRS = useMemo(() => (crsCode === 'EPSG:4326' ? L.CRS.EPSG4326 : L.CRS.EPSG3857), [crsCode]);

	function ClickHandler() {
		const map = useMapEvents({
			click: async (e) => {
				try {
					const url = buildGetFeatureInfoUrl({ map, latlng: e.latlng, srs: crsCode, layers: wmsLayers });
					const res = await fetch(url);
					const ct = res.headers.get('content-type') || '';
					if (!res.ok) throw new Error(`WMS GetFeatureInfo HTTP ${res.status}`);

					let typename: string | undefined;
					let fid: string | undefined;
					let props: Record<string, string> = {};

					if (ct.includes('application/json')) {
						const data = await res.json();
						const feature = Array.isArray(data.features) ? data.features[0] : undefined;
						if (feature) {
							typename = feature.id?.split('.')[0];
							fid = feature.id;
							props = feature.properties ?? {};
						}
					} else {
						const text = await res.text();
						const parsed = parseFeatureInfoXml(text);
						if (parsed) { typename = parsed.typename; fid = parsed.fid; props = parsed.props; }
					}

					if (!typename) {
						const wfs = await fetchWfsFirstInBBox({ map, latlng: e.latlng, srs: crsCode, typeNames: wmsLayers });
						if (!wfs) { toast.info(t('nothingFound')); setFound(null); return; }
						setFound({ typename: wfs.typename, latlng: e.latlng, props: wfs.props, geojson: wfs.geojson, fid: wfs.fid });
						map.openPopup(); return;
					}

					const wfsById = await fetchWfsFeatureById({ typename, fid, srs: crsCode });
					setFound({ typename, fid, latlng: e.latlng, props, geojson: wfsById?.geojson });
				} catch (err: any) {
					console.error(err);
					toast.error(`${t('error')}: ${err.message || err}`);
				}
			},
		});
		return null;
	}

	const zwsTileUrl = useMemo(() => {
		if (crsCode !== 'EPSG:3857') return undefined;
		const layerParam = encodeURIComponent(zwsLayer);
		return `${OGC_PREFIX}/zws/GetLayerTile?Layer=${layerParam}&x={x}&y={y}&z={z}`;
	}, [zwsLayer, crsCode]);

	// База для 3857: всегда OSM (zIndex 1) + ZWS как оверлей (zIndex 2)
	const base3857 = (
		<>
			<TileLayer
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				attribution="&copy; OSM"
				zIndex={1}
			/>
			{zwsTileUrl && (
				<TileLayer
					url={zwsTileUrl}
					tileSize={256}
					zIndex={2}
					eventHandlers={{
						tileerror: (e) => console.warn('ZWS tile error', e?.tile?.src),
					}}
				/>
			)}
		</>
	);

	// База для 4326: любой «плотный» WMS слой без прозрачности (zIndex 1)
	const base4326 = (
		<WMSTileLayer
			url={WMS_URL}
			params={{
				service: 'WMS',
				version: '1.1.1',
				request: 'GetMap',
				layers: 'mo:region',
				styles: '',
				format: 'image/jpeg',
				transparent: false,
				srs: 'EPSG:4326',
			}}
			zIndex={1}
		/>
	);

	return (
		<MapContainer center={center} zoom={zoom} crs={crs} style={{ height: '100%', width: '100%' }}>
			{crsCode === 'EPSG:4326' ? base4326 : base3857}

			{wmsLayers.map((layer) => (
				<WMSTileLayer
					key={layer}
					url={WMS_URL}
					params={{
						service: 'WMS',
						version: '1.1.1',
						request: 'GetMap',
						layers: layer,
						styles: '',
						format: 'image/png',
						transparent: true,
						srs: crsCode,
					}}
					zIndex={3}
				/>
			))}

			<ClickHandler />

			{found?.geojson ? (
				<GeoJSON key={found.fid || Math.random()} data={found.geojson as any} style={{ color: '#ff3b3b', weight: 4 }} />
			) : found ? (
				<Marker position={found.latlng}>
					<Popup>
						<h4 style={{ margin: 0 }}>{found.typename}</h4>
						<table>
							<tbody>
							{Object.entries(found.props).slice(0, 20).map(([k, v]) => (
								<tr key={k}>
									<td style={{ paddingRight: 8 }}><strong>{k}</strong></td>
									<td>{String(v)}</td>
								</tr>
							))}
							</tbody>
						</table>
					</Popup>
				</Marker>
			) : null}

			<div style={{
				position: 'absolute', top: 12, right: 12, background: '#fff',
				padding: 8, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
				display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1000
			}}>
				<ZwsLayerSelect value={zwsLayer} onChange={setZwsLayer} disabled={crsCode !== 'EPSG:3857'} />
				<WmsLayersControl value={wmsLayers} onChange={setWmsLayers} />
			</div>
		</MapContainer>
	);
}
