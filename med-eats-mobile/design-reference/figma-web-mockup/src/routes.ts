import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { MapScreen } from "./components/MapScreen";
import { FeedScreen } from "./components/FeedScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { CreatePostScreen } from "./components/CreatePostScreen";
import { RestaurantDetailScreen } from "./components/RestaurantDetailScreen";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: MapScreen },
      { path: "feed", Component: FeedScreen },
      { path: "create", Component: CreatePostScreen },
      { path: "profile", Component: ProfileScreen },
      { path: "restaurant/:id", Component: RestaurantDetailScreen },
      { path: "*", Component: NotFound }
    ]
  }
]);
