import { useRef, useState } from 'react';
import { Play } from 'lucide-react';

interface VideoProps {
  videoSrc: string;
  thumbnailSrc: string;
}

const SimpleVideo: React.FC<VideoProps> = ({ videoSrc, thumbnailSrc }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = () => {
    if (videoRef.current) {
      setIsPlaying(true);
      videoRef.current.play();
    }
  };

  return (
    <div className="relative w-[250px] h-[250px] rounded-xl overflow-hidden">
      <video 
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-cover"
        poster={thumbnailSrc}
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
    </div>
  );
};

export default SimpleVideo;