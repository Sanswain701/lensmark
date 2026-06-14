import { useState, type ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  aspectRatio?: number; // width / height
};

/**
 * Editorial progressive image: subtle surface placeholder + soft blur-to-sharp fade.
 * Preserves original aspect ratio so layout doesn't shift during load.
 */
export function ProgressiveImage({
  aspectRatio,
  className = "",
  style,
  onLoad,
  ...rest
}: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="relative overflow-hidden bg-[image:var(--gradient-surface)]"
      style={{
        aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
        ...style,
      }}
    >
      <img
        {...rest}
        loading={rest.loading ?? "lazy"}
        decoding={rest.decoding ?? "async"}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        className={`h-full w-full object-cover transition-opacity duration-700 ease-[var(--ease-luxury)] ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`}
      />
    </div>
  );
}