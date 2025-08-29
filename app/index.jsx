import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

const index = () => {
    const router = useRouter();
    return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="large" color="#0000ff" />
        </View>
    )
}

export default index;