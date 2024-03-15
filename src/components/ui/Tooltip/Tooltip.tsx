import { Tooltip as MUITooltip, TooltipProps } from '@mui/material';
import { ReactElement } from 'react';

const Tooltip = (props: TooltipProps): ReactElement => {
  return (
    <MUITooltip
      {...props}
      PopperProps={{
        style: { height: 'fit-content', width: 'fit-content' },
        disablePortal: true,
      }}
    >
      {props.children}
    </MUITooltip>
  );
};

export default Tooltip;
