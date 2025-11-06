import { useTranslation } from 'react-i18next';

interface LoadingIndicatorProps {
	isLoading: boolean;
}

export default function LoadingIndicator({ isLoading }: LoadingIndicatorProps) {
	const { t } = useTranslation();

	if (!isLoading) return null;

	return (
		<div style={{
			position: 'absolute',
			top: '50%',
			left: '50%',
			transform: 'translate(-50%, -50%)',
			background: 'rgba(255,255,255,0.9)',
			padding: '16px 24px',
			borderRadius: 8,
			boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
			zIndex: 1001
		}}>
			{t('loading')}...
		</div>
	);
}
