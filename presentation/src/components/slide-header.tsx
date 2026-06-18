import type { CSSProperties, ReactNode } from "react";
import { Eyebrow, SlideSubtitle, SlideTitle } from "./motion";

/** Centers eyebrow, title, and subtitle as a group above full-width slide body content. */
export function SlideHeader({
  eyebrow,
  title,
  subtitle,
  titleClassName,
  subtitleClassName
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}) {
  return (
    <div className="flex w-full flex-col items-center text-center">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <SlideTitle className={titleClassName}>{title}</SlideTitle>
      {subtitle ? <SlideSubtitle className={subtitleClassName}>{subtitle}</SlideSubtitle> : null}
    </div>
  );
}

export function SlideBody({
  children,
  className = "",
  style
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`w-full ${className}`} style={style}>
      {children}
    </div>
  );
}
