interface WallpaperProps {
  src: string;
  alt: string;
  loaded: boolean;
}

export function Wallpaper({ src, alt, loaded }: WallpaperProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-[800ms] ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}
