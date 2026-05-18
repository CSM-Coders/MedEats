import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp, Image } from "react-native";

type Props = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export default function DefaultAvatar({ size = 80, style }: Props) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <Image
        source={require("../../assets/images/default-profile-avatar.png")}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ECEDEF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    resizeMode: "cover",
  },
});
