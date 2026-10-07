import type { ComponentProps, ReactNode } from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
type Props = ComponentProps<typeof Svg> & { color?: string };
function Base({ children, color = 'currentColor', ...props }: Props & { children: ReactNode }) { return <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</Svg>; }
export function HomeIcon(props: Props) { return <Base {...props}><Path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></Base>; }
export function MarketsIcon(props: Props) { return <Base {...props}><Path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></Base>; }
export function BagIcon(props: Props) { return <Base {...props}><Path d="M6 8h12l1 13H5L6 8Z" /><Path d="M9 8V6a3 3 0 0 1 6 0v2" /></Base>; }
export function UserIcon(props: Props) { return <Base {...props}><Circle cx="12" cy="8" r="4" /><Path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></Base>; }
export function PlusIcon(props: Props) { return <Base {...props}><Line x1="12" y1="5" x2="12" y2="19" /><Line x1="5" y1="12" x2="19" y2="12" /></Base>; }
export function SearchIcon(props: Props) { return <Base {...props}><Circle cx="11" cy="11" r="7" /><Line x1="16" y1="16" x2="21" y2="21" /></Base>; }
export function ArrowLeftIcon(props: Props) { return <Base {...props}><Path d="m15 18-6-6 6-6" /></Base>; }
export function ChevronRightIcon(props: Props) { return <Base {...props}><Path d="m9 18 6-6-6-6" /></Base>; }
export function RefreshIcon(props: Props) { return <Base {...props}><Path d="M20 7v5h-5" /><Path d="M19 12a7 7 0 1 1-2-5" /></Base>; }
export function SparkIcon(props: Props) { return <Base {...props}><Path d="m12 2 1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2Z" /><Path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></Base>; }
export function LogoMark({ size = 32 }: { size?: number }) { return <Svg width={size} height={size} viewBox="0 0 48 48"><Rect width="48" height="48" rx="14" fill="#5822FB" /><Path d="M15 13v22M15 16h10a8 8 0 0 1 0 16H15M15 24h11" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></Svg>; }
