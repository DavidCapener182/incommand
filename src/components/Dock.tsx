"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Children,
  cloneElement,
  useEffect,
  useRef,
  useState,
  ReactNode,
  MouseEvent,
} from "react";
import React from "react";
import { MotionValue } from "framer-motion";

interface DockItemProps {
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  mouseX: MotionValue<number>;
  spring: { stiffness: number; damping: number };
  distance: number;
  magnification: number;
  baseItemSize: number;
  label: string;
}

export function DockItem({
  children,
  className = "",
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  label,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize,
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  // Keyboard accessibility: trigger onClick for Enter/Space
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick(e as any);
    }
  };

  return (
    <motion.div
      ref={ref}
      style={{
        width: size,
        height: size,
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={label || ''}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center justify-center rounded-full bg-[#23408e] dark:bg-gray-800 border-blue-900 dark:border-gray-700 border-2 shadow-md text-white ${className}`}
    >
      {/* Animated label on hover/focus */}
      {label && (
        <AnimatePresence>
          {isHovered.get() === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-full mr-3 px-3 py-1 rounded-lg bg-white/90 dark:bg-gray-900/90 text-[#23408e] dark:text-white text-sm font-semibold shadow-lg pointer-events-none select-none"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            >
              {label}
            </motion.div>
          )}
        </AnimatePresence>
      )}
      {Children.map(children, (child) =>
        React.isValidElement(child) ? cloneElement(child as React.ReactElement<any>, { isHovered }) : child
      )}
    </motion.div>
  );
}

interface DockLabelProps {
  children: ReactNode;
  className?: string;
  isHovered: MotionValue<number>;
}

export function DockLabel({ children, className = "", isHovered }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`${className} absolute -top-6 left-1/2 w-fit -translate-x-1/2 bg-neutral-900 text-white text-xs px-2 py-1 rounded shadow-lg z-50`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface DockItemConfig {
  icon: ReactNode;
  label?: string;
  onClick?: () => void;
  className?: string;
}

interface DockProps {
  items: DockItemConfig[];
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
  className?: string;
}

const Dock: React.FC<DockProps> = ({
  items,
  panelHeight = 68,
  baseItemSize = 50,
  magnification = 70,
  className = "",
}) => {
  const mouseX = useMotionValue(0);
  const spring = {
    stiffness: 300,
    damping: 20,
  };
  const distance = 60;

  return (
    <div
      role="navigation"
      aria-label="Floating action bar"
      className={`fixed bottom-0 right-6 left-auto z-[100] flex items-end justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full px-4 py-2 shadow-2xl border border-neutral-200 dark:border-gray-700 ${className}`}
      style={{ height: panelHeight, minWidth: baseItemSize * items.length + 32 }}
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(-9999)}
    >
      {items.map((item, i) => (
        <DockItem
          key={i}
          mouseX={mouseX}
          spring={spring}
          distance={distance}
          magnification={magnification}
          baseItemSize={baseItemSize}
          label={item.label || ''}
          onClick={item.onClick}
          className={item.className}
        >
          {item.icon}
        </DockItem>
      ))}
    </div>
  );
};

export default Dock; 