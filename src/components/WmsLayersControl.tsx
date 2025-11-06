import {useTranslation} from 'react-i18next';

// Тестируем разные комбинации слоев
const KNOWN_LAYERS = [
	{name: 'openlayers:teploset', title: 'Тепловая сеть'},
	{name: 'mo:thermo', title: 'Thermo'},
	{name: 'mo:vp', title: 'Водопроводная сеть'},
	{name: 'mo:region', title: 'Регион'},
	{name: 'example:demo', title: 'Демо слой'}
];

export default function WmsLayersControl({value, onChange}: { value: string[]; onChange: (v: string[]) => void; }) {
	const {t} = useTranslation();

	function toggle(name: string) {
		if (value.includes(name)) {
			onChange(value.filter((x) => x !== name));
		} else {
			onChange([...value, name]);
		}
		// console.log('Selected layers:', value.includes(name) ? value.filter((x) => x !== name) : [...value, name]);
	}

	return (
		<fieldset style={{border: '1px solid #e5e7eb', borderRadius: 8, padding: 8}}>
			<legend>{t('wmsLayers')}</legend>
			{KNOWN_LAYERS.map((l) => (
				<label key={l.name} style={{display: 'flex', gap: 6, alignItems: 'center'}}>
					<input
						type="checkbox"
						checked={value.includes(l.name)}
						onChange={() => toggle(l.name)}
					/>
					<span>{l.title} ({l.name})</span>
				</label>
			))}
		</fieldset>
	);
}
