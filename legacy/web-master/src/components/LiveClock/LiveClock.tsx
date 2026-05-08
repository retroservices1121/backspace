import { useTheme } from 'styled-components';

import { Clock, HourHand, MinuteHand } from './styled';

interface OwnProps {
  hour: number;
  minute: number;
}

// I want the clock to spin when a user clicks on it.
export default function LiveClock({ hour, minute }: OwnProps) {
  const theme = useTheme();
  const updatedHour = ((hour * 30) - 90);
  const updatedMinute = ((minute * 6) - 90);


  return (
    <div className="flex justify-center">
      <Clock>
        <MinuteHand position={updatedMinute}/>

        <HourHand position={updatedHour}>
          <div style={{ background: theme.fontPrimary }} className="w-2/3 h-full rounded-full" />
        </HourHand>
        <div style={{ background: theme.fontPrimary }} className="absolute right-[6.3px] w-[3.2px] h-[3.2px] rounded-full origin-left" />
      </Clock>
    </div>
  );
}

