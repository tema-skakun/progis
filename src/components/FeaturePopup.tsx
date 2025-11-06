import { useTranslation } from 'react-i18next';
import { FoundFeature } from '../types';

interface FeaturePopupProps {
	feature: FoundFeature;
	onClose: () => void;
}

export default function FeaturePopup({ feature, onClose }: FeaturePopupProps) {
	const { t } = useTranslation();

	if (!feature) {
		return null;
	}

	return (
		<div style={{
			position: 'absolute',
			top: 12,
			right: 12,
			width: 400,
			maxHeight: 'calc(100vh - 100px)',
			background: '#fff',
			borderRadius: 8,
			boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
			zIndex: 1000,
			display: 'flex',
			flexDirection: 'column'
		}}>
			{/* Заголовок */}
			<div style={{
				padding: '12px 16px',
				borderBottom: '1px solid #e5e7eb',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				background: '#f8f9fa'
			}}>
				<h4 style={{ margin: 0, fontSize: '16px' }}>
					{feature.typename}
				</h4>
				<button
					onClick={onClose}
					style={{
						background: 'none',
						border: 'none',
						fontSize: '18px',
						cursor: 'pointer',
						color: '#6b7280',
						padding: 4,
						borderRadius: 4
					}}
				>
					×
				</button>
			</div>

			{/* Содержимое с прокруткой */}
			<div style={{
				padding: 16,
				overflowY: 'auto',
				flex: 1
			}}>
				{Object.keys(feature.props).length === 0 ? (
					<p style={{ color: '#6b7280', textAlign: 'center' }}>
						{t('noProperties')}
					</p>
				) : (
					<table style={{
						width: '100%',
						borderCollapse: 'collapse',
						fontSize: '14px'
					}}>
						<tbody>
						{Object.entries(feature.props).map(([key, value]) => (
							<tr key={key} style={{ borderBottom: '1px solid #f3f4f6' }}>
								<td style={{
									padding: '8px 12px 8px 0',
									fontWeight: 600,
									color: '#374151',
									verticalAlign: 'top',
									whiteSpace: 'nowrap'
								}}>
									{key}
								</td>
								<td style={{
									padding: '8px 0',
									color: '#6b7280',
									wordBreak: 'break-word'
								}}>
									{String(value)}
								</td>
							</tr>
						))}
						</tbody>
					</table>
				)}
			</div>

			{/* Футер */}
			<div style={{
				padding: '12px 16px',
				borderTop: '1px solid #e5e7eb',
				background: '#f8f9fa',
				fontSize: '12px',
				color: '#6b7280'
			}}>
				{feature.fid && `ID: ${feature.fid}`}
				{!feature.fid && t('featureInfo')}
			</div>
		</div>
	);
}
