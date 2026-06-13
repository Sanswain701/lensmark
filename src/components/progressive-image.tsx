import { useState, type ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
aspectRatio?: number; // width / height
};

/**

* Editorial progressive image: muted placeholder + soft blur-to-sharp fade.
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
aspectRatio: aspectRatio ? "${aspectRatio}" : undefined,
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
style={{
filter: loaded
? "contrast(1.08) saturate(1.12) brightness(0.96)"
: undefined,
}}
className={"h-full w-full object-cover transition-[opacity,filter] duration-[900ms] ease-[var(--ease-luxury)] ${ loaded ? "opacity-100 blur-0" : "opacity-0 blur-md" } ${className}"}
/>
</div>
);
  }
