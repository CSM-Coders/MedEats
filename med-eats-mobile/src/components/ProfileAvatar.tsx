import React, { useEffect, useState } from "react";
import { Image, StyleSheet } from "react-native";
import DefaultAvatar from "@/src/components/DefaultAvatar";

type Props = {
  uri?: string | null;
  size?: number;
};

export default function ProfileAvatar({ uri, size = 80 }: Props) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  const normalizedUri = typeof uri === "string" ? uri.trim() : "";
  if (!normalizedUri || hasError) {
    return <DefaultAvatar size={size} />;
  }

  return (
    <Image
      source={{ uri: normalizedUri }}
      style={[
        styles.image,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: "cover",
    backgroundColor: "#ECEDEF",
  },
});
