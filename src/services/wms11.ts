import type {Wms11Params} from "../types";

export function toQuery(params: Partial<Wms11Params>): string {
	const q = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		if (v == null) continue;
		q.append(k.toUpperCase(), String(v));
	}
	return q.toString();
}
