import { useState } from "react";
import { FaGripVertical } from "react-icons/fa";
import { FaHandDots } from "react-icons/fa6";

interface ResizableDivProps {
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  initialWidth?: number;
  style?: React.CSSProperties;
}

const ResizableDiv: React.FC<ResizableDivProps> = ({
  children,
  minWidth = 200,
  maxWidth = 800,
  initialWidth = 400,
  style={
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
  }
}) => {
  const [width, setWidth] = useState(initialWidth);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent that the user can select text
    e.preventDefault();

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    // Prevent that the user can select text
    e.preventDefault();

    setWidth((prevWidth) => {
        const newWidth = prevWidth + e.movementX;
        return Math.max(minWidth, Math.min(maxWidth, newWidth));
    });
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
        style={{
            ...style, 
            width: width,
            minWidth: minWidth,
            maxWidth: maxWidth,
            overflow: 'hidden',
        }}
    >
        {children}
        <div onMouseDown={handleMouseDown} className="resizeHandle">
            <FaGripVertical />
        </div>
    </div>
  );
};

export default ResizableDiv;
