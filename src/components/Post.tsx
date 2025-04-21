"use client";

import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";

interface PostProps {
  id: number;
  user: {
    name: string;
    avatar: string;
  };
  image: string;
  likes: number;
  shares: number;
  caption: string;
  comments: number;
  timeAgo: string;
}

export default function Post({
  // id,
  user,
  image,
  likes,
  shares,
  caption,
  comments,
  timeAgo,
}: PostProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    // Here you would typically update the like count on the server
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // Here you would typically save/unsave the post on the server
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img
            src={user.avatar || "/placeholder.svg"}
            alt={user.name}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <h3 className="text-white font-medium">{user.name}</h3>
            <p className="text-gray-400 text-sm">{timeAgo}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-white">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Post Image */}
      <div className="relative aspect-square">
        <img
          src={image || "/placeholder.svg"}
          alt="Post content"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              className={`text-gray-400 hover:text-white flex items-center space-x-1 ${
                isLiked ? "text-red-500" : ""
              }`}
              onClick={handleLike}
            >
              <Heart
                className="h-6 w-6"
                fill={isLiked ? "currentColor" : "none"}
              />
              <span>{likes}</span>
            </button>
            <button className="text-gray-400 hover:text-white flex items-center space-x-1">
              <MessageCircle className="h-6 w-6" />
              <span>{comments}</span>
            </button>
            <button className="text-gray-400 hover:text-white flex items-center space-x-1">
              <Share2 className="h-6 w-6" />
              <span>{shares}</span>
            </button>
          </div>
          <button
            className={`text-gray-400 hover:text-white ${
              isSaved ? "text-yellow-500" : ""
            }`}
            onClick={handleSave}
          >
            <Bookmark
              className="h-6 w-6"
              fill={isSaved ? "currentColor" : "none"}
            />
          </button>
        </div>

        {/* Caption */}
        <p className="text-white mb-2">{caption}</p>

        {/* Comments */}
        <button className="text-gray-400 text-sm hover:text-white">
          View all {comments} comments
        </button>

        {/* Comment Input */}
        <div className="mt-4 relative">
          <input
            type="text"
            placeholder="Add a comment..."
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
