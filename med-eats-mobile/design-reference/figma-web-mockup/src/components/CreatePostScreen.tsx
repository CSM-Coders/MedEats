import { useState } from "react";
import { Upload, Image as ImageIcon, Star, MapPin, Check } from "lucide-react";
import { restaurants } from "../data/mockData";
import { useNavigate } from "react-router";

export function CreatePostScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  const [rating, setRating] = useState(0);
  const [caption, setCaption] = useState("");
  const [showRestaurantList, setShowRestaurantList] = useState(false);
  const navigate = useNavigate();

  const handleImageUpload = () => {
    // Simulate image upload - in a real app this would use file input
    const sampleImages = [
      "https://images.unsplash.com/photo-1702827496422-edff3a844c9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmVwYXMlMjBDb2xvbWJpYW4lMjBmb29kJTIwY2xvc2UlMjB1cHxlbnwxfHx8fDE3NzAwNzYzNjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      "https://images.unsplash.com/photo-1723693407562-bb4fcae76797?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5kZWphJTIwcGFpc2ElMjBDb2xvbWJpYW4lMjBmb29kfGVufDF8fHx8MTc3MDA3NjM1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      "https://images.unsplash.com/photo-1761315413256-e149b40f577b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXJnZXIlMjBnb3VybWV0JTIwZm9vZCUyMHBob3RvZ3JhcGh5fGVufDF8fHx8MTc3MDA1MjczMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    ];
    setSelectedImage(sampleImages[Math.floor(Math.random() * sampleImages.length)]);
  };

  const handlePublish = () => {
    if (selectedImage && selectedRestaurant && rating > 0 && caption) {
      // In a real app, this would send data to backend
      alert("Post published successfully! 🎉");
      navigate("/feed");
    } else {
      alert("Please complete all fields before publishing");
    }
  };

  const selectedRestaurantData = restaurants.find(r => r.id === selectedRestaurant);

  return (
    <div className="h-full overflow-y-auto bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 pt-12 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Create Post</h1>
        <p className="text-sm text-gray-500">Share your food experience</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block font-semibold text-gray-900 mb-3">
            Upload Photo or Video
          </label>
          {selectedImage ? (
            <div className="relative">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full aspect-square object-cover rounded-2xl"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={handleImageUpload}
              className="w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-gray-100 hover:border-[#FF6B35] transition-all group"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <ImageIcon className="w-8 h-8 text-[#FF6B35]" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Upload Image</p>
                <p className="text-xs text-gray-500">Tap to select photo</p>
              </div>
            </button>
          )}
        </div>

        {/* Select Restaurant */}
        <div>
          <label className="block font-semibold text-gray-900 mb-3">
            Select Restaurant
          </label>
          <button
            onClick={() => setShowRestaurantList(!showRestaurantList)}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-left hover:bg-gray-100 transition-all"
          >
            {selectedRestaurantData ? (
              <div className="flex items-center gap-3">
                <img
                  src={selectedRestaurantData.image}
                  alt={selectedRestaurantData.name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {selectedRestaurantData.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedRestaurantData.category}
                  </p>
                </div>
                <Check className="w-5 h-5 text-[#FF6B35]" />
              </div>
            ) : (
              <div className="flex items-center gap-3 text-gray-500">
                <MapPin className="w-5 h-5" />
                <span>Choose a restaurant</span>
              </div>
            )}
          </button>

          {/* Restaurant List */}
          {showRestaurantList && (
            <div className="mt-3 bg-white border border-gray-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
              {restaurants.map((restaurant) => (
                <button
                  key={restaurant.id}
                  onClick={() => {
                    setSelectedRestaurant(restaurant.id);
                    setShowRestaurantList(false);
                  }}
                  className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-all border-b border-gray-100 last:border-b-0"
                >
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 text-sm">
                      {restaurant.name}
                    </p>
                    <p className="text-xs text-gray-500">{restaurant.category}</p>
                  </div>
                  {selectedRestaurant === restaurant.id && (
                    <Check className="w-5 h-5 text-[#FF6B35]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rating */}
        <div>
          <label className="block font-semibold text-gray-900 mb-3">
            Your Rating
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-12 h-12 ${
                    star <= rating
                      ? "fill-[#FF6B35] text-[#FF6B35]"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {rating === 5 && "Excellent! 🌟"}
              {rating === 4 && "Very Good! 👍"}
              {rating === 3 && "Good 😊"}
              {rating === 2 && "Fair 😐"}
              {rating === 1 && "Poor 😞"}
            </p>
          )}
        </div>

        {/* Caption */}
        <div>
          <label className="block font-semibold text-gray-900 mb-3">
            Add Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Share your thoughts about this place... What did you try? What did you love?"
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-[#FF6B35] transition-all resize-none"
            rows={4}
          />
          <p className="text-xs text-gray-500 mt-2">
            {caption.length}/500 characters
          </p>
        </div>

        {/* Publish Button */}
        <button
          onClick={handlePublish}
          className="w-full py-4 bg-[#FF6B35] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#E63946] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!selectedImage || !selectedRestaurant || rating === 0 || !caption}
        >
          <Upload className="w-5 h-5" />
          Publish Post
        </button>

        {/* Save Draft Button */}
        <button className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all">
          Save as Draft
        </button>
      </div>
    </div>
  );
}
