import { useRef, useState } from 'react';
import { Play, Image } from 'lucide-react';

interface VideoProps {
  videoSrc: string;
  mediaType?: 'video' | 'image';
}

// Helper function to determine if a URL is a video
const isVideo = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

const SimpleVideo: React.FC<VideoProps> = ({ videoSrc, mediaType }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Determine media type if not explicitly set
  const actualMediaType = mediaType || (isVideo(videoSrc) ? 'video' : 'image');

  const handlePlayClick = () => {
    if (videoRef.current && actualMediaType === 'video') {
      setIsPlaying(true);
      videoRef.current.play();
    }
  };

  return (
    <div className="relative w-[250px] h-[250px] rounded-xl overflow-hidden">
      {actualMediaType === 'video' ? (
        <>
          <video 
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-cover"
            // poster={thumbnailSrc}
            controls={isPlaying}
            preload="metadata"
          />
          
          {!isPlaying && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
              onClick={handlePlayClick}
            >
              <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                <Play className="w-8 h-8 text-white fill-current" />
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <img 
            src={videoSrc}
            alt="Post content"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src ='/placeholder.svg';
            }}
          />
          
          {/* Image overlay with icon */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors">
            <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Image className="w-8 h-8 text-white" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SimpleVideo;