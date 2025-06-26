import React from 'react';
import { Stage } from 'react-konva';

interface CanvasContainerProps {
  stageRef: React.RefObject<any>;
  width: number;
  height: number;
  draggable: boolean;
  children: React.ReactNode;
  onMouseDown: (e: any) => void;
  onMouseMove: (e: any) => void;
  onMouseUp: (e: any) => void;
}

const CanvasContainer: React.FC<CanvasContainerProps> = ({
  stageRef,
  width,
  height,
  draggable,
  children,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}) => {
  return (
    <div style={{ border: '1px solid #000', width, height }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        draggable={draggable}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        {children}
      </Stage>
    </div>
  );
};

export default CanvasContainer;
