import { useState } from 'react';
import { Lightbox } from './Lightbox';

interface Props {
  images: string[];
}

export function ImageGrid({ images }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const count = images.length;
  if (count === 0) return null;

  return (
    <>
      {count === 1 && (
        <div className="overflow-hidden rounded-xl aspect-[6/4] bg-black/20">
          <img
            src={images[0]}
            alt=""
            className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
            onClick={() => setLightboxIndex(0)}
          />
        </div>
      )}

      {count >= 2 && (
        <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-xl aspect-[6/4] bg-black/20">
          {images.slice(0, 2).map((src, i) => (
            <div key={i} className="relative">
              <img
                src={src}
                alt=""
                className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                loading="lazy"
                onClick={() => setLightboxIndex(i)}
              />
              {i === 1 && count > 2 && (
                <div
                  className="absolute bottom-2 right-2 bg-black/70 text-white text-sm font-semibold px-2 py-0.5 rounded cursor-pointer"
                  onClick={() => setLightboxIndex(1)}
                >
                  +{count - 2}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, i! - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(images.length - 1, i! + 1))}
        />
      )}
    </>
  );
}
