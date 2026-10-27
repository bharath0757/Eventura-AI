import "server-only";
import { getImageProps, type ImageProps } from "next/image";

type OptimizedImageProps = Pick<
  ImageProps,
  | "src"
  | "alt"
  | "width"
  | "height"
  | "className"
  | "fill"
  | "sizes"
  | "quality"
  | "loading"
  | "fetchPriority"
>;

/** Keep responsive image optimization on the server for static landing photos. */
export function OptimizedImage(props: OptimizedImageProps) {
  const { props: image } = getImageProps(props);
  // eslint-disable-next-line @next/next/no-img-element -- getImageProps supplies Next.js optimized image URLs and responsive attributes.
  return <img {...image} alt={image.alt} />;
}
