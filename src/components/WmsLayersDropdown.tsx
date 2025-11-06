import {useState, useRef, useEffect} from 'react';
import {useTranslation} from 'react-i18next';

const KNOWN_LAYERS = [
	{name: 'openlayers:teploset', title: 'Тепловая сеть'},
	{name: 'mo:thermo', title: 'Thermo'},
	{name: 'mo:vp', title: 'Водопроводная сеть'},
	{name: 'mo:region', title: 'Регион'},
	{name: 'example:demo', title: 'Демо слой'}
];

interface WmsLayersDropdownProps {
	value: string[];
	onChange: (layers: string[]) => void;
}

export default function WmsLayersDropdown({value, onChange}: WmsLayersDropdownProps) {
	const {t} = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const handleToggle = (layerName: string, checked: boolean) => {
		if (checked) {
			onChange([...value, layerName]);
		} else {
			onChange(value.filter(layer => layer !== layerName));
		}
	};

	const handleSelectAll = () => {
		onChange(KNOWN_LAYERS.map(layer => layer.name));
	};

	const handleSelectNone = () => {
		onChange([]);
	};

	const selectedTitles = value.map(layerName =>
		KNOWN_LAYERS.find(l => l.name === layerName)?.title || layerName
	).join(', ');

	// Закрытие dropdown при клике вне его области
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div ref={dropdownRef} style={{position: 'relative', display: 'inline-block'}}>
			{/* Кнопка для открытия dropdown */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				style={{
					padding: '4px 8px',
					borderRadius: '4px',
					border: '1px solid #ccc',
					background: '#fff',
					minWidth: '200px',
					textAlign: 'left',
					cursor: 'pointer',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center'
				}}
				title={selectedTitles}
			>
        <span style={{
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap',
					flex: 1
				}}>
          {value.length === 0 ? t('selectLayers') : `${value.length} ${t('layersSelected')}`}
        </span>
				<span style={{marginLeft: '8px'}}>▼</span>
			</button>

			{/* Dropdown меню */}
			{isOpen && (
				<div style={{
					position: 'absolute',
					top: '100%',
					left: 0,
					right: 0,
					background: '#fff',
					border: '1px solid #ccc',
					borderRadius: '4px',
					boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
					zIndex: 1000,
					maxHeight: '300px',
					overflowY: 'auto'
				}}>
					{/* Заголовок с кнопками выбора */}
					<div style={{
						padding: '8px 12px',
						borderBottom: '1px solid #e5e7eb',
						display: 'flex',
						justifyContent: 'space-between',
						background: '#f8f9fa'
					}}>
						<span style={{fontSize: '14px', fontWeight: 'bold'}}>{t('wmsLayers')}</span>
						<div style={{display: 'flex', gap: '8px'}}>
							<button
								type="button"
								onClick={handleSelectAll}
								style={{
									fontSize: '12px',
									padding: '2px 6px',
									border: '1px solid #007bff',
									background: '#007bff',
									color: '#fff',
									borderRadius: '3px',
									cursor: 'pointer'
								}}
							>
								{t('selectAll')}
							</button>
							<button
								type="button"
								onClick={handleSelectNone}
								style={{
									fontSize: '12px',
									padding: '2px 6px',
									border: '1px solid #dc3545',
									background: '#dc3545',
									color: '#fff',
									borderRadius: '3px',
									cursor: 'pointer'
								}}
							>
								{t('selectNone')}
							</button>
						</div>
					</div>

					{/* Список слоев */}
					<div style={{padding: '4px 0'}}>
						{KNOWN_LAYERS.map((layer) => (
							<label
								key={layer.name}
								style={{
									display: 'flex',
									alignItems: 'center',
									padding: '6px 12px',
									cursor: 'pointer',
									transition: 'background-color 0.2s'
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = '#f8f9fa';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'transparent';
								}}
							>
								<input
									type="checkbox"
									checked={value.includes(layer.name)}
									onChange={(e) => handleToggle(layer.name, e.target.checked)}
									style={{marginRight: '8px'}}
								/>
								<span style={{fontSize: '14px'}}>
                  {layer.title}
									<small style={{color: '#6c757d', marginLeft: '4px'}}>
                    ({layer.name})
                  </small>
                </span>
							</label>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
