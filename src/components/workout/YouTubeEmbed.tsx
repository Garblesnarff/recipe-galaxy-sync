interface YouTubeEmbedProps {
  videoId: string;
  width?: string;
  height?: string;
  autoplay?: boolean;
  title: string;
  className?: string;
}

export const YouTubeEmbed = ({
  videoId,
  width = "100%",
  height = "100%",
  autoplay = false,
  title,
  className = "",
}: YouTubeEmbedProps) => {
  // Construct the YouTube embed URL with parameters
  const embedUrl = `https://www.youtube.com/embed/${videoId}?${
    autoplay ? "autoplay=1&" : ""
  }rel=0&modestbranding=1`;

  return (
    <div className={`relative w-full ${className}`} style={{ paddingBottom: "56.25%" }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        style={{ width, height }}
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
};
