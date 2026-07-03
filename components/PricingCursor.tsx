import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface PricingCursorProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function PricingCursor({ containerRef }: PricingCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    const cursor = cursorRef.current;
    if (!container || !cursor) return;

    const onEnter = () => {
      posRef.current = { x: targetRef.current.x, y: targetRef.current.y };
      cursor.style.opacity = "1";
    };

    const onLeave = () => {
      cursor.style.opacity = "0";
    };

    const onMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      const pos = posRef.current;
      const target = targetRef.current;
      pos.x += (target.x - pos.x) * 0.15;
      pos.y += (target.y - pos.y) * 0.15;
      cursor.style.transform = `translate(${pos.x - 20}px, ${pos.y - 20}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };

    container.addEventListener("mouseenter", onEnter);
    container.addEventListener("mouseleave", onLeave);
    container.addEventListener("mousemove", onMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener("mouseenter", onEnter);
      container.removeEventListener("mouseleave", onLeave);
      container.removeEventListener("mousemove", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);

  return createPortal(
    <div
      ref={cursorRef}
      className="pointer-events-none fixed top-0 left-0 z-[9999] opacity-0"
      style={{ willChange: "transform" }}
    >
      <div className="h-10 w-10 rounded-full border-2 border-violet-400/60 bg-violet-500/20 shadow-[0_0_30px_12px_rgba(139,92,246,0.2)] backdrop-blur-sm" />
    </div>,
    document.body
  );
}
