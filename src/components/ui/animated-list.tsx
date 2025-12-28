"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export interface AnimatedListProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

export function AnimatedList({
  className,
  children,
  delay = 1000,
}: AnimatedListProps) {
  const [index, setIndex] = useState(0);
  const childrenArray = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % childrenArray.length);
    }, delay);

    return () => clearInterval(interval);
  }, [childrenArray.length, delay]);

  const itemsToShow = useMemo(() => {
    const result = childrenArray.slice(0, index + 1).reverse();
    return result;
  }, [index, childrenArray]);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <AnimatePresence>
        {itemsToShow.map((item, idx) => (
          <AnimatedListItem key={(item as any).key || idx}>
            {item}
          </AnimatedListItem>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
  const animations = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: "spring", stiffness: 350, damping: 40 },
  };

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  );
}
