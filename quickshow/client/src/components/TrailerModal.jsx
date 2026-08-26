import React from 'react';
import { X } from 'lucide-react';

export default function TrailerModal({ movie, isOpen, onClose }) {
  if (!isOpen) return null;

  const getYouTubeId = (url) => {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : '';
  };

  const youtubeId = getYouTubeId(movie?.trailer);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-slate-300 transition"
        >
          <X size={32} />
        </button>

        <div className="bg-black rounded-lg overflow-hidden">
          <div className="aspect-video">
            {youtubeId ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={movie?.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#141414]">
                <p className="text-white">Trailer not available</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-[#141414]">
            <h3 className="text-white font-bold text-lg">{movie?.title}</h3>
            <p className="text-slate-400 text-sm mt-1">{movie?.overview}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

