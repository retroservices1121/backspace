import Svg, { G, Path, Rect } from 'react-native-svg';
import { colors } from '@/constants/theme';

/** Canonical Backspace glyph, drawn in its own viewBox "0 6.47 88.65 58.09". */
const GLYPH_PATH = 'M80.17,14.93A28.8,28.8,0,0,0,59.74,6.47H25.07a18.8,18.8,0,0,0-14.94,7.37L.34,26.62H59.43a9,9,0,0,1,9,7.59,8.76,8.76,0,0,1-8.67,9.9H0l9.61,12.7a18.85,18.85,0,0,0,15,7.46H59c16,0,29.48-12.63,29.65-28.6A28.83,28.83,0,0,0,80.17,14.93Z';
const GLYPH = { minY: 6.47, width: 88.65, height: 58.09 };

const TILE = 48;
const TILE_RADIUS = 14;
/** The glyph spans about 56% of the tile width and keeps its aspect ratio. */
const GLYPH_SCALE = (TILE * 0.56) / GLYPH.width;
const GLYPH_X = (TILE - GLYPH.width * GLYPH_SCALE) / 2;
const GLYPH_Y = (TILE - GLYPH.height * GLYPH_SCALE) / 2;
const GLYPH_TRANSFORM = `translate(${GLYPH_X} ${GLYPH_Y}) scale(${GLYPH_SCALE}) translate(0 ${-GLYPH.minY})`;

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${TILE} ${TILE}`} accessibilityLabel="Backspace">
      <Rect width={TILE} height={TILE} rx={TILE_RADIUS} fill={colors.brand} />
      <G transform={GLYPH_TRANSFORM}>
        <Path d={GLYPH_PATH} fill="#FFFFFF" />
      </G>
    </Svg>
  );
}
