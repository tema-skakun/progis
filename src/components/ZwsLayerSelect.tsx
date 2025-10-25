import {useEffect, useState} from 'react';
import {fetchZwsLayerList} from '../services/ogc';
import {useTranslation} from 'react-i18next';

export default function ZwsLayerSelect({value, onChange, disabled}: {
	value: string;
	onChange: (v: string) => void;
	disabled?: boolean;
}) {
	const {t} = useTranslation();
	const [layers, setLayers] = useState<{ name: string; title: string }[]>([]);

	useEffect(() => {
		void (async () => {
			const list = await fetchZwsLayerList();
			setLayers(list);
		})();
	}, []);

	return (
		<label style={{display: 'flex', flexDirection: 'column', gap: 4}}>
			<span>{t('zwsLayer')}</span>
			<select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
				{layers.length === 0 && <option value="example:demo">example:demo</option>}
				{layers.map((l) => (
					<option key={l.name} value={l.name}>{l.title || l.name}</option>
				))}
			</select>
		</label>
	);
}
