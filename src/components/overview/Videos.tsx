import { useRef, useState, useEffect } from 'react';
import video from '../../assets/video.mp4';
import pic from '../../assets/lanez.jpg';
import thumb2 from '../../assets/thumb2.jpg';
import thumb3 from '../../assets/thumb3.jpg';

import CustomButton from './customButton';
import { Play, Image } from 'lucide-react';

type Post = {
  id: number;
  author: {
    name: string;
    avatar: string;
  };
  timeAgo: string;
  mediaSrc: string;
  mediaType: 'video' | 'image';
};

const postsData: Post[] = [
  {
    id: 1,
    author: {
      name: "John Smith",
      avatar: pic
    },
    timeAgo: "2 days ago",
    mediaSrc: video,
    mediaType: 'video'
  },
  {
    id: 2,
    author: {
      name: "Sarah John",
      avatar: pic
    },
    timeAgo: "1 day ago",
    mediaSrc: video,
    mediaType: 'video'
  },
  {
    id: 3,
    author: {
      name: "Mike Wilson",
      avatar: pic
    },
    timeAgo: "5 hours ago",
    mediaSrc: thumb3,
    mediaType: 'image'
  },
  {
    id: 4,
    author: {
      name: "Mike Wilson",
      avatar: pic
    },
    timeAgo: "5 hours ago",
    mediaSrc: video,
    mediaType: 'video'
  },
];

interface SocialPostProps {
  extraStyles?: string;
}

// Helper function to determine if a URL is a video
const isVideo = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

const SocialPost: React.FC<SocialPostProps & { post: Post }> = ({ post, extraStyles }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const PREVIEW_DURATION = 300;

  // Determine media type if not explicitly set
  const mediaType = post.mediaType || (isVideo(post.mediaSrc) ? 'video' : 'image');

  useEffect(() => {
    const video = videoRef.current;
    if (!video || mediaType !== 'video') return;
  
    const handleTimeUpdate = () => {
      if (video.currentTime >= PREVIEW_DURATION) {
        video.currentTime = 0;
      }
    };
  
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [mediaType]);

  const handlePlayClick = () => {
    if (videoRef.current && mediaType === 'video') {
      setIsPlaying(true);
      videoRef.current.play();
    }
  };

  return (
    <div className={`w-[372px] min-w-[372px] mx-2 first:ml-0 last:mr-0 ${extraStyles}`}>
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="relative w-[372px] h-[372px]">
          {/* Dark gradient overlay for header */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/70 to-transparent z-10" />
          
          {/* Header content */}
          <div className="absolute top-0 left-0 right-0 px-4 py-2 flex justify-between items-center z-20">
            <div className="flex items-center justify-center bg-black1 text-white rounded-full px-4 py-2 space-x-2">
              <img 
                src={post.author.avatar} 
                alt="" 
                className="w-8 h-8 rounded-full border border-white/30"
              />
              <span className="font-medium">{post.author.name}</span>
            </div>
            <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm text-white/80 text-sm rounded-full px-4 py-2">
              <span>{post.timeAgo}</span>
            </div>
          </div>

          {/* Media Container */}
          <div className="relative h-full">
            {mediaType === 'video' ? (
              <>
                <video 
                  ref={videoRef}
                  src={post.mediaSrc}
                  className="w-full h-full object-cover rounded-xl"
              
                  controls={isPlaying}
                  preload="metadata"
                />
                
                {!isPlaying && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer rounded-xl"
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
                  src={post.mediaSrc}
                  alt="Post content"
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    e.currentTarget.src ='/placeholder.svg';
                  }}
                />
                
                {/* Image overlay with icon */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Image className="w-8 h-8 text-white" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex px-1 py-3 gap-4">
          <CustomButton
            text="Discard"
            bgColor="#44454A"
            textColor="white"
            border="none"
            extraStyles={{ flex: 1, borderRadius: '0.75rem', padding: '0.75rem' }}
          />
          <CustomButton
            text="Approve"
            bgColor="#006FFD"
            textColor="white"
            border="none"
            extraStyles={{ flex: 1, borderRadius: '0.75rem', padding: '0.75rem' }}
          />
        </div>
      </div>
    </div>
  );
};

const SocialFeed = ({ showFourPosts = false }) => {
  const displayedPosts = showFourPosts ? postsData : postsData.slice(0, 3);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex flex-nowrap p-4">
        {displayedPosts.map(post => (
          <SocialPost key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default SocialFeed;